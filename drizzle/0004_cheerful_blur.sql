ALTER TABLE `incentive_type` ADD `code` text;--> statement-breakpoint
ALTER TABLE `incentive_type` ADD `active` integer DEFAULT true NOT NULL;--> statement-breakpoint
-- Retire the placeholder incentives. They stay in the table because emails
-- already generated still reference them.
UPDATE `incentive_type` SET `active` = false WHERE `id` IN ('dining', 'transfer', 'spa', 'checkout');--> statement-breakpoint
-- The real incentive catalog. Icons are placeholders until artwork exists.
INSERT INTO `incentive_type` (`id`, `type`, `title`, `description`, `src_img`, `code`) VALUES
  ('travel', 'credit',  '$150 future travel credit', 'Put it toward your next trip booked with Odenza.',          'https://placehold.co/88x88/e0b13a/14304f/png?font=roboto&text=%24150', 'DCOGC'),
  ('hotel',  'credit',  '$500 hotel credit',         'Use it at any Odenza partner hotel.',                       'https://placehold.co/88x88/e0b13a/14304f/png?font=roboto&text=%24500', 'DCFHDOV'),
  ('event',  'tickets', 'Event tickets',             'Choose from a selection of sports and live event tickets.', 'https://placehold.co/88x88/e0b13a/14304f/png?font=roboto&text=VIP',    'DCVIPTKT');
