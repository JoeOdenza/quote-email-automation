CREATE TABLE `microsoft_account` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`access_token` text NOT NULL,
	`access_token_expires_at` integer NOT NULL,
	`refresh_token` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `microsoft_account`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `session_account_idx` ON `session` (`account_id`);--> statement-breakpoint
ALTER TABLE `email` ADD `outlook_draft_id` text;--> statement-breakpoint
ALTER TABLE `email` ADD `outlook_draft_link` text;--> statement-breakpoint
ALTER TABLE `email` ADD `outlook_draft_at` integer;