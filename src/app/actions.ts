"use server";

import { randomInt, randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { refresh, revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { getAgent, getEmail } from "@/db/queries";
import { agent, email, guest, incentive, incentiveType, quoteLayer, upload } from "@/db/schema";
import { prepareBanner, prepareCardImage, prepareIcon } from "@/libs/images";
import {
    CODE_MAX,
    DESCRIPTION_MAX,
    TITLE_MAX,
    iconImageTypes,
    iconMaxBytes,
    placeholderIcon,
} from "@/libs/incentives";
import { EmailTooLargeError, inlineImages } from "@/libs/inline-images";
import { appUrl, createDraft, MicrosoftAuthError } from "@/libs/microsoft";
import { QUOTE_EMAIL_SUBJECT, renderQuoteEmail } from "@/libs/render";
import { currentAccount, endSession, requireAccount } from "@/libs/session";
import {
    currencies,
    heroSrc as defaultHeroSrc,
    photoImageMaxBytes,
    photoImageMaxLabel,
    photoImageTypes,
    logoSrc,
    quoteTypes,
    tierLabels,
    tierPlaceholders,
    type Currency,
    type QuoteType,
} from "@/libs/tiers";
import { MAX_NIGHTS, formatStay, isIsoDate } from "@/libs/stay";
import type { Incentive, QuoteEmailData, QuoteLayer } from "@/libs/types";
import { isProfileNum, parsePriceCents } from "@/libs/validation";

// Every action checks for a signed-in, allowed Microsoft account first.
// Actions are reachable by anyone who can send a POST, so proxy.ts alone isn't enough.

export type FormState = { error?: string; saved?: boolean; values?: Record<string, string | string[]> };

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

function formValues(formData: FormData): Record<string, string | string[]> {
    const values: Record<string, string | string[]> = {};
    for (const key of new Set(formData.keys())) {
        if (key.startsWith("$ACTION")) continue;
        // Files can't be sent back to a file input, so they aren't kept.
        const all = formData.getAll(key).filter((v) => typeof v === "string");
        if (all.length === 0) continue;
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

type TierInput = {
    priceCents: number;
    currency: Currency;
    title: string;
    nights: number;
    checkIn: string;
    checkOut: string;
    // Nights and dates as shown in the email, e.g. "5 nights · Mar 12–17, 2027".
    duration: string;
    description: string;
    incentiveIds: string[];
};

// An empty file input still submits a nameless, empty File.
function uploadedFile(formData: FormData, name: string): File | null {
    const value = formData.get(name);
    return value instanceof File && value.size > 0 ? value : null;
}

type Upload = { id: string; contentType: string; data: Buffer };

// Checks and reshapes an optional photo upload. Returns null when none was
// chosen, an Upload ready to store, or an error message for the form.
async function photoUpload(
    formData: FormData,
    name: string,
    label: string,
    prepare: (file: File) => Promise<Buffer | null>,
): Promise<Upload | null | { error: string }> {
    const file = uploadedFile(formData, name);
    if (!file) return null;
    if (!(photoImageTypes as readonly string[]).includes(file.type)) {
        return { error: `The ${label} must be a JPG, PNG, GIF or WebP. Choose the file again.` };
    }
    if (file.size > photoImageMaxBytes) {
        return { error: `The ${label} must be ${photoImageMaxLabel} or smaller. Choose a smaller file.` };
    }
    const data = await prepare(file);
    if (!data) return { error: `The ${label} couldn't be read. Try a different file.` };
    return { id: randomUUID(), contentType: "image/jpeg", data };
}

export async function createQuoteEmail(_prev: FormState, formData: FormData): Promise<FormState> {
    await requireAccount();
    const values = formValues(formData);
    const fail = (error: string): FormState => ({ error, values });

    const currentAgent = await getAgent();
    if (!currentAgent) return fail("Add your agent details on the Settings page first.");

    const guestName = text(formData, "guestName");
    const guestEmail = text(formData, "guestEmail");
    const guestProfileNum = text(formData, "guestProfileNum");
    if (!guestName) return fail("Enter the guest's name.");
    if (!isEmail(guestEmail)) return fail("Enter a valid guest email.");
    if (!isProfileNum(guestProfileNum)) return fail("The profile number must be exactly 6 digits.");

    // The uploads' ids are picked up front so the email can link to them; the
    // rows themselves are written in the same transaction as the email.
    const heroUpload = await photoUpload(formData, "heroImage", "banner image", prepareBanner);
    if (heroUpload && "error" in heroUpload) return fail(heroUpload.error);

    const tierUploads = {} as Record<QuoteType, Upload | null>;
    for (const type of quoteTypes) {
        const result = await photoUpload(formData, `${type}.image`, `${tierLabels[type]} photo`, (file) =>
            prepareCardImage(file, type),
        );
        if (result && "error" in result) return fail(result.error);
        tierUploads[type] = result;
    }
    // Each tier shows its uploaded photo, or the default one for that tier.
    const tierImageSrc = (type: QuoteType) => {
        const tierUpload = tierUploads[type];
        return tierUpload ? `/uploads/${tierUpload.id}` : tierPlaceholders[type].imageSrc;
    };

    const tiers = {} as Record<QuoteType, TierInput>;
    for (const type of quoteTypes) {
        const label = tierLabels[type];
        const priceCents = parsePriceCents(text(formData, `${type}.price`));
        if (priceCents === null) {
            return fail(`Enter the ${label} price as a dollar amount, e.g. 1299 or 1,299.50 (up to two decimals).`);
        }
        const currency = text(formData, `${type}.currency`) as Currency;
        if (!currencies.includes(currency)) return fail(`Pick a currency for the ${label} quote.`);
        const title = text(formData, `${type}.title`);
        const description = text(formData, `${type}.description`);
        if (!title) return fail(`Enter a title for the ${label} quote.`);

        const nightsText = text(formData, `${type}.nights`);
        const nights = Number(nightsText);
        if (!/^\d+$/.test(nightsText) || nights < 1 || nights > MAX_NIGHTS) {
            return fail(`Enter the number of nights for the ${label} quote (1–${MAX_NIGHTS}).`);
        }
        const checkIn = text(formData, `${type}.checkIn`);
        const checkOut = text(formData, `${type}.checkOut`);
        if (!isIsoDate(checkIn) || !isIsoDate(checkOut) || checkOut <= checkIn) {
            return fail(`Pick the check-in and check-out dates for the ${label} quote.`);
        }
        if (!description) return fail(`Enter the accommodation description for the ${label} quote.`);

        const incentiveIds = [...new Set(formData.getAll(`${type}.incentives`).map(String))];
        tiers[type] = {
            priceCents,
            currency,
            title,
            nights,
            checkIn,
            checkOut,
            duration: formatStay(nights, checkIn, checkOut),
            description,
            incentiveIds,
        };
    }

    const allIds = [...new Set(quoteTypes.flatMap((t) => tiers[t].incentiveIds))];
    const catalog = allIds.length
        ? await db
              .select()
              .from(incentiveType)
              .where(and(inArray(incentiveType.id, allIds), eq(incentiveType.active, true)))
        : [];
    if (catalog.length !== allIds.length) return fail("One of the selected incentives no longer exists.");
    const byId = new Map(catalog.map((c) => [c.id, c]));

    const layer = (type: QuoteType): QuoteLayer => ({
        price: { price: tiers[type].priceCents / 100, currency: tiers[type].currency },
        title: tiers[type].title,
        duration: tiers[type].duration,
        description: tiers[type].description,
        authformLink: tierPlaceholders[type].authFormLink,
        imageUrl: tierImageSrc(type),
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
    const heroSrc = heroUpload ? `/uploads/${heroUpload.id}` : defaultHeroSrc;
    const html = renderQuoteEmail(data, { logoSrc, heroSrc, baseUrl: await siteOrigin() });

    const uploads = [heroUpload, ...quoteTypes.map((type) => tierUploads[type])].filter(
        (u): u is Upload => u !== null,
    );

    const emailId = await db.transaction(async (tx) => {
        if (uploads.length) await tx.insert(upload).values(uploads);

        // Match on profile number so the same guest isn't stored twice.
        const [g] = await tx
            .insert(guest)
            .values({ guestProfileNum, guestName, guestEmail })
            .onConflictDoUpdate({ target: guest.guestProfileNum, set: { guestName, guestEmail } })
            .returning({ id: guest.id });

        const [e] = await tx
            .insert(email)
            .values({ guestId: g.id, agentId: currentAgent.id, html, heroSrc })
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
                    title: t.title,
                    nights: t.nights,
                    checkIn: t.checkIn,
                    checkOut: t.checkOut,
                    duration: t.duration,
                    description: t.description,
                    imageSrc: tierImageSrc(type),
                    authFormLink: tierPlaceholders[type].authFormLink,
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
    await requireAccount();
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

// Turns a title into a readable id, e.g. "$150 future travel credit" ->
// "150-future-travel-credit". Ids are permanent, so they're never changed
// after the incentive is created, even if the title is.
async function newIncentiveId(title: string): Promise<string> {
    const base =
        title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 40)
            .replace(/-+$/, "") || "incentive";
    const taken = new Set(
        (await db.select({ id: incentiveType.id }).from(incentiveType)).map((row) => row.id),
    );
    let id = base;
    for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
    return id;
}

// Adds an incentive (no "id" field) or edits one ("id" set). An edit only
// changes new emails: sent emails keep the wording they were sent with, and
// a replaced icon is stored as a new file so sent emails keep showing the old one.
export async function saveIncentive(_prev: FormState, formData: FormData): Promise<FormState> {
    await requireAccount();
    const values = formValues(formData);
    const fail = (error: string): FormState => ({ error, values });

    const id = text(formData, "id");
    const title = text(formData, "title");
    const description = text(formData, "description");
    const code = text(formData, "code").toUpperCase();
    const active = id ? formData.get("active") === "on" : true;

    if (!title) return fail("Enter a title.");
    if (title.length > TITLE_MAX) return fail(`Keep the title to ${TITLE_MAX} characters or fewer.`);
    if (description.length > DESCRIPTION_MAX) {
        return fail(`Keep the description to ${DESCRIPTION_MAX} characters or fewer.`);
    }
    if (code.length > CODE_MAX || !/^[A-Z0-9-]*$/.test(code)) {
        return fail(`The code can only use letters, numbers and dashes, up to ${CODE_MAX} characters.`);
    }

    const iconFile = uploadedFile(formData, "icon");
    let icon: Buffer | null = null;
    if (iconFile) {
        if (!(iconImageTypes as readonly string[]).includes(iconFile.type)) {
            return fail("The icon must be a JPG, PNG, GIF or WebP. Choose the file again.");
        }
        if (iconFile.size > iconMaxBytes) return fail("The icon must be 2MB or smaller. Choose a smaller file.");
        icon = await prepareIcon(iconFile);
        if (!icon) return fail("The icon couldn't be read. Try a different file.");
    }
    const iconUpload = icon && { id: randomUUID(), contentType: "image/png", data: icon };
    const iconSrc = iconUpload && `/uploads/${iconUpload.id}`;

    const fields = { title, description: description || null, code: code || null, active };
    if (id) {
        const [existing] = await db
            .select({ id: incentiveType.id })
            .from(incentiveType)
            .where(eq(incentiveType.id, id));
        if (!existing) return fail("This incentive no longer exists.");

        await db.transaction(async (tx) => {
            if (iconUpload) await tx.insert(upload).values(iconUpload);
            await tx
                .update(incentiveType)
                .set({ ...fields, ...(iconSrc && { srcImg: iconSrc }) })
                .where(eq(incentiveType.id, id));
        });
    } else {
        const newId = await newIncentiveId(title);
        await db.transaction(async (tx) => {
            if (iconUpload) await tx.insert(upload).values(iconUpload);
            await tx.insert(incentiveType).values({ id: newId, ...fields, srcImg: iconSrc ?? placeholderIcon(title) });
        });
    }

    revalidatePath("/incentives", "layout");
    revalidatePath("/");
    redirect("/incentives");
}

export type DraftState = { error?: string; needsSignIn?: boolean };

// Saves a generated email as a draft in the signed-in person's Outlook.
// Bound to the email's id on the page: createOutlookDraft.bind(null, id).
export async function createOutlookDraft(emailId: number): Promise<DraftState> {
    const account = await currentAccount();
    if (!account) return { error: "Sign in with Microsoft first.", needsSignIn: true };

    const row = await getEmail(emailId);
    if (!row) return { error: "This email no longer exists." };

    let draft: { id: string; webLink: string };
    try {
        // Attach the app's images to the message so they show up for the guest.
        const { html, images } = await inlineImages(row.email.html);
        draft = await createDraft(account.id, {
            subject: QUOTE_EMAIL_SUBJECT,
            html,
            to: { address: row.guest.guestEmail, name: row.guest.guestName },
            images,
        });
    } catch (err) {
        if (err instanceof EmailTooLargeError) {
            return { error: `The email's images are too large for Outlook (${err.message}, 3MB max).` };
        }
        if (err instanceof MicrosoftAuthError) {
            console.warn("Outlook draft needs sign-in again:", err.message);
            return { error: "Your Microsoft sign-in has expired. Sign in again, then retry.", needsSignIn: true };
        }
        console.error("Creating the Outlook draft failed:", err);
        return { error: "Outlook didn't accept the draft. Try again in a moment." };
    }

    await db
        .update(email)
        .set({ outlookDraftId: draft.id, outlookDraftLink: draft.webLink, outlookDraftAt: new Date() })
        .where(eq(email.id, emailId));
    revalidatePath(`/emails/${emailId}`);
    return {};
}

// Signing out goes to the landing page that the server shows at the root of
// the domain (deploy/landing/), where people pick an app. Locally there's no
// landing page (the root just leads back into this app and its sign-in), so
// it goes to the signed-out page instead.
export async function signOut(): Promise<void> {
    await endSession();
    const site = new URL(appUrl());
    if (["localhost", "127.0.0.1"].includes(site.hostname)) redirect("/auth/signed-out");
    redirect(`${site.origin}/`);
}
