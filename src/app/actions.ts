"use server";

import { randomInt } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { refresh, revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { getAgent } from "@/db/queries";
import { agent, email, guest, incentive, incentiveType, quoteLayer } from "@/db/schema";
import { renderQuoteEmail } from "@/libs/render";
import {
    currencies,
    heroSrc,
    logoSrc,
    quoteTypes,
    tierLabels,
    tierPlaceholders,
    type Currency,
    type QuoteType,
} from "@/libs/tiers";
import type { Incentive, QuoteEmailData, QuoteLayer } from "@/libs/types";

// No sign-in yet: anyone who can reach the app can call these actions.
// Add an auth check to each one before this is reachable outside your network.

export type FormState = { error?: string; saved?: boolean; values?: Record<string, string | string[]> };

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

function formValues(formData: FormData): Record<string, string | string[]> {
    const values: Record<string, string | string[]> = {};
    for (const key of new Set(formData.keys())) {
        if (key.startsWith("$ACTION")) continue;
        const all = formData.getAll(key).map(String);
        values[key] = key.endsWith(".incentives") ? all : all[0];
    }
    return values;
}

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// Unambiguous characters only (no 0/O, 1/I/L), e.g. "K7QM-3XWD-9PTA".
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
function incentiveCode(): string {
    const group = () => Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
    return `${group()}-${group()}-${group()}`;
}

// Images in the email must be full URLs to load in Outlook, so they're
// resolved against the address the app is being used from.
async function siteOrigin(): Promise<string> {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
}

type TierInput = { priceCents: number; currency: Currency; incentiveIds: string[] };

export async function createQuoteEmail(_prev: FormState, formData: FormData): Promise<FormState> {
    const values = formValues(formData);
    const fail = (error: string): FormState => ({ error, values });

    const currentAgent = await getAgent();
    if (!currentAgent) return fail("Add your agent details on the Settings page first.");

    const guestName = text(formData, "guestName");
    const guestEmail = text(formData, "guestEmail");
    const guestProfileNum = text(formData, "guestProfileNum");
    if (!guestName) return fail("Enter the guest's name.");
    if (!isEmail(guestEmail)) return fail("Enter a valid guest email.");
    if (!guestProfileNum) return fail("Enter the guest's profile number.");

    const tiers = {} as Record<QuoteType, TierInput>;
    for (const type of quoteTypes) {
        const label = tierLabels[type];
        const price = Number(text(formData, `${type}.price`));
        if (!text(formData, `${type}.price`) || !Number.isFinite(price) || price < 0) {
            return fail(`Enter a valid price for the ${label} quote.`);
        }
        const currency = text(formData, `${type}.currency`) as Currency;
        if (!currencies.includes(currency)) return fail(`Pick a currency for the ${label} quote.`);
        const incentiveIds = [...new Set(formData.getAll(`${type}.incentives`).map(String))];
        tiers[type] = { priceCents: Math.round(price * 100), currency, incentiveIds };
    }

    const allIds = [...new Set(quoteTypes.flatMap((t) => tiers[t].incentiveIds))];
    const catalog = allIds.length
        ? await db.select().from(incentiveType).where(inArray(incentiveType.id, allIds))
        : [];
    if (catalog.length !== allIds.length) return fail("One of the selected incentives no longer exists.");
    const byId = new Map(catalog.map((c) => [c.id, c]));

    const layer = (type: QuoteType): QuoteLayer => ({
        price: { price: tiers[type].priceCents / 100, currency: tiers[type].currency },
        description: tierPlaceholders[type].description,
        authformLink: tierPlaceholders[type].authFormLink,
        imageUrl: tierPlaceholders[type].imageSrc,
        incentives: tiers[type].incentiveIds.map((id): Incentive => {
            const c = byId.get(id)!;
            return { id: c.id, title: c.title, description: c.description ?? "", srcImg: c.srcImg ?? "" };
        }),
    });

    const data: QuoteEmailData = {
        guestName,
        guestEmail,
        agent: {
            name: currentAgent.name,
            agentNum: currentAgent.agentNum,
            email: currentAgent.email,
            phone: currentAgent.phone,
            schedule: currentAgent.schedule ?? "",
        },
        promo: layer("promo"),
        upgrade: layer("upgrade"),
        hailMary: layer("hailMary"),
    };
    const html = renderQuoteEmail(data, { logoSrc, heroSrc, baseUrl: await siteOrigin() });

    const emailId = await db.transaction(async (tx) => {
        // Match on profile number so the same guest isn't stored twice.
        const [g] = await tx
            .insert(guest)
            .values({ guestProfileNum, guestName, guestEmail })
            .onConflictDoUpdate({ target: guest.guestProfileNum, set: { guestName, guestEmail } })
            .returning({ id: guest.id });

        const [e] = await tx
            .insert(email)
            .values({ guestId: g.id, agentId: currentAgent.id, html })
            .returning({ id: email.id });

        for (const type of quoteTypes) {
            const t = tiers[type];
            const [l] = await tx
                .insert(quoteLayer)
                .values({
                    emailId: e.id,
                    quoteType: type,
                    priceCents: t.priceCents,
                    currency: t.currency,
                    ...tierPlaceholders[type],
                })
                .returning({ id: quoteLayer.id });

            if (t.incentiveIds.length) {
                await tx.insert(incentive).values(
                    t.incentiveIds.map((incentiveTypeId) => ({
                        incentiveCode: incentiveCode(),
                        quoteLayerId: l.id,
                        incentiveTypeId,
                    })),
                );
            }
        }
        return e.id;
    });

    revalidatePath("/emails", "layout");
    redirect(`/emails/${emailId}`);
}

export async function saveAgent(_prev: FormState, formData: FormData): Promise<FormState> {
    const values = formValues(formData);
    const fields = {
        name: text(formData, "name"),
        agentNum: text(formData, "agentNum"),
        email: text(formData, "email"),
        phone: text(formData, "phone"),
        schedule: text(formData, "schedule"),
    };
    if (!fields.name || !fields.agentNum || !fields.phone) {
        return { error: "Name, agent number and phone are required.", values };
    }
    if (!isEmail(fields.email)) return { error: "Enter a valid email.", values };

    const existing = await getAgent();
    try {
        if (existing) await db.update(agent).set(fields).where(eq(agent.id, existing.id));
        else await db.insert(agent).values(fields);
    } catch (err) {
        if (String(err).includes("UNIQUE")) {
            return { error: "Another agent already uses that agent number.", values };
        }
        throw err;
    }

    refresh();
    return { saved: true, values };
}
