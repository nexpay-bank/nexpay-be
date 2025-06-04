CREATE TABLE "account" (
	"account_id" serial PRIMARY KEY NOT NULL,
	"uuid" varchar(50),
	"balance" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mutation_history" (
	"muta_id" serial PRIMARY KEY NOT NULL,
	"account_id" integer,
	"uuid" varchar(50),
	"action_type" varchar(50) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"timestamp" timestamp NOT NULL,
	"note" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role" (
	"role_id" varchar(50) PRIMARY KEY NOT NULL,
	"role" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"trc_id" serial PRIMARY KEY NOT NULL,
	"account_id" integer,
	"type" varchar(50) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"timestamp" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"uuid" varchar(50) PRIMARY KEY NOT NULL,
	"username" varchar(100) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role_id" varchar(50)
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_uuid_user_uuid_fk" FOREIGN KEY ("uuid") REFERENCES "public"."user"("uuid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutation_history" ADD CONSTRAINT "mutation_history_account_id_account_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutation_history" ADD CONSTRAINT "mutation_history_uuid_user_uuid_fk" FOREIGN KEY ("uuid") REFERENCES "public"."user"("uuid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_account_id_account_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_role_id_role_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role"("role_id") ON DELETE no action ON UPDATE no action;