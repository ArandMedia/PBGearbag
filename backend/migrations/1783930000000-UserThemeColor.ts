import { MigrationInterface, QueryRunner } from "typeorm";
export class UserThemeColor1783930000000 implements MigrationInterface {
  name = "UserThemeColor1783930000000";
  async up(q: QueryRunner) {
    await q.query(`ALTER TABLE "users" ADD "theme_color" varchar(7)`);
  }
  async down(q: QueryRunner) {
    await q.query(`ALTER TABLE "users" DROP COLUMN "theme_color"`);
  }
}
