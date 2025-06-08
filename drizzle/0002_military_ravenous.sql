ALTER TABLE "mutation_history" ADD COLUMN "related_account_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "related_account_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "avatar_url" text DEFAULT NULL;