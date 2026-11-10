import "server-only";
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from ".";
import { agent, email, guest, incentive, incentiveType, quoteLayer } from "./schema";
import { requireAccount } from "@/libs/session";
import { quoteTypes } from "@/libs/tiers";

// Every query checks for a signed-in, allowed Microsoft account first, so no
// page or action can read data without one, whatever proxy.ts lets through.

// The signed-in person's agent details (their Settings), or null if they
// haven't saved any yet. Each person has their own.
export async function getAgent() {
    const account = await requireAccount();
    const [row] = await db.select().from(agent).where(eq(agent.accountId, account.id));
    return row ?? null;
}

// The incentives agents can currently offer.
export async function listIncentiveTypes() {
    await requireAccount();
    return db
        .select()
        .from(incentiveType)
        .where(eq(incentiveType.active, true))
        .orderBy(asc(incentiveType.title));
}

// Emails belong to the person whose agent details they were made with, and
// each person only sees their own.
export async function listEmails() {
    const account = await requireAccount();
    return db
        .select({
            id: email.id,
            createdAt: email.createdAt,
            // As entered for this email (older emails: the guest's latest name).
            guestName: sql<string>`coalesce(${email.guestName}, ${guest.guestName})`,
            guestProfileNum: guest.guestProfileNum,
        })
        .from(email)
        .innerJoin(guest, eq(email.guestId, guest.id))
        .innerJoin(agent, eq(email.agentId, agent.id))
        .where(eq(agent.accountId, account.id))
        .orderBy(desc(email.id));
}

// One of the signed-in person's emails, or null if it doesn't exist or is
// someone else's (so another person's email can't be opened by its number).
export async function getEmail(id: number) {
    const account = await requireAccount();
    const [row] = await db
        .select({ email, guest })
        .from(email)
        .innerJoin(guest, eq(email.guestId, guest.id))
        .innerJoin(agent, eq(email.agentId, agent.id))
        .where(and(eq(email.id, id), eq(agent.accountId, account.id)));
    if (!row) return null;

    const layers = await db.select().from(quoteLayer).where(eq(quoteLayer.emailId, id));
    const incentives = layers.length
        ? await db
              .select({
                  code: incentive.incentiveCode,
                  quoteLayerId: incentive.quoteLayerId,
                  title: incentiveType.title,
                  activatedAt: incentive.activatedAt,
              })
              .from(incentive)
              .innerJoin(incentiveType, eq(incentive.incentiveTypeId, incentiveType.id))
              .where(inArray(incentive.quoteLayerId, layers.map((l) => l.id)))
        : [];

    const order = (type: string) => quoteTypes.indexOf(type as (typeof quoteTypes)[number]);
    return {
        email: row.email,
        // The name and email as entered for this email, which a later quote for
        // the same profile number may have changed on the guest row.
        guest: {
            ...row.guest,
            guestName: row.email.guestName ?? row.guest.guestName,
            guestEmail: row.email.guestEmail ?? row.guest.guestEmail,
        },
        layers: layers
            .sort((a, b) => order(a.quoteType) - order(b.quoteType))
            .map((layer) => ({
                ...layer,
                incentives: incentives.filter((i) => i.quoteLayerId === layer.id),
            })),
    };
}

// Every incentive, active first, with how many times each has been issued.
export async function listAllIncentiveTypes() {
    await requireAccount();
    return db
        .select({
            id: incentiveType.id,
            title: incentiveType.title,
            description: incentiveType.description,
            code: incentiveType.code,
            srcImg: incentiveType.srcImg,
            active: incentiveType.active,
            issued: count(incentive.incentiveCode),
        })
        .from(incentiveType)
        .leftJoin(incentive, eq(incentive.incentiveTypeId, incentiveType.id))
        .groupBy(incentiveType.id)
        .orderBy(desc(incentiveType.active), asc(incentiveType.title));
}

// One incentive, with how many times it has been issued.
export async function getIncentiveType(id: string) {
    await requireAccount();
    const [row] = await db
        .select({
            id: incentiveType.id,
            title: incentiveType.title,
            description: incentiveType.description,
            code: incentiveType.code,
            srcImg: incentiveType.srcImg,
            active: incentiveType.active,
            issued: count(incentive.incentiveCode),
        })
        .from(incentiveType)
        .leftJoin(incentive, eq(incentive.incentiveTypeId, incentiveType.id))
        .where(eq(incentiveType.id, id))
        .groupBy(incentiveType.id);
    return row ?? null;
}
