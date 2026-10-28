CREATE TABLE "audit" (
	"id" serial PRIMARY KEY,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"detail" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"bucket" text PRIMARY KEY,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "records" (
	"id" serial PRIMARY KEY,
	"kind" text NOT NULL,
	"day" date NOT NULL,
	"shift" text NOT NULL,
	"worker_id" integer,
	"unique_key" text NOT NULL UNIQUE,
	"payload" jsonb NOT NULL,
	"gross_cents" integer DEFAULT 0 NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"advance_cents" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'Registado' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workers" (
	"id" serial PRIMARY KEY,
	"number" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"area" text NOT NULL,
	"shift" text NOT NULL,
	"admitted_at" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_worker_id_workers_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id");