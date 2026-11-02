CREATE TABLE "cron_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text DEFAULT 'globe' NOT NULL,
	"url" text NOT NULL,
	"method" text DEFAULT 'GET' NOT NULL,
	"headers_json" text DEFAULT '{}' NOT NULL,
	"body" text,
	"cron_expression" text NOT NULL,
	"timezone" text DEFAULT 'America/Sao_Paulo' NOT NULL,
	"timeout_ms" integer DEFAULT 30000 NOT NULL,
	"max_retries" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"last_run_at" text,
	"next_run_at" text,
	"last_status" text,
	"last_duration_ms" integer,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "execution_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"cron_job_id" text NOT NULL,
	"user_id" text NOT NULL,
	"trigger_type" text NOT NULL,
	"status" text NOT NULL,
	"request_url" text NOT NULL,
	"request_method" text NOT NULL,
	"request_headers_json" text DEFAULT '{}' NOT NULL,
	"request_body" text,
	"http_status_code" integer,
	"duration_ms" integer,
	"response_headers_json" text DEFAULT '{}' NOT NULL,
	"response_body" text,
	"error_message" text,
	"attempt_count" integer DEFAULT 1 NOT NULL,
	"started_at" text NOT NULL,
	"finished_at" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"default_timezone" text DEFAULT 'America/Sao_Paulo' NOT NULL,
	"default_timeout_ms" integer DEFAULT 30000 NOT NULL,
	"default_max_retries" integer DEFAULT 1 NOT NULL,
	"retention_days" integer DEFAULT 30 NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cron_jobs" ADD CONSTRAINT "cron_jobs_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_logs" ADD CONSTRAINT "execution_logs_cron_job_fk" FOREIGN KEY ("cron_job_id") REFERENCES "public"."cron_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_logs" ADD CONSTRAINT "execution_logs_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cron_jobs_user_id_idx" ON "cron_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cron_jobs_status_idx" ON "cron_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "execution_logs_cron_job_id_idx" ON "execution_logs" USING btree ("cron_job_id");--> statement-breakpoint
CREATE INDEX "execution_logs_user_id_started_at_idx" ON "execution_logs" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique_idx" ON "users" USING btree ("email");