'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const release = path.join(__dirname, '..', 'release');
const src = path.join(release, 'win-unpacked');
const out = path.join(release, 'TalkingBen-win-portable.zip');

if (!fs.existsSync(path.join(src, 'TalkingBen.exe'))) {
  console.error('Missing release/win-unpacked/TalkingBen.exe — run npm run pack first.');
  process.exit(1);
}

if (fs.existsSync(out)) fs.unlinkSync(out);

const result = spawnSync('zip', ['-r', '-q', out, 'win-unpacked'], {
  cwd: release,
  stdio: 'inherit',
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}

console.log('Created', out);
