import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

// Standalone DataSource used only by the TypeORM CLI (migration:generate,
// migration:run, migration:revert — see backend/package.json scripts).
// Mirrors the connection logic in app.module.ts.
const databaseUrl = process.env.DATABASE_URL;
const sslEnabled =
  process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';

export default new DataSource({
  type: 'postgres',
  ...(databaseUrl
    ? { url: databaseUrl }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
      }),
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
});
