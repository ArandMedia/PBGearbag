import { MigrationInterface, QueryRunner } from "typeorm";

export class TeamPractices1783960000000 implements MigrationInterface {
  name = "TeamPractices1783960000000";

  async up(q: QueryRunner) {
    await q.query(`ALTER TABLE "events" ADD "team_id" uuid`);
    await q.query(`CREATE INDEX "IDX_events_team_id" ON "events" ("team_id")`);
  }

  async down(q: QueryRunner) {
    await q.query(`DROP INDEX "public"."IDX_events_team_id"`);
    await q.query(`ALTER TABLE "events" DROP COLUMN "team_id"`);
  }
}
