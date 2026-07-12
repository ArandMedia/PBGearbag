import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialPostgresSchema1720570000000 implements MigrationInterface {
  name = 'InitialPostgresSchema1720570000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Guarded: an earlier deploy briefly ran with TypeORM synchronize:true
    // against the thin pre-monorepo backend and already created "users"/
    // "listings" and these enum types with a compatible shape, so this
    // must be a no-op against that database while still correct fresh.
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "users_skill_level_enum" AS ENUM ('beginner','intermediate','advanced','pro'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "listings_category_enum" AS ENUM ('marker','mask','tank','loader','apparel','accessory','complete_setup','paint','parts'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "listings_condition_enum" AS ENUM ('new','like_new','excellent','good','fair','parts'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "listings_status_enum" AS ENUM ('draft','active','pending','sold','removed'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "email" varchar NOT NULL UNIQUE,
        "username" varchar NOT NULL UNIQUE, "password" varchar NOT NULL, "first_name" varchar,
        "last_name" varchar, "display_name" varchar, "bio" text, "avatar_url" varchar,
        "banner_url" varchar, "country" varchar, "state_province" varchar, "city" varchar,
        "play_style" text, "skill_level" "users_skill_level_enum", "home_field" varchar,
        "favorite_position" varchar, "is_verified" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true, "roles" text NOT NULL DEFAULT 'user',
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
        "last_login_at" timestamptz
      )`);
    // If "users" already existed (pre-existing, thinner shape), the CREATE
    // TABLE above was skipped — backfill any columns it would have added.
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "roles" text NOT NULL DEFAULT 'user'`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL,
        "token_hash" varchar NOT NULL, "family_id" uuid NOT NULL, "device_name" varchar NOT NULL DEFAULT 'Unknown device',
        "user_agent" varchar, "ip_address" varchar, "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz, "last_used_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sessions_user" ON "sessions" ("user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sessions_family" ON "sessions" ("family_id")`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "listings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "seller_id" uuid NOT NULL,
        "title" varchar NOT NULL, "description" text NOT NULL, "category" "listings_category_enum" NOT NULL,
        "subcategory" varchar, "brand" varchar, "model" varchar, "year" integer,
        "condition" "listings_condition_enum" NOT NULL, "price" numeric(10,2) NOT NULL,
        "original_price" numeric(10,2), "is_negotiable" boolean NOT NULL DEFAULT true,
        "accepts_trades" boolean NOT NULL DEFAULT false, "images" text NOT NULL, "videos" text,
        "city" varchar, "state_province" varchar, "country" varchar,
        "shipping_available" boolean NOT NULL DEFAULT true, "local_pickup" boolean NOT NULL DEFAULT true,
        "status" "listings_status_enum" NOT NULL DEFAULT 'active', "views" integer NOT NULL DEFAULT 0,
        "favorites" integer NOT NULL DEFAULT 0, "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(), "sold_at" timestamptz,
        CONSTRAINT "FK_listings_seller" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_listings_status_created" ON "listings" ("status", "created_at" DESC)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_listings_seller" ON "listings" ("seller_id")`);
    // Same backfill safety net as "users" above, in case "listings" already
    // existed with a thinner shape.
    await queryRunner.query(`
      ALTER TABLE "listings"
        ADD COLUMN IF NOT EXISTS "subcategory" varchar,
        ADD COLUMN IF NOT EXISTS "brand" varchar,
        ADD COLUMN IF NOT EXISTS "model" varchar,
        ADD COLUMN IF NOT EXISTS "year" integer,
        ADD COLUMN IF NOT EXISTS "original_price" numeric(10,2),
        ADD COLUMN IF NOT EXISTS "is_negotiable" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "accepts_trades" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "videos" text,
        ADD COLUMN IF NOT EXISTS "shipping_available" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "local_pickup" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "favorites" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "sold_at" timestamptz
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "listings"`);
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "listings_status_enum"`);
    await queryRunner.query(`DROP TYPE "listings_condition_enum"`);
    await queryRunner.query(`DROP TYPE "listings_category_enum"`);
    await queryRunner.query(`DROP TYPE "users_skill_level_enum"`);
  }
}
