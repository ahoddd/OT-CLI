/**
 * Make dark background of orb tier PNGs transparent so only the orb shows (for map pins).
 * Run: node scripts/make-orb-pins-transparent.js
 * Processes: orb-silver-free-tier.png, orb-gold-premium-tier.png, orb-platinum-pro-tier.png
 * Overwrites files in assets/.
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS = path.join(__dirname, '../assets');
const ORB_FILES = [
  'orb-silver-free-tier.png',
  'orb-gold-premium-tier.png',
  'orb-platinum-pro-tier.png',
];

/**
 * Dark neutral grey: low luminance and r≈g≈b.
 * Thresholds tuned so we remove studio dark grey background but keep orb body and soft shadow.
 */
function isDarkNeutralBackground(r, g, b, options = {}) {
  const { maxLuma = 72, neutralTolerance = 28 } = options;
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  if (luma > maxLuma) return false;
  const maxC = Math.max(r, g, b);
  const minC = Math.min(r, g, b);
  const chroma = maxC - minC;
  return chroma <= neutralTolerance;
}

async function processOrb(inputPath, outputPath) {
  const img = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = img;
  const { width, height, channels } = info;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isDarkNeutralBackground(r, g, b)) {
      data[i + 3] = 0;
    }
  }

  await sharp(data, { raw: { width, height, channels } })
    .png()
    .toFile(outputPath);
}

async function main() {
  for (const name of ORB_FILES) {
    const inputPath = path.join(ASSETS, name);
    if (!fs.existsSync(inputPath)) {
      console.warn('Skip (not found):', name);
      continue;
    }
    await processOrb(inputPath, inputPath);
    console.log('Done:', name);
  }
  console.log('All orb pin images updated with transparent background.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
