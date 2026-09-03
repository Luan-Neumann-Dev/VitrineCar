ALTER TABLE `vehicles` ADD `kind` text DEFAULT 'carro' NOT NULL;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `displacement` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `gears` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `start_type` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `brakes` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `cooling` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `tags` text DEFAULT '[]' NOT NULL;