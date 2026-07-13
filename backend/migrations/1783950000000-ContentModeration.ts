import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentModeration1783950000000 implements MigrationInterface {
  name = "ContentModeration1783950000000";

  async up(q: QueryRunner) {
    await q.query(
      `CREATE TYPE "public"."teams_moderation_status_enum" AS ENUM('pending', 'approved', 'declined', 'withdrawn')`,
    );
    await q.query(
      `ALTER TABLE "teams" ADD "moderation_status" "public"."teams_moderation_status_enum" NOT NULL DEFAULT 'approved'`,
    );
    await q.query(
      `CREATE TYPE "public"."events_moderation_status_enum" AS ENUM('pending', 'approved', 'declined', 'withdrawn')`,
    );
    await q.query(
      `ALTER TABLE "events" ADD "moderation_status" "public"."events_moderation_status_enum" NOT NULL DEFAULT 'approved'`,
    );
    await q.query(
      `CREATE TYPE "public"."organizations_moderation_status_enum" AS ENUM('pending', 'approved', 'declined', 'withdrawn')`,
    );
    await q.query(
      `ALTER TABLE "organizations" ADD "moderation_status" "public"."organizations_moderation_status_enum" NOT NULL DEFAULT 'approved'`,
    );
  }

  async down(q: QueryRunner) {
    await q.query(`ALTER TABLE "organizations" DROP COLUMN "moderation_status"`);
    await q.query(`DROP TYPE "public"."organizations_moderation_status_enum"`);
    await q.query(`ALTER TABLE "events" DROP COLUMN "moderation_status"`);
    await q.query(`DROP TYPE "public"."events_moderation_status_enum"`);
    await q.query(`ALTER TABLE "teams" DROP COLUMN "moderation_status"`);
    await q.query(`DROP TYPE "public"."teams_moderation_status_enum"`);
  }
}
