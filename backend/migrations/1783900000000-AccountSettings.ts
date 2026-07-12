import { MigrationInterface, QueryRunner } from 'typeorm';
export class AccountSettings1783900000000 implements MigrationInterface {
  name = 'AccountSettings1783900000000';
  async up(q: QueryRunner) {
    await q.query(`ALTER TYPE "auth_tokens_type_enum" ADD VALUE IF NOT EXISTS 'email_change'`);
    await q.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pending_email" varchar`);
    await q.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "message_permission" varchar NOT NULL DEFAULT 'everyone'`);
    await q.query(
      `CREATE TABLE IF NOT EXISTS "user_blocks" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),"blocker_id" uuid NOT NULL,"blocked_id" uuid NOT NULL,"created_at" timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_blocks_pair" ON "user_blocks" ("blocker_id","blocked_id")`);
    await q.query(`CREATE INDEX IF NOT EXISTS "IDX_user_blocks_blocker" ON "user_blocks" ("blocker_id")`);
    await q.query(`CREATE INDEX IF NOT EXISTS "IDX_user_blocks_blocked" ON "user_blocks" ("blocked_id")`);
  }
  async down(q: QueryRunner) {
    await q.query(`DROP TABLE IF EXISTS "user_blocks"`);
    await q.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "message_permission"`);
    await q.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "pending_email"`);
  }
}
