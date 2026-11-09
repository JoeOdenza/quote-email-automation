CREATE TABLE `upload` (
	`id` text PRIMARY KEY NOT NULL,
	`content_type` text NOT NULL,
	`data` blob NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `email` ADD `hero_src` text;--> statement-breakpoint
ALTER TABLE `quote_layer` ADD `title` text;--> statement-breakpoint
ALTER TABLE `quote_layer` ADD `duration` text;