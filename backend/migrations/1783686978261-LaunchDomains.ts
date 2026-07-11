import { MigrationInterface, QueryRunner } from "typeorm";

export class LaunchDomains1783686978261 implements MigrationInterface {
    name = 'LaunchDomains1783686978261'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."gearbags_visibility_enum" AS ENUM('public', 'members', 'private')`);
        await queryRunner.query(`CREATE TABLE "gearbags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "owner_id" character varying NOT NULL, "name" character varying NOT NULL DEFAULT 'My Gearbag', "description" text, "visibility" "public"."gearbags_visibility_enum" NOT NULL DEFAULT 'public', "is_primary" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a2941470a3f1ae2e217875ed869" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dc5caf7ad80304fa891abc9915" ON "gearbags" ("owner_id") `);
        await queryRunner.query(`CREATE TABLE "gear_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "gearbag_id" character varying NOT NULL, "owner_id" character varying NOT NULL, "name" character varying NOT NULL, "category" character varying NOT NULL, "manufacturer" character varying, "model" character varying, "color" character varying, "condition" character varying, "serial_number" character varying, "images" text, "notes" text, "acquired_at" date, "service_due_at" date, "is_archived" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_83c4c937bf10dbd7770793ddab8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b87e76bd3db49394f7f2a111a0" ON "gear_items" ("gearbag_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ebc3f47ba9d16682f4bd8b357c" ON "gear_items" ("owner_id") `);
        await queryRunner.query(`CREATE TABLE "teams" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "name" character varying NOT NULL, "owner_id" character varying NOT NULL, "team_type" character varying NOT NULL, "description" text, "logo_url" character varying, "banner_url" character varying, "city" character varying, "region" character varying, "country" character varying, "home_field_id" uuid, "is_recruiting" boolean NOT NULL DEFAULT false, "contact_enabled" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7e5523774a38b08a6236d322403" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_de8536da4945fe980f4a61900d" ON "teams" ("slug") `);
        await queryRunner.query(`CREATE INDEX "IDX_03655bd3d01df69022646faffd" ON "teams" ("owner_id") `);
        await queryRunner.query(`CREATE TYPE "public"."team_members_role_enum" AS ENUM('owner', 'manager', 'captain', 'coach', 'player', 'substitute', 'media', 'alumni')`);
        await queryRunner.query(`CREATE TABLE "team_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "team_id" character varying NOT NULL, "user_id" character varying NOT NULL, "role" "public"."team_members_role_enum" NOT NULL DEFAULT 'player', "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_ca3eae89dcf20c9fd95bf7460aa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1d3c06a8217a8785e2af0ec4ab" ON "team_members" ("team_id", "user_id") `);
        await queryRunner.query(`CREATE TYPE "public"."team_applications_status_enum" AS ENUM('pending', 'approved', 'declined', 'withdrawn')`);
        await queryRunner.query(`CREATE TABLE "team_applications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "team_id" character varying NOT NULL, "user_id" character varying NOT NULL, "message" text, "status" "public"."team_applications_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_61c245a5515fbd624945ac5d6cf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c84036c00c0703ee0cee211db1" ON "team_applications" ("team_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_5119f236d1ca1d8b72277cec0d" ON "team_applications" ("user_id") `);
        await queryRunner.query(`CREATE TYPE "public"."organizations_type_enum" AS ENUM('field', 'retailer', 'manufacturer', 'airsmith', 'hydro_testing', 'event_producer', 'league', 'media', 'photographer', 'apparel', 'travel', 'other')`);
        await queryRunner.query(`CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "name" character varying NOT NULL, "type" "public"."organizations_type_enum" NOT NULL, "description" text, "city" character varying, "region" character varying, "country" character varying, "address" character varying, "latitude" numeric(9,6), "longitude" numeric(9,6), "website_url" character varying, "contact_email" character varying, "phone_number" character varying, "logo_url" character varying, "images" text, "is_verified" boolean NOT NULL DEFAULT false, "claimed_by_id" uuid, "details" jsonb NOT NULL DEFAULT '{}'::jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_963693341bd612aa01ddf3a4b6" ON "organizations" ("slug") `);
        await queryRunner.query(`CREATE TYPE "public"."events_status_enum" AS ENUM('draft', 'published', 'cancelled', 'completed')`);
        await queryRunner.query(`CREATE TABLE "events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "title" character varying NOT NULL, "organizer_id" character varying NOT NULL, "organization_id" uuid, "event_type" character varying NOT NULL, "status" "public"."events_status_enum" NOT NULL DEFAULT 'draft', "description" text NOT NULL, "rules" text, "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL, "ends_at" TIMESTAMP WITH TIME ZONE NOT NULL, "timezone" character varying NOT NULL, "city" character varying, "region" character varying, "country" character varying, "registration_url" character varying, "cost_cents" integer, "capacity" integer, "banner_url" character varying, "cancelled_reason" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_05bd884c03d3f424e2204bd14c" ON "events" ("slug") `);
        await queryRunner.query(`CREATE INDEX "IDX_14c9ce53a2c2a1c781b8390123" ON "events" ("organizer_id") `);
        await queryRunner.query(`CREATE TYPE "public"."event_rsvps_status_enum" AS ENUM('interested', 'going', 'not_going')`);
        await queryRunner.query(`CREATE TYPE "public"."event_rsvps_visibility_enum" AS ENUM('public', 'members', 'private')`);
        await queryRunner.query(`CREATE TABLE "event_rsvps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_id" character varying NOT NULL, "user_id" character varying NOT NULL, "status" "public"."event_rsvps_status_enum" NOT NULL, "visibility" "public"."event_rsvps_visibility_enum" NOT NULL DEFAULT 'members', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9b36694202531f62919c0bf5b35" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_90472d80289aa439005f1ab4fa" ON "event_rsvps" ("event_id", "user_id") `);
        await queryRunner.query(`CREATE TYPE "public"."conversations_type_enum" AS ENUM('direct', 'marketplace', 'team', 'event', 'support')`);
        await queryRunner.query(`CREATE TABLE "conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."conversations_type_enum" NOT NULL, "subject" character varying, "context_id" uuid, "created_by_id" character varying NOT NULL, "last_message_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "conversation_participants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" character varying NOT NULL, "user_id" character varying NOT NULL, "last_read_at" TIMESTAMP WITH TIME ZONE, "muted_at" TIMESTAMP WITH TIME ZONE, "left_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_61b51428ad9453f5921369fbe94" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_377d4041a495b81ee1a85ae026" ON "conversation_participants" ("user_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fdcd6405d74e797f10fa836033" ON "conversation_participants" ("conversation_id", "user_id") `);
        await queryRunner.query(`CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" character varying NOT NULL, "sender_id" character varying NOT NULL, "body" text NOT NULL, "attachments" text, "edited_at" TIMESTAMP WITH TIME ZONE, "deleted_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3bc55a7c3f9ed54b520bb5cfe2" ON "messages" ("conversation_id") `);
        await queryRunner.query(`CREATE TABLE "listing_favorites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "listing_id" character varying NOT NULL, "user_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6543b573253ddbd89ce58cb9acb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d9d5fa132d7e390f4e3468ce24" ON "listing_favorites" ("user_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_319c9ec1ad2869473b846e0ca0" ON "listing_favorites" ("listing_id", "user_id") `);
        await queryRunner.query(`CREATE TYPE "public"."listing_offers_status_enum" AS ENUM('pending', 'accepted', 'declined', 'withdrawn', 'expired')`);
        await queryRunner.query(`CREATE TABLE "listing_offers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "listing_id" character varying NOT NULL, "buyer_id" character varying NOT NULL, "amount_cents" integer, "trade_description" text, "message" text, "status" "public"."listing_offers_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8125681b0f80bd1b83022ff236a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3aa928bd6d1f487ffd6ac06ac7" ON "listing_offers" ("listing_id") `);
        await queryRunner.query(`CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "author_id" character varying NOT NULL, "subject_id" character varying NOT NULL, "subject_type" character varying NOT NULL, "rating" smallint NOT NULL, "body" text, "outcome_id" uuid, "is_visible" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7e768f7dc06203d0c73300a0b6" ON "reviews" ("subject_id") `);
        await queryRunner.query(`CREATE TYPE "public"."reports_status_enum" AS ENUM('open', 'reviewing', 'resolved', 'dismissed')`);
        await queryRunner.query(`CREATE TABLE "reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reporter_id" character varying NOT NULL, "subject_id" character varying NOT NULL, "subject_type" character varying NOT NULL, "category" character varying NOT NULL, "description" text NOT NULL, "status" "public"."reports_status_enum" NOT NULL DEFAULT 'open', "assigned_to_id" uuid, "resolution_notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d9013193989303580053c0b5ef6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e6cbd043217499609b8215754a" ON "reports" ("subject_id") `);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying NOT NULL, "type" character varying NOT NULL, "title" character varying NOT NULL, "body" text NOT NULL, "action_url" character varying, "data" jsonb NOT NULL DEFAULT '{}'::jsonb, "read_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9a8a82462cab47c73d25f49261" ON "notifications" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "actor_id" uuid, "action" character varying NOT NULL, "subject_type" character varying NOT NULL, "subject_id" uuid, "request_id" character varying, "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_177183f29f438c488b5e8510cd" ON "audit_logs" ("actor_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_177183f29f438c488b5e8510cd"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9a8a82462cab47c73d25f49261"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e6cbd043217499609b8215754a"`);
        await queryRunner.query(`DROP TABLE "reports"`);
        await queryRunner.query(`DROP TYPE "public"."reports_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7e768f7dc06203d0c73300a0b6"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3aa928bd6d1f487ffd6ac06ac7"`);
        await queryRunner.query(`DROP TABLE "listing_offers"`);
        await queryRunner.query(`DROP TYPE "public"."listing_offers_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_319c9ec1ad2869473b846e0ca0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d9d5fa132d7e390f4e3468ce24"`);
        await queryRunner.query(`DROP TABLE "listing_favorites"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3bc55a7c3f9ed54b520bb5cfe2"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fdcd6405d74e797f10fa836033"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_377d4041a495b81ee1a85ae026"`);
        await queryRunner.query(`DROP TABLE "conversation_participants"`);
        await queryRunner.query(`DROP TABLE "conversations"`);
        await queryRunner.query(`DROP TYPE "public"."conversations_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_90472d80289aa439005f1ab4fa"`);
        await queryRunner.query(`DROP TABLE "event_rsvps"`);
        await queryRunner.query(`DROP TYPE "public"."event_rsvps_visibility_enum"`);
        await queryRunner.query(`DROP TYPE "public"."event_rsvps_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_14c9ce53a2c2a1c781b8390123"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_05bd884c03d3f424e2204bd14c"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP TYPE "public"."events_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_963693341bd612aa01ddf3a4b6"`);
        await queryRunner.query(`DROP TABLE "organizations"`);
        await queryRunner.query(`DROP TYPE "public"."organizations_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5119f236d1ca1d8b72277cec0d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c84036c00c0703ee0cee211db1"`);
        await queryRunner.query(`DROP TABLE "team_applications"`);
        await queryRunner.query(`DROP TYPE "public"."team_applications_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1d3c06a8217a8785e2af0ec4ab"`);
        await queryRunner.query(`DROP TABLE "team_members"`);
        await queryRunner.query(`DROP TYPE "public"."team_members_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_03655bd3d01df69022646faffd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_de8536da4945fe980f4a61900d"`);
        await queryRunner.query(`DROP TABLE "teams"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ebc3f47ba9d16682f4bd8b357c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b87e76bd3db49394f7f2a111a0"`);
        await queryRunner.query(`DROP TABLE "gear_items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dc5caf7ad80304fa891abc9915"`);
        await queryRunner.query(`DROP TABLE "gearbags"`);
        await queryRunner.query(`DROP TYPE "public"."gearbags_visibility_enum"`);
    }

}
