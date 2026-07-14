import { MigrationInterface, QueryRunner } from "typeorm";

export class TeamGearOrders1783980000000 implements MigrationInterface {
  name = "TeamGearOrders1783980000000";

  async up(q: QueryRunner) {
    await q.query(`
      CREATE TABLE "team_gear_orders" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "team_id" uuid NOT NULL,
        "created_by_id" uuid NOT NULL,
        "title" varchar NOT NULL,
        "description" text,
        "closes_at" timestamptz,
        "status" varchar NOT NULL DEFAULT 'open',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX "IDX_team_gear_orders_team_id" ON "team_gear_orders" ("team_id")`);

    await q.query(`
      CREATE TABLE "team_gear_order_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_id" uuid NOT NULL,
        "name" varchar NOT NULL,
        "price_cents" int,
        "variant_options" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_team_gear_order_items_order_id" FOREIGN KEY ("order_id") REFERENCES "team_gear_orders"("id") ON DELETE CASCADE
      )
    `);
    await q.query(`CREATE INDEX "IDX_team_gear_order_items_order_id" ON "team_gear_order_items" ("order_id")`);

    await q.query(`
      CREATE TABLE "team_gear_order_picks" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_id" uuid NOT NULL,
        "item_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "variant" varchar,
        "quantity" int NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_team_gear_order_picks_item_user" UNIQUE ("item_id", "user_id"),
        CONSTRAINT "FK_team_gear_order_picks_order_id" FOREIGN KEY ("order_id") REFERENCES "team_gear_orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_team_gear_order_picks_item_id" FOREIGN KEY ("item_id") REFERENCES "team_gear_order_items"("id") ON DELETE CASCADE
      )
    `);
    await q.query(`CREATE INDEX "IDX_team_gear_order_picks_order_id" ON "team_gear_order_picks" ("order_id")`);
    await q.query(`CREATE INDEX "IDX_team_gear_order_picks_item_id" ON "team_gear_order_picks" ("item_id")`);
    await q.query(`CREATE INDEX "IDX_team_gear_order_picks_user_id" ON "team_gear_order_picks" ("user_id")`);
  }

  async down(q: QueryRunner) {
    await q.query(`DROP INDEX "public"."IDX_team_gear_order_picks_user_id"`);
    await q.query(`DROP INDEX "public"."IDX_team_gear_order_picks_item_id"`);
    await q.query(`DROP INDEX "public"."IDX_team_gear_order_picks_order_id"`);
    await q.query(`DROP TABLE "team_gear_order_picks"`);
    await q.query(`DROP INDEX "public"."IDX_team_gear_order_items_order_id"`);
    await q.query(`DROP TABLE "team_gear_order_items"`);
    await q.query(`DROP INDEX "public"."IDX_team_gear_orders_team_id"`);
    await q.query(`DROP TABLE "team_gear_orders"`);
  }
}
