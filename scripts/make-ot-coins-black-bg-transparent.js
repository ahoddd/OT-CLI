/**
 * Make solid black background of OT coins PNG transparent.
 * Run: node scripts/make-ot-coins-black-bg-transparent.js
 * Uses the image at assets/images/ot-coins-pile.png (overwrites it).
 * Or set INPUT_PATH env to use another file; OUTPUT_PATH defaults to assets/images/ot-coins-pile.png.
 */
const sharp = require('sharp');
const path = require('path');

const inputPath = process.env.INPUT_PATH || path.join(__dirname, '../assets/images/ot-coins-pile.png');
const outputPath = process.env.OUTPUT_PATH || path.join(__dirname, '../assets/images/ot-coins-pile.png');

async function main() {
  const img = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = img;
  const { width, height, channels } = info;
  const threshold = 35; // pixels with r,g,b all below this become transparent
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const isBlack = r <= threshold && g <= threshold && b <= threshold;
    if (isBlack) data[i + 3] = 0;
  }
  await sharp(data, { raw: { width, height, channels } })
    .png()
    .toFile(outputPath);
  console.log('Done: black background made transparent.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
