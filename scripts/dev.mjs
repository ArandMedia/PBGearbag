import { spawn } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { createConnection } from 'node:net';

if (!existsSync('backend/.env')) {
  writeFileSync('backend/.env', `NODE_ENV=development\nPORT=3000\nAPI_PREFIX=api/v1\nDATABASE_URL=postgresql://pbg:pbg-local-only@localhost:5432/pbg_dev\nDB_SSL=false\nJWT_SECRET=local-access-secret-change-me-123456789\nJWT_EXPIRATION=15m\nREFRESH_TOKEN_SECRET=local-refresh-secret-change-me-987654321\nREFRESH_TOKEN_EXPIRATION=30d\nFRONTEND_URL=http://localhost:8081\n`);
}

const children = [];
const run = (command, args, options = {}) => {
  const child = spawn(command, args, { stdio: 'inherit', ...options });
  children.push(child);
  return child;
};
const waitFor = (child) => new Promise((resolve, reject) => child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${child.spawnargs.join(' ')} failed (${code})`))));

const db = run('node', ['scripts/dev-db.mjs']);
await new Promise((resolve, reject) => {
  const deadline = Date.now() + 30000;
  const check = () => {
    const socket = createConnection({ host: '127.0.0.1', port: 5432 });
    socket.once('connect', () => { socket.destroy(); resolve(); });
    socket.once('error', () => { socket.destroy(); Date.now() > deadline ? reject(new Error('PostgreSQL did not start')) : setTimeout(check, 300); });
  };
  check();
});
await waitFor(run('npm', ['run', 'db:migrate']));
await waitFor(run('npm', ['run', 'db:seed']));
run('npm', ['run', 'backend']);
run('npm', ['run', 'web', '--workspace=@pbg/mobile']);

const stop = () => children.forEach((child) => child.kill('SIGTERM'));
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
