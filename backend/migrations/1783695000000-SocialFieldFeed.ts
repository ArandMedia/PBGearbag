import { MigrationInterface, QueryRunner } from "typeorm";
export class SocialFieldFeed1783695000000 implements MigrationInterface {
  name = "SocialFieldFeed1783695000000";
  async up(q: QueryRunner) {
    await q.query(
      `CREATE TYPE "public"."social_posts_type_enum" AS ENUM('clip','photo','field_report','gear_check','event_moment','story')`,
    );
    await q.query(
      `CREATE TYPE "public"."social_reactions_type_enum" AS ENUM('hype','love','respect','helpful')`,
    );
    await q.query(
      `CREATE TABLE "social_posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),"author_id" uuid NOT NULL,"type" "public"."social_posts_type_enum" NOT NULL DEFAULT 'story',"body" text NOT NULL,"media_url" varchar,"thumbnail_url" varchar,"event_id" uuid,"organization_id" uuid,"location_label" varchar,"created_at" TIMESTAMP NOT NULL DEFAULT now(),CONSTRAINT "PK_social_posts" PRIMARY KEY("id"),CONSTRAINT "FK_social_posts_author" FOREIGN KEY("author_id") REFERENCES "users"("id") ON DELETE CASCADE)`,
    );
    await q.query(
      `CREATE INDEX "IDX_social_posts_author" ON "social_posts"("author_id")`,
    );
    await q.query(
      `CREATE TABLE "social_reactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),"post_id" uuid NOT NULL,"user_id" uuid NOT NULL,"type" "public"."social_reactions_type_enum" NOT NULL,"created_at" TIMESTAMP NOT NULL DEFAULT now(),CONSTRAINT "UQ_social_reaction" UNIQUE("post_id","user_id"),CONSTRAINT "PK_social_reactions" PRIMARY KEY("id"),CONSTRAINT "FK_social_reactions_post" FOREIGN KEY("post_id") REFERENCES "social_posts"("id") ON DELETE CASCADE,CONSTRAINT "FK_social_reactions_user" FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE)`,
    );
    await q.query(
      `CREATE TABLE "social_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),"post_id" uuid NOT NULL,"author_id" uuid NOT NULL,"body" text NOT NULL,"created_at" TIMESTAMP NOT NULL DEFAULT now(),CONSTRAINT "PK_social_comments" PRIMARY KEY("id"),CONSTRAINT "FK_social_comments_post" FOREIGN KEY("post_id") REFERENCES "social_posts"("id") ON DELETE CASCADE,CONSTRAINT "FK_social_comments_author" FOREIGN KEY("author_id") REFERENCES "users"("id") ON DELETE CASCADE)`,
    );
  }
  async down(q: QueryRunner) {
    await q.query(`DROP TABLE "social_comments"`);
    await q.query(`DROP TABLE "social_reactions"`);
    await q.query(`DROP TABLE "social_posts"`);
    await q.query(`DROP TYPE "public"."social_reactions_type_enum"`);
    await q.query(`DROP TYPE "public"."social_posts_type_enum"`);
  }
}
