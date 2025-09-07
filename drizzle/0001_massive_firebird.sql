ALTER TABLE "recipes" ADD COLUMN "extraction_method" varchar(32);--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "extraction_quality" varchar(16);--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "has_audio_transcript" boolean DEFAULT false;