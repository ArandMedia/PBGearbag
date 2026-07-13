import { MigrationInterface, QueryRunner } from "typeorm";
export class OrganizationClaims1783920000000 implements MigrationInterface {
  name = "OrganizationClaims1783920000000";
  async up(q: QueryRunner) {
    await q.query(
      `CREATE TYPE "public"."organization_claims_status_enum" AS ENUM('pending', 'approved', 'declined', 'withdrawn')`,
    );
    await q.query(
      `CREATE TABLE "organization_claims" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),"organization_id" uuid NOT NULL,"user_id" uuid NOT NULL,"note" text,"status" "public"."organization_claims_status_enum" NOT NULL DEFAULT 'pending',"created_at" timestamptz NOT NULL DEFAULT now(),"updated_at" timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query(`CREATE INDEX "IDX_org_claims_org" ON "organization_claims" ("organization_id")`);
    await q.query(`CREATE INDEX "IDX_org_claims_user" ON "organization_claims" ("user_id")`);
  }
  async down(q: QueryRunner) {
    await q.query(`DROP TABLE "organization_claims"`);
    await q.query(`DROP TYPE "public"."organization_claims_status_enum"`);
  }
}
