CREATE TABLE `aiBriefingCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`briefingType` enum('daily','weekly') NOT NULL,
	`content` text NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `aiBriefingCache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`dueDate` date NOT NULL,
	`status` enum('pending','paid','overdue') NOT NULL DEFAULT 'pending',
	`isRecurring` boolean NOT NULL DEFAULT false,
	`frequency` varchar(50),
	`lastPaidDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `debt` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`currentBalance` decimal(10,2) NOT NULL,
	`minimumPayment` decimal(10,2),
	`interestRate` decimal(5,2),
	`status` enum('active','paid_off','paused') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `debt_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('Trading','Debt-Free','Move Out','Savings','Fitness') NOT NULL,
	`currentProgress` decimal(10,2) NOT NULL DEFAULT '0',
	`targetValue` decimal(10,2) NOT NULL,
	`targetDate` date,
	`milestones` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`currentQuantity` int NOT NULL DEFAULT 0,
	`minimumQuantity` int NOT NULL DEFAULT 1,
	`category` enum('Groceries','Household Essentials','Hygiene','Medical & Health','Snacks & Drinks') NOT NULL,
	`status` enum('Critical','Low','Good') NOT NULL DEFAULT 'Good',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`currentAmount` decimal(10,2) NOT NULL DEFAULT '0',
	`goalAmount` decimal(10,2) NOT NULL,
	`category` enum('Emergency Fund','Move Out Fund','Vehicle Fund','Custom') NOT NULL DEFAULT 'Custom',
	`targetDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trading` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountName` varchar(255) NOT NULL,
	`accountType` enum('combined','funded') NOT NULL DEFAULT 'combined',
	`dailyPnL` decimal(10,2) NOT NULL DEFAULT '0',
	`weeklyPnL` decimal(10,2) NOT NULL DEFAULT '0',
	`monthlyPnL` decimal(10,2) NOT NULL DEFAULT '0',
	`winRate` decimal(5,2) NOT NULL DEFAULT '0',
	`dailyGoal` decimal(10,2),
	`maxDailyLoss` decimal(10,2),
	`isLockedOut` boolean NOT NULL DEFAULT false,
	`lockoutReason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trading_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('income','expense','transfer') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`category` varchar(100),
	`description` text,
	`transactionDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_aiBriefing_user_type_expires` ON `aiBriefingCache` (`userId`,`briefingType`,`expiresAt`);--> statement-breakpoint
CREATE INDEX `idx_bills_userId` ON `bills` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_debt_userId` ON `debt` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_goals_userId` ON `goals` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_inventory_userId` ON `inventory` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_savings_userId` ON `savings` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_trading_userId` ON `trading` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_transactions_userId` ON `transactions` (`userId`);