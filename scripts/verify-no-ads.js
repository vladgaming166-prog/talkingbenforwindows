'use strict';

/**
 * Ensures no advertising SDKs or tracking packages are present.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const forbidden = [
  'admob',
  'google-ads',
  'googleads',
  'unity-ads',
  'unityads',
  'adsense',
  'doubleclick',
  'advertising',
  'ad-sdk',
  'adsdk',
  'facebook-audience',
  'applovin',
  'ironsource',
  'chartboost',
  'vungle',
  'mopub',
  'adcolony',
];

const scanPaths = [
  path.join(root, 'package.json'),
  path.join(root, 'package-lock.json'),
  path.join(root, 'src'),
];

let failures = [];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'release') continue;
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

function checkText(filePath, text) {
  const lower = text.toLowerCase();
  for (const term of forbidden) {
    if (!lower.includes(term)) continue;
    // Allow documentation / bans that explicitly reject ads
    if (
      lower.includes('ad-free') ||
      lower.includes('no ' + term) ||
      lower.includes('without ' + term) ||
      lower.includes('no advertising') ||
      lower.includes('without advertising') ||
      lower.includes('advertising integrations') ||
      lower.includes('advertising sdk') ||
      lower.includes('advertising tracking') ||
      lower.includes('advertising audio') ||
      lower.includes('banner advertising') ||
      lower.includes('forbidden') ||
      /no\s+(ads?|advertising|ad\s*sdk)/i.test(text)
    ) {
      continue;
    }
    failures.push(`${filePath}: contains forbidden term "${term}"`);
  }
}

for (const p of scanPaths) {
  if (!fs.existsSync(p)) continue;
  const stat = fs.statSync(p);
  if (stat.isFile()) {
    checkText(p, fs.readFileSync(p, 'utf8'));
  } else {
    for (const file of walk(p)) {
      if (!/\.(ts|js|json|html|css|md)$/i.test(file)) continue;
      checkText(file, fs.readFileSync(file, 'utf8'));
    }
  }
}

if (failures.length) {
  console.error('AD VERIFICATION FAILED:');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}

console.log('✓ No advertising integrations found.');
