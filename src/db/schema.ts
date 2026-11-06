import { sql } from "drizzle-orm";
import {
    check,
    index,
    integer,
    sqliteTable,
    text,
    unique,
} from "drizzle-orm/sqlite-core";
import { quoteTypes } from "../libs/tiers";

const createdAt = () =>
    integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`);

export const agent = sqliteTable("agent", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    agentNum: text("agent_num").notNull().unique(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    schedule: text("schedule"),
    createdAt: createdAt(),
});

export const guest = sqliteTable("guest", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    // ClientBase profile number: the key for matching guests to ClientBase
    // and for creating activities there once the API is available.
    guestProfileNum: text("guest_profile_num").notNull().unique(),
    guestName: text("guest_name").notNull(),
    guestEmail: text("guest_email").notNull(),
    // 'manual' = entered by an agent; 'clientbase' = confirmed against ClientBase.
    source: text("source", { enum: ["manual", "clientbase"] })
        .notNull()
        .default("manual"),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`)
        .$onUpdate(() => new Date()),
});

export const email = sqliteTable(
    "email",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        guestId: integer("guest_id")
            .notNull()
            .references(() => guest.id),
        agentId: integer("agent_id")
            .notNull()
            .references(() => agent.id),
        // The email exactly as generated (image URLs already absolute), so
        // later edits to agent settings don't change past emails.
        html: text("html").notNull(),
        sentAt: integer("sent_at", { mode: "timestamp" }),
        // Set once the matching activity has been created in ClientBase.
        // Rows with sent_at set and this null still need syncing.
        clientbaseActivityId: text("clientbase_activity_id"),
        clientbaseSyncedAt: integer("clientbase_synced_at", { mode: "timestamp" }),
        createdAt: createdAt(),
    },
    (t) => [index("email_guest_idx").on(t.guestId), index("email_agent_idx").on(t.agentId)],
);

export const quoteLayer = sqliteTable(
    "quote_layer",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        emailId: integer("email_id")
            .notNull()
            .references(() => email.id, { onDelete: "cascade" }),
        quoteType: text("quote_type", { enum: quoteTypes }).notNull(),
        // Stored in cents: SQLite has no decimal type, and floats round.
        priceCents: integer("price_cents").notNull(),
        currency: text("currency").notNull(), // ISO 4217, e.g. 'USD'
        description: text("description"),
        authFormLink: text("auth_form_link"),
        imageSrc: text("image_src"),
    },
    (t) => [
        unique("quote_layer_email_type_uq").on(t.emailId, t.quoteType),
        check(
            "quote_layer_type_ck",
            sql`${t.quoteType} IN ('promo', 'upgrade', 'hailMary')`,
        ),
        check("quote_layer_price_ck", sql`${t.priceCents} >= 0`),
        check("quote_layer_currency_ck", sql`length(${t.currency}) = 3`),
    ],
);

// The catalog: one row per kind of incentive ('dining', 'transfer', ...).
export const incentiveType = sqliteTable("incentive_type", {
    id: text("id").primaryKey(),
    type: text("type"),
    title: text("title").notNull(),
    description: text("description"),
    srcImg: text("src_img"),
});

// One issued incentive with its own unique code.
export const incentive = sqliteTable(
    "incentive",
    {
        incentiveCode: text("incentive_code").primaryKey(),
        quoteLayerId: integer("quote_layer_id")
            .notNull()
            .references(() => quoteLayer.id, { onDelete: "cascade" }),
        incentiveTypeId: text("incentive_type_id")
            .notNull()
            .references(() => incentiveType.id),
        activatedAt: integer("activated_at", { mode: "timestamp" }),
    },
    (t) => [index("incentive_quote_layer_idx").on(t.quoteLayerId)],
);
