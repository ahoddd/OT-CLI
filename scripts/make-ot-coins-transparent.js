/**
 * One-off: make light beige background of OT coins PNG transparent.
 * Run: node scripts/make-ot-coins-transparent.js
 */
const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, '../assets/images/ot-coins-pile.png');
const outputPath = inputPath;

async function main() {
  const img = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = img;
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const isBg = r > 200 && g > 200 && b > 180 && Math.abs(r - g) < 30 && Math.abs(g - b) < 40;
    if (isBg) data[i + 3] = 0;
  }
  await sharp(data, { raw: { width, height, channels } })
    .png()
    .toFile(outputPath);
  console.log('Done: background made transparent.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
