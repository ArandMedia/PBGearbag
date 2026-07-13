import { MigrationInterface, QueryRunner } from "typeorm";

export class Tournaments1783970000000 implements MigrationInterface {
  name = "Tournaments1783970000000";

  async up(q: QueryRunner) {
    await q.query(`
      CREATE TABLE "tournaments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "event_id" uuid NOT NULL,
        "format" varchar NOT NULL DEFAULT 'single_elimination',
        "max_teams" int,
        "registration_closes_at" timestamptz,
        "status" varchar NOT NULL DEFAULT 'registration_open',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_tournaments_event_id" UNIQUE ("event_id"),
        CONSTRAINT "FK_tournaments_event_id" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE
      )
    `);
    await q.query(`
      CREATE TABLE "tournament_entries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tournament_id" uuid NOT NULL,
        "team_id" uuid NOT NULL,
        "registered_by" uuid NOT NULL,
        "seed" int,
        "status" varchar NOT NULL DEFAULT 'registered',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_tournament_entries_tournament_id" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE
      )
    `);
    await q.query(`CREATE INDEX "IDX_tournament_entries_tournament_id" ON "tournament_entries" ("tournament_id")`);
    await q.query(`
      CREATE TABLE "tournament_matches" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tournament_id" uuid NOT NULL,
        "round" int NOT NULL,
        "match_number" int NOT NULL,
        "team_a_entry_id" uuid,
        "team_b_entry_id" uuid,
        "team_a_score" int,
        "team_b_score" int,
        "winner_entry_id" uuid,
        "next_match_id" uuid,
        "next_match_slot" varchar,
        "scheduled_at" timestamptz,
        "status" varchar NOT NULL DEFAULT 'pending',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_tournament_matches_tournament_id" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE
      )
    `);
    await q.query(`CREATE INDEX "IDX_tournament_matches_tournament_id" ON "tournament_matches" ("tournament_id")`);
  }

  async down(q: QueryRunner) {
    await q.query(`DROP INDEX "public"."IDX_tournament_matches_tournament_id"`);
    await q.query(`DROP TABLE "tournament_matches"`);
    await q.query(`DROP INDEX "public"."IDX_tournament_entries_tournament_id"`);
    await q.query(`DROP TABLE "tournament_entries"`);
    await q.query(`DROP TABLE "tournaments"`);
  }
}
