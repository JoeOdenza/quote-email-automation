import "server-only";
import { asc, count, desc, eq, inArray } from "drizzle-orm";
import { db } from ".";
import { agent, email, guest, incentive, incentiveType, quoteLayer } from "./schema";
import { requireAccount } from "@/libs/session";
import { quoteTypes } from "@/libs/tiers";

// Every query checks for a signed-in, allowed Microsoft account first, so no
// page or action can read data without one, whatever proxy.ts lets through.

// There's one agent until sign-in exists: the one saved on the settings page.
export async function getAgent() {
    await requireAccount();
    const [row] = await db.select().from(agent).orderBy(asc(agent.id)).limit(1);
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

export async function listEmails() {
    await requireAccount();
    return db
        .select({
            id: email.id,
            createdAt: email.createdAt,
            guestName: guest.guestName,
            guestProfileNum: guest.guestProfileNum,
        })
        .from(email)
        .innerJoin(guest, eq(email.guestId, guest.id))
        .orderBy(desc(email.id));
}

export async function getEmail(id: number) {
    await requireAccount();
    const [row] = await db
        .select({ email, guest })
        .from(email)
        .innerJoin(guest, eq(email.guestId, guest.id))
        .where(eq(email.id, id));
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
        ...row,
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
