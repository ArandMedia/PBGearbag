import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandPaintballPlaces1783693000000 implements MigrationInterface {
  name = 'ExpandPaintballPlaces1783693000000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."organizations_type_enum" ADD VALUE IF NOT EXISTS 'training'`);
    await queryRunner.query(`ALTER TYPE "public"."organizations_type_enum" ADD VALUE IF NOT EXISTS 'indoor_venue'`);
    await queryRunner.query(`ALTER TYPE "public"."organizations_type_enum" ADD VALUE IF NOT EXISTS 'outdoor_venue'`);
    await queryRunner.query(`ALTER TYPE "public"."organizations_type_enum" ADD VALUE IF NOT EXISTS 'community'`);
  }
  public async down(): Promise<void> {
    // PostgreSQL enum values are intentionally retained to avoid destructive data loss.
  }
}
