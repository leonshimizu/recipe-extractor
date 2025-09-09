CREATE TABLE IF NOT EXISTS "extraction_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"location" text DEFAULT 'Guam' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"current_step" text DEFAULT 'initializing' NOT NULL,
	"message" text DEFAULT 'Starting extraction...' NOT NULL,
	"estimated_duration" integer DEFAULT 60 NOT NULL,
	"recipe_id" uuid,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "extraction_jobs_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "extraction_jobs_url_idx" ON "extraction_jobs" USING btree ("url");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "extraction_jobs_status_idx" ON "extraction_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "extraction_jobs_created_at_idx" ON "extraction_jobs" USING btree ("created_at");
