import { MigrationInterface, QueryRunner } from "typeorm";
export class SocialFollows1783696000000 implements MigrationInterface {
  name = "SocialFollows1783696000000";
  async up(q: QueryRunner) {
    await q.query(
      `CREATE TABLE "social_follows" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(),"follower_id" uuid NOT NULL,"following_id" uuid NOT NULL,"created_at" TIMESTAMP NOT NULL DEFAULT now(),CONSTRAINT "UQ_social_follow" UNIQUE("follower_id","following_id"),CONSTRAINT "PK_social_follows" PRIMARY KEY("id"),CONSTRAINT "FK_social_follows_follower" FOREIGN KEY("follower_id") REFERENCES "users"("id") ON DELETE CASCADE,CONSTRAINT "FK_social_follows_following" FOREIGN KEY("following_id") REFERENCES "users"("id") ON DELETE CASCADE)`,
    );
  }
  async down(q: QueryRunner) {
    await q.query(`DROP TABLE "social_follows"`);
  }
}
