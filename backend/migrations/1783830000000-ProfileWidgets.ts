import { MigrationInterface, QueryRunner } from "typeorm";
export class ProfileWidgets1783830000000 implements MigrationInterface {
  name = "ProfileWidgets1783830000000";
  async up(q: QueryRunner) {
    await q.query(
      `CREATE TABLE "profile_widgets" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),"user_id" uuid NOT NULL,"widget_key" varchar NOT NULL,"position" integer NOT NULL DEFAULT 0,"config" jsonb NOT NULL DEFAULT '{}'::jsonb,"is_visible" boolean NOT NULL DEFAULT true,"created_at" timestamptz NOT NULL DEFAULT now(),"updated_at" timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query(`CREATE INDEX "IDX_profile_widgets_user" ON "profile_widgets" ("user_id")`);
  }
  async down(q: QueryRunner) {
    await q.query(`DROP TABLE "profile_widgets"`);
  }
}
