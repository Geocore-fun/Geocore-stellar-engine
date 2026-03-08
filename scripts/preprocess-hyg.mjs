/**
 * preprocess-hyg.mjs
 *
 * Reads the full HYG v4.2 CSV and produces two compact outputs:
 *   public/data/stars.bin   – binary star catalog (positions, magnitudes, colors)
 *   public/data/named-stars.json – stars with proper names for label overlays
 *
 * Binary format (little-endian):
 *   Header (8 bytes)
 *     uint32  magic   0x48594753  ("HYGS")
 *     uint32  count   number of star records
 *   Per star (20 bytes)
 *     float32 rarad   right ascension in radians [0, 2π)
 *     float32 decrad  declination in radians [-π/2, π/2]
 *     float32 mag     apparent visual magnitude
 *     float32 ci      B-V color index (NaN → 0.0 default)
 *     uint32  hip     Hipparcos catalog ID (0 if none)
 *
 * Usage:
 *   node scripts/preprocess-hyg.mjs [--mag-limit 7.0]
 */

import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── CLI args ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
let magLimit = 7.0;
const magIdx = args.indexOf('--mag-limit');
if (magIdx !== -1 && args[magIdx + 1]) {
  magLimit = parseFloat(args[magIdx + 1]);
}

// ── Read CSV ───────────────────────────────────────────────────────────
const csvPath = join(ROOT, 'scripts', 'hyg_v42.csv');
console.log(`Reading ${csvPath} ...`);
const raw = readFileSync(csvPath, 'utf-8');
const lines = raw.split('\n');

// Parse header
const header = lines[0].replace(/"/g, '').split(',');
const col = (name) => header.indexOf(name);
const IDX = {
  id: col('id'),
  hip: col('hip'),
  proper: col('proper'),
  ra: col('ra'),
  dec: col('dec'),
  mag: col('mag'),
  ci: col('ci'),
  rarad: col('rarad'),
  decrad: col('decrad'),
  bayer: col('bayer'),
  con: col('con'),
  spect: col('spect'),
};

console.log(`Columns: ${header.length}, Rows: ${lines.length - 1}`);

// ── Parse and filter ───────────────────────────────────────────────────
/**
 * Simple CSV field parser that handles quoted fields with commas inside.
 */
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

const stars = [];
const namedStars = [];
let skipped = 0;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const f = parseCSVLine(line);
  const mag = parseFloat(f[IDX.mag]);
  if (isNaN(mag) || mag > magLimit) {
    skipped++;
    continue;
  }

  const rarad = parseFloat(f[IDX.rarad]);
  const decrad = parseFloat(f[IDX.decrad]);
  if (isNaN(rarad) || isNaN(decrad)) {
    skipped++;
    continue;
  }

  let ci = parseFloat(f[IDX.ci]);
  if (isNaN(ci)) ci = 0.0; // default to solar-ish white

  const hip = parseInt(f[IDX.hip]) || 0;
  const proper = f[IDX.proper] || '';
  const bayer = f[IDX.bayer] || '';
  const con = f[IDX.con] || '';

  stars.push({ rarad, decrad, mag, ci, hip });

  if (proper) {
    namedStars.push({
      name: proper,
      bayer,
      con,
      hip,
      ra: parseFloat(f[IDX.ra]),
      dec: parseFloat(f[IDX.dec]),
      rarad,
      decrad,
      mag,
      ci,
    });
  }
}

// Sort by magnitude (brightest first)
stars.sort((a, b) => a.mag - b.mag);
namedStars.sort((a, b) => a.mag - b.mag);

console.log(`Stars ≤ mag ${magLimit}: ${stars.length}`);
console.log(`Named stars: ${namedStars.length}`);
console.log(`Skipped: ${skipped}`);

// ── Write binary ───────────────────────────────────────────────────────
const MAGIC = 0x48594753; // "HYGS"
const HEADER_SIZE = 8;
const STAR_SIZE = 20;
const bufSize = HEADER_SIZE + STAR_SIZE * stars.length;
const buf = Buffer.alloc(bufSize);

buf.writeUInt32LE(MAGIC, 0);
buf.writeUInt32LE(stars.length, 4);

let offset = HEADER_SIZE;
for (const s of stars) {
  buf.writeFloatLE(s.rarad, offset);
  buf.writeFloatLE(s.decrad, offset + 4);
  buf.writeFloatLE(s.mag, offset + 8);
  buf.writeFloatLE(s.ci, offset + 12);
  buf.writeUInt32LE(s.hip, offset + 16);
  offset += STAR_SIZE;
}

const outDir = join(ROOT, 'public', 'data');
mkdirSync(outDir, { recursive: true });

const binPath = join(outDir, 'stars.bin');
writeFileSync(binPath, buf);
console.log(`Wrote ${binPath} (${buf.length} bytes)`);

// ── Write named stars JSON ─────────────────────────────────────────────
const jsonPath = join(outDir, 'named-stars.json');
writeFileSync(jsonPath, JSON.stringify(namedStars, null, 2));
console.log(`Wrote ${jsonPath} (${namedStars.length} entries)`);

console.log('\nDone!');
