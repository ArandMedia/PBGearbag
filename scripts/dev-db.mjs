import EmbeddedPostgres from 'embedded-postgres';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const databaseDir = resolve('.local/postgres');
mkdirSync(resolve('.local'), { recursive: true });
const pg = new EmbeddedPostgres({
  databaseDir,
  user: 'pbg',
  password: 'pbg-local-only',
  port: 5432,
  persistent: true,
  onLog: (message) => process.env.DEBUG_DB ? console.log(message) : undefined,
});

if (!existsSync(resolve(databaseDir, 'PG_VERSION'))) await pg.initialise();
await pg.start();
try { await pg.createDatabase('pbg_dev'); } catch (error) {
  if (!String(error).toLowerCase().includes('already exists')) throw error;
}
console.log('PBGearbag PostgreSQL is ready on localhost:5432');

const stop = async () => { await pg.stop(); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
await new Promise(() => {});
