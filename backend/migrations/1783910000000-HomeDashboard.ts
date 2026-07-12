import { MigrationInterface, QueryRunner } from "typeorm";
export class HomeDashboard1783910000000 implements MigrationInterface {
  name = "HomeDashboard1783910000000";
  async up(q: QueryRunner) {
    await q.query(
      `CREATE TABLE "organization_follows" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),"user_id" uuid NOT NULL,"organization_id" uuid NOT NULL,"created_at" timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query(`CREATE UNIQUE INDEX "IDX_org_follows_user_org" ON "organization_follows" ("user_id","organization_id")`);
    await q.query(`CREATE INDEX "IDX_org_follows_user" ON "organization_follows" ("user_id")`);
    await q.query(`CREATE INDEX "IDX_org_follows_org" ON "organization_follows" ("organization_id")`);

    await q.query(
      `CREATE TABLE "announcements" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),"source_type" varchar NOT NULL,"source_id" uuid NOT NULL,"author_id" uuid NOT NULL,"title" varchar NOT NULL,"body" text NOT NULL,"expires_at" timestamptz,"created_at" timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query(`CREATE INDEX "IDX_announcements_source_type" ON "announcements" ("source_type")`);
    await q.query(`CREATE INDEX "IDX_announcements_source_id" ON "announcements" ("source_id")`);

    await q.query(
      `CREATE TABLE "home_layouts" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),"user_id" uuid NOT NULL,"blocks" jsonb NOT NULL DEFAULT '[]'::jsonb,"created_at" timestamptz NOT NULL DEFAULT now(),"updated_at" timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query(`CREATE UNIQUE INDEX "IDX_home_layouts_user" ON "home_layouts" ("user_id")`);
  }
  async down(q: QueryRunner) {
    await q.query(`DROP TABLE "home_layouts"`);
    await q.query(`DROP TABLE "announcements"`);
    await q.query(`DROP TABLE "organization_follows"`);
  }
}
