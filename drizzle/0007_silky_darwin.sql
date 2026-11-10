ALTER TABLE `agent` ADD `account_id` text REFERENCES microsoft_account(id);--> statement-breakpoint
CREATE UNIQUE INDEX `agent_account_id_unique` ON `agent` (`account_id`);--> statement-breakpoint
ALTER TABLE `email` ADD `guest_name` text;--> statement-breakpoint
ALTER TABLE `email` ADD `guest_email` text;