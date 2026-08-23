CREATE TABLE `vehicle_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehicle_id` integer NOT NULL,
	`key` text,
	`label` text DEFAULT 'Foto' NOT NULL,
	`width` integer,
	`height` integer,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `vehicle_images_vehicle_idx` ON `vehicle_images` (`vehicle_id`,`position`);--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`brand` text NOT NULL,
	`model` text NOT NULL,
	`version` text DEFAULT '' NOT NULL,
	`year_fab` integer NOT NULL,
	`year` integer NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	`mileage` integer DEFAULT 0 NOT NULL,
	`transmission` text DEFAULT 'Automático' NOT NULL,
	`fuel` text DEFAULT 'Flex' NOT NULL,
	`color` text DEFAULT '' NOT NULL,
	`doors` integer DEFAULT 4 NOT NULL,
	`engine` text DEFAULT '' NOT NULL,
	`plate_end` text DEFAULT '' NOT NULL,
	`ipva_paid` integer DEFAULT true NOT NULL,
	`one_owner` integer DEFAULT false NOT NULL,
	`inspection` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'novo' NOT NULL,
	`features` text DEFAULT '[]' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicles_slug_idx` ON `vehicles` (`slug`);--> statement-breakpoint
CREATE INDEX `vehicles_position_idx` ON `vehicles` (`position`);