import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialSchema1698321600000 implements MigrationInterface {
  name = "CreateInitialSchema1698321600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE item_type_enum AS ENUM ('ask', 'commitment', 'action');
      CREATE TYPE priority_enum AS ENUM ('low', 'medium', 'high');
      CREATE TYPE priority_source_enum AS ENUM ('ai', 'manual');
      CREATE TYPE status_enum AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
      CREATE TYPE source_type_enum AS ENUM ('email', 'slack', 'zoom');
      CREATE TYPE relationship_type_enum AS ENUM ('ask_to_commitment', 'commitment_to_action');
      CREATE TYPE job_type_enum AS ENUM ('process_email', 'process_slack', 'process_zoom');
      CREATE TYPE job_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed');
      CREATE TYPE feedback_type_enum AS ENUM ('priority_correction', 'false_positive', 'relationship_correction');
    `);

    await queryRunner.query(`
      CREATE TABLE "persons" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(100) NOT NULL,
        "email" varchar(255) UNIQUE,
        "slack_user_id" varchar(50),
        "zoom_user_id" varchar(50),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE "items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "type" item_type_enum NOT NULL,
        "title" varchar(200) NOT NULL,
        "description" varchar(2000) NOT NULL,
        "priority" priority_enum NOT NULL,
        "priority_source" priority_source_enum NOT NULL DEFAULT 'ai',
        "status" status_enum NOT NULL DEFAULT 'pending',
        "responsible_person_id" uuid NOT NULL REFERENCES persons(id),
        "confidence_score" decimal(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
        "source_type" source_type_enum NOT NULL,
        "source_id" varchar(255) NOT NULL,
        "source_url" varchar(1000),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "due_date" timestamptz,
        "completed_at" timestamptz,
        "flagged_for_followup" boolean NOT NULL DEFAULT false,
        "flagged_at" timestamptz,
        "archived" boolean NOT NULL DEFAULT false,
        "archived_at" timestamptz,
        "historical_import" boolean NOT NULL DEFAULT false,
        UNIQUE(source_type, source_id)
      );

      CREATE TABLE "relationships" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "parent_item_id" uuid NOT NULL REFERENCES items(id),
        "child_item_id" uuid NOT NULL REFERENCES items(id),
        "relationship_type" relationship_type_enum NOT NULL,
        "confidence_score" decimal(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        UNIQUE(parent_item_id, child_item_id)
      );

      CREATE TABLE "manual_edits" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "item_id" uuid NOT NULL REFERENCES items(id),
        "field_name" varchar(50) NOT NULL,
        "old_value" text NOT NULL,
        "new_value" text NOT NULL,
        "edited_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE "learning_feedback" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "item_id" uuid NOT NULL REFERENCES items(id),
        "feedback_type" feedback_type_enum NOT NULL,
        "ai_prediction" text NOT NULL,
        "user_correction" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE "jobs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "job_type" job_type_enum NOT NULL,
        "source_id" varchar(255) NOT NULL UNIQUE,
        "status" job_status_enum NOT NULL DEFAULT 'pending',
        "retry_count" integer NOT NULL DEFAULT 0,
        "payload" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "started_at" timestamptz,
        "completed_at" timestamptz,
        "error_message" text
      );

      CREATE INDEX "idx_items_source" ON "items"("source_type", "source_id");
      CREATE INDEX "idx_items_responsible_person" ON "items"("responsible_person_id");
      CREATE INDEX "idx_items_status" ON "items"("status");
      CREATE INDEX "idx_items_priority" ON "items"("priority");
      CREATE INDEX "idx_items_flagged" ON "items"("flagged_for_followup");
      CREATE INDEX "idx_items_archived" ON "items"("archived");
      CREATE INDEX "idx_jobs_status" ON "jobs"("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "jobs";
      DROP TABLE IF EXISTS "learning_feedback";
      DROP TABLE IF EXISTS "manual_edits";
      DROP TABLE IF EXISTS "relationships";
      DROP TABLE IF EXISTS "items";
      DROP TABLE IF EXISTS "persons";
      DROP TYPE IF EXISTS item_type_enum;
      DROP TYPE IF EXISTS priority_enum;
      DROP TYPE IF EXISTS priority_source_enum;
      DROP TYPE IF EXISTS status_enum;
      DROP TYPE IF EXISTS source_type_enum;
      DROP TYPE IF EXISTS relationship_type_enum;
      DROP TYPE IF EXISTS job_type_enum;
      DROP TYPE IF EXISTS job_status_enum;
      DROP TYPE IF EXISTS feedback_type_enum;
    `);
  }
}
