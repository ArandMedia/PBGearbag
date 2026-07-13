import { MigrationInterface, QueryRunner } from "typeorm";

export class UserUsernameChangedAt1783940000000 implements MigrationInterface {
  name = "UserUsernameChangedAt1783940000000";

  async up(q: QueryRunner) {
    await q.query(`ALTER TABLE "users" ADD "username_changed_at" TIMESTAMPTZ`);
  }

  async down(q: QueryRunner) {
    await q.query(`ALTER TABLE "users" DROP COLUMN "username_changed_at"`);
  }
}
