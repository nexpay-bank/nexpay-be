ALTER TABLE "account" DROP CONSTRAINT "account_uuid_user_uuid_fk";
--> statement-breakpoint
ALTER TABLE "mutation_history" DROP CONSTRAINT "mutation_history_account_id_account_account_id_fk";
--> statement-breakpoint
ALTER TABLE "mutation_history" DROP CONSTRAINT "mutation_history_uuid_user_uuid_fk";
--> statement-breakpoint
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_account_id_account_account_id_fk";
--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_role_id_role_role_id_fk";
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_uuid_user_uuid_fk" FOREIGN KEY ("uuid") REFERENCES "public"."user"("uuid") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "mutation_history" ADD CONSTRAINT "mutation_history_account_id_account_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("account_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "mutation_history" ADD CONSTRAINT "mutation_history_uuid_user_uuid_fk" FOREIGN KEY ("uuid") REFERENCES "public"."user"("uuid") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_account_id_account_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("account_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_role_id_role_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role"("role_id") ON DELETE set null ON UPDATE cascade;