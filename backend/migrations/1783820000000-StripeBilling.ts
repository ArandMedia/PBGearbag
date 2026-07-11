import { MigrationInterface, QueryRunner } from "typeorm";
export class StripeBilling1783820000000 implements MigrationInterface {
  name = "StripeBilling1783820000000";
  async up(q: QueryRunner) {
    await q.query(`ALTER TABLE "users" ADD "stripe_customer_id" varchar`);
    await q.query(`CREATE TYPE "subscriptions_plan_enum" AS ENUM ('monthly','yearly')`);
    await q.query(`CREATE TYPE "subscriptions_status_enum" AS ENUM ('active','trialing','past_due','canceled','incomplete','incomplete_expired','unpaid')`);
    await q.query(
      `CREATE TABLE "subscriptions" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),"user_id" uuid NOT NULL,"stripe_customer_id" varchar NOT NULL,"stripe_subscription_id" varchar NOT NULL,"stripe_price_id" varchar NOT NULL,"plan" "subscriptions_plan_enum" NOT NULL,"status" "subscriptions_status_enum" NOT NULL,"current_period_end" timestamptz NOT NULL,"cancel_at_period_end" boolean NOT NULL DEFAULT false,"created_at" timestamptz NOT NULL DEFAULT now(),"updated_at" timestamptz NOT NULL DEFAULT now(),CONSTRAINT "UQ_subscriptions_stripe_subscription_id" UNIQUE("stripe_subscription_id"))`,
    );
    await q.query(`CREATE INDEX "IDX_subscriptions_user" ON "subscriptions" ("user_id")`);
  }
  async down(q: QueryRunner) {
    await q.query(`DROP TABLE "subscriptions"`);
    await q.query(`DROP TYPE "subscriptions_status_enum"`);
    await q.query(`DROP TYPE "subscriptions_plan_enum"`);
    await q.query(`ALTER TABLE "users" DROP COLUMN "stripe_customer_id"`);
  }
}
