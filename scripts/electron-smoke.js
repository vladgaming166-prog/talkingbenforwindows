'use strict';

/**
 * Launch the real app main for a short smoke period.
 */
const path = require('path');
const { spawn } = require('child_process');
const electron = require('electron');

const mainJs = path.join(__dirname, '..', 'dist', 'main', 'main.js');
const child = spawn(
  electron,
  ['.', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      DISPLAY: process.env.DISPLAY || ':99',
      ELECTRON_ENABLE_LOGGING: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);

let output = '';
const onData = (d) => {
  output += d.toString();
  process.stdout.write(d);
};
child.stdout.on('data', onData);
child.stderr.on('data', onData);

setTimeout(() => {
  child.kill('SIGTERM');
}, 5000);

child.on('exit', (code, signal) => {
  // App may exit via signal after we kill it — success if it stayed up briefly
  // without immediate crash (code null + SIGTERM, or ran > few seconds)
  if (signal === 'SIGTERM' || code === 0) {
    console.log('SMOKE_OK');
    console.log('✓ Electron smoke launch OK');
    process.exit(0);
  }
  console.error('Electron smoke failed', { code, signal });
  process.exit(1);
});
