CREATE TABLE `call_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`incidentId` int NOT NULL,
	`step` int NOT NULL,
	`targetUserId` int NOT NULL,
	`startedAt` timestamp NOT NULL,
	`endedAt` timestamp,
	`result` enum('ringing','answered','missed','declined','timeout'),
	`declineReason` enum('busy','already_on_call','out_of_area','other'),
	`declineReasonText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `call_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `incident_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`incidentId` int NOT NULL,
	`type` varchar(100) NOT NULL,
	`userId` int,
	`at` timestamp NOT NULL DEFAULT (now()),
	`payloadJson` json,
	CONSTRAINT `incident_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `incidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`bhAh` enum('business_hours','after_hours') NOT NULL,
	`callerId` varchar(50),
	`siteId` int,
	`status` enum('open','en_route','on_site','resolved','follow_up_required') NOT NULL DEFAULT 'open',
	`assignedUserId` int,
	`critical` boolean NOT NULL DEFAULT false,
	`answeredUnclaimed` boolean NOT NULL DEFAULT false,
	`outcome` enum('nuisance','device_issue','panel_trouble','unknown','other'),
	`outcomeNotes` text,
	`followUpRequired` boolean NOT NULL DEFAULT false,
	`resolvedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `incidents_id` PRIMARY KEY(`id`),
	CONSTRAINT `incidents_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(100) NOT NULL,
	`incidentId` int,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`deepLink` varchar(500),
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `oncall_schedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`priorityOrder` int NOT NULL,
	`isPrimary` boolean NOT NULL DEFAULT false,
	`isSecondary` boolean NOT NULL DEFAULT false,
	`eligiblePool` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `oncall_schedule_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rotation_state` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pointerIndex` int NOT NULL DEFAULT 0,
	`lastUsedUserIds` json NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rotation_state_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text NOT NULL,
	`notes` text,
	`phoneMatchRules` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` json NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `system_config_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('tech','admin','manager') NOT NULL DEFAULT 'tech';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `available` boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX `incident_id_idx` ON `call_attempts` (`incidentId`);--> statement-breakpoint
CREATE INDEX `target_user_id_idx` ON `call_attempts` (`targetUserId`);--> statement-breakpoint
CREATE INDEX `incident_id_idx` ON `incident_events` (`incidentId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `incident_events` (`type`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `incidents` (`status`);--> statement-breakpoint
CREATE INDEX `assigned_user_idx` ON `incidents` (`assignedUserId`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `incidents` (`createdAt`);--> statement-breakpoint
CREATE INDEX `external_id_idx` ON `incidents` (`externalId`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `notifications` (`status`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `oncall_schedule` (`userId`);--> statement-breakpoint
CREATE INDEX `time_range_idx` ON `oncall_schedule` (`startTime`,`endTime`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `sites` (`name`);