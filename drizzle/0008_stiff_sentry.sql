CREATE TABLE `theme` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color_scheme` text NOT NULL,
	`banner_src` text NOT NULL,
	`base_src` text NOT NULL,
	`upgrade_src` text NOT NULL,
	`premium_src` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `microsoft_account`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `theme_name_unique` ON `theme` (`name`);