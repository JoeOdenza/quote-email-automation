import { sql } from "drizzle-orm";
import {
    blob,
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
        // The banner shown at the top of the email: an uploaded image
        // ("/uploads/<id>") or the default one.
        heroSrc: text("hero_src"),
        sentAt: integer("sent_at", { mode: "timestamp" }),
        // Set once the matching activity has been created in ClientBase.
        // Rows with sent_at set and this null still need syncing.
        clientbaseActivityId: text("clientbase_activity_id"),
        clientbaseSyncedAt: integer("clientbase_synced_at", { mode: "timestamp" }),
        // The most recent draft made from this email in the agent's Outlook.
        outlookDraftId: text("outlook_draft_id"),
        outlookDraftLink: text("outlook_draft_link"),
        outlookDraftAt: integer("outlook_draft_at", { mode: "timestamp" }),
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
        title: text("title"),
        duration: text("duration"),
        // The accommodation description.
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

// Images uploaded from the app (e.g. email banners), served at /uploads/<id>.
// Stored in the database so they keep working after a rebuild or redeploy.
export const upload = sqliteTable("upload", {
    id: text("id").primaryKey(),
    contentType: text("content_type").notNull(),
    data: blob("data", { mode: "buffer" }).notNull(),
    createdAt: createdAt(),
});

// The catalog: one row per kind of incentive ('travel', 'hotel', ...).
export const incentiveType = sqliteTable("incentive_type", {
    id: text("id").primaryKey(),
    type: text("type"),
    title: text("title").notNull(),
    description: text("description"),
    srcImg: text("src_img"),
    // Internal Odenza code, e.g. 'DCOGC'. Shown to agents, never in the email.
    code: text("code"),
    // Retired incentives stay in the table so past emails' records still
    // resolve, but they're no longer offered on the form.
    active: integer("active", { mode: "boolean" }).notNull().default(true),
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

// A Microsoft account that has signed in to the app. Tokens are encrypted
// (see libs/crypto.ts) so a copy of the database alone can't read mail.
export const microsoftAccount = sqliteTable("microsoft_account", {
    // The Microsoft Graph user id.
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    accessToken: text("access_token").notNull(),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }).notNull(),
    refreshToken: text("refresh_token").notNull(),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`)
        .$onUpdate(() => new Date()),
});

// A signed-in browser. The cookie holds a random token; only its SHA-256
// hash is stored, so the table can't be used to hijack sessions.
export const session = sqliteTable(
    "session",
    {
        tokenHash: text("token_hash").primaryKey(),
        accountId: text("account_id")
            .notNull()
            .references(() => microsoftAccount.id, { onDelete: "cascade" }),
        expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
        createdAt: createdAt(),
    },
    (t) => [index("session_account_idx").on(t.accountId)],
);
