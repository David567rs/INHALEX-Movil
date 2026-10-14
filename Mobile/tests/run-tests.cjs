/* global __dirname */
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const result = spawnSync(process.execPath, [
  '--test',
  '--require', path.join(__dirname, 'register-typescript.cjs'),
  path.join(__dirname, 'resolveApiUrl.test.cjs'),
  path.join(__dirname, 'HttpClient.test.cjs'),
], { stdio: 'inherit' });

if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
