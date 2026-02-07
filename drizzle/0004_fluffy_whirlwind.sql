CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`incidentId` int NOT NULL,
	`techUserId` int NOT NULL,
	`jsonData` json NOT NULL,
	`status` enum('draft','submitted') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `incident_id_idx` ON `reports` (`incidentId`);--> statement-breakpoint
CREATE INDEX `tech_user_id_idx` ON `reports` (`techUserId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `reports` (`status`);