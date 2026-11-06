CREATE TABLE `agent` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`agent_num` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`schedule` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_agent_num_unique` ON `agent` (`agent_num`);--> statement-breakpoint
CREATE TABLE `email` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`guest_id` integer NOT NULL,
	`agent_id` integer NOT NULL,
	`sent_at` integer,
	`clientbase_activity_id` text,
	`clientbase_synced_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`guest_id`) REFERENCES `guest`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `email_guest_idx` ON `email` (`guest_id`);--> statement-breakpoint
CREATE INDEX `email_agent_idx` ON `email` (`agent_id`);--> statement-breakpoint
CREATE TABLE `guest` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`guest_profile_num` text NOT NULL,
	`guest_name` text NOT NULL,
	`guest_email` text NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guest_guest_profile_num_unique` ON `guest` (`guest_profile_num`);--> statement-breakpoint
CREATE TABLE `incentive` (
	`incentive_code` text PRIMARY KEY NOT NULL,
	`quote_layer_id` integer NOT NULL,
	`incentive_type_id` text NOT NULL,
	`activated_at` integer,
	FOREIGN KEY (`quote_layer_id`) REFERENCES `quote_layer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`incentive_type_id`) REFERENCES `incentive_type`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `incentive_quote_layer_idx` ON `incentive` (`quote_layer_id`);--> statement-breakpoint
CREATE TABLE `incentive_type` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text,
	`title` text NOT NULL,
	`description` text,
	`src_img` text
);
--> statement-breakpoint
CREATE TABLE `quote_layer` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email_id` integer NOT NULL,
	`quote_type` text NOT NULL,
	`price_cents` integer NOT NULL,
	`currency` text NOT NULL,
	`description` text,
	`auth_form_link` text,
	`image_src` text,
	FOREIGN KEY (`email_id`) REFERENCES `email`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "quote_layer_type_ck" CHECK("quote_layer"."quote_type" IN ('promo', 'upgrade', 'hailMary')),
	CONSTRAINT "quote_layer_price_ck" CHECK("quote_layer"."price_cents" >= 0),
	CONSTRAINT "quote_layer_currency_ck" CHECK(length("quote_layer"."currency") = 3)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quote_layer_email_type_uq` ON `quote_layer` (`email_id`,`quote_type`);