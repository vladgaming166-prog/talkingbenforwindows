/**
 * Generate application icons (original artwork).
 * Creates PNG sizes and a multi-resolution ICO for Windows.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const dir = path.join(__dirname, '..', 'build');
fs.mkdirSync(dir, { recursive: true });

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    }
  }
  return ~c >>> 0;
}

function createPNG(size) {
  const width = size;
  const height = size;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const i = row + 1 + x * 4;
      const cx = x - size / 2;
      const cy = y - size / 2;
      const dist = Math.sqrt(cx * cx + cy * cy) / (size / 2);
      let r = 45,
        g = 90,
        b = 55,
        a = 255;
      if (dist < 0.92) {
        r = 210;
        g = 140;
        b = 70;
      }
      if (dist < 0.55) {
        r = 230;
        g = 170;
        b = 100;
      }
      const leftEye = Math.hypot(cx + size * 0.14, cy + size * 0.05) < size * 0.08;
      const rightEye = Math.hypot(cx - size * 0.14, cy + size * 0.05) < size * 0.08;
      if (leftEye || rightEye) {
        r = 30;
        g = 20;
        b = 15;
      }
      if (Math.hypot(cx, cy - size * 0.08) < size * 0.07) {
        r = 35;
        g = 22;
        b = 16;
      }
      if (dist > 0.95) a = 0;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }

  function chunk(type, data) {
    const typeBuf = Buffer.from(type);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const crcBuf = Buffer.alloc(4);
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const compressed = zlib.deflateSync(raw);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function createIco(pngBuffersWithSizes) {
  const count = pngBuffersWithSizes.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const entries = [];
  let offset = 6 + 16 * count;
  for (const { size, png } of pngBuffersWithSizes) {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size;
    entry[1] = size >= 256 ? 0 : size;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += png.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffersWithSizes.map((p) => p.png)]);
}

const png256 = createPNG(256);
const png128 = createPNG(128);
const png64 = createPNG(64);
const png48 = createPNG(48);
const png32 = createPNG(32);
const png16 = createPNG(16);

fs.writeFileSync(path.join(dir, 'icon.png'), png256);
fs.writeFileSync(path.join(dir, 'icon-256.png'), png256);
fs.writeFileSync(path.join(dir, 'icon-128.png'), png128);
fs.writeFileSync(path.join(dir, 'icon-64.png'), png64);
fs.writeFileSync(path.join(dir, 'icon-32.png'), png32);

const ico = createIco([
  { size: 256, png: png256 },
  { size: 128, png: png128 },
  { size: 64, png: png64 },
  { size: 48, png: png48 },
  { size: 32, png: png32 },
  { size: 16, png: png16 },
]);
fs.writeFileSync(path.join(dir, 'icon.ico'), ico);

console.log('Icons generated in build/ (ICO includes 256px)');
