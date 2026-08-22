'use strict';

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

async function main() {
  const distRenderer = path.join(__dirname, '..', 'dist', 'renderer');
  fs.mkdirSync(distRenderer, { recursive: true });

  // Copy static HTML/CSS
  fs.copyFileSync(
    path.join(__dirname, '..', 'src', 'renderer', 'index.html'),
    path.join(distRenderer, 'index.html'),
  );
  fs.copyFileSync(
    path.join(__dirname, '..', 'src', 'renderer', 'styles.css'),
    path.join(distRenderer, 'styles.css'),
  );

  // Bundle renderer entry (browser)
  await esbuild.build({
    entryPoints: [path.join(__dirname, '..', 'src', 'renderer', 'app.ts')],
    bundle: true,
    outfile: path.join(distRenderer, 'app.js'),
    platform: 'browser',
    target: ['chrome120'],
    format: 'iife',
    sourcemap: true,
    logLevel: 'info',
  });

  // Copy assets if present
  const assetsSrc = path.join(__dirname, '..', 'assets');
  const assetsDest = path.join(__dirname, '..', 'dist', 'assets');
  if (fs.existsSync(assetsSrc)) {
    copyDir(assetsSrc, assetsDest);
  }

  console.log('Renderer bundled and static assets copied.');
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
