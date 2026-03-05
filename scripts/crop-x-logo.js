/**
 * One-time script: trim white/light pixels from assets/images/x-logo.png
 * so only the black icon with the X remains (no white border).
 */
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

const inputPath = path.join(__dirname, '../assets/images/x-logo.png');
const outputPath = path.join(__dirname, '../assets/images/x-logo.png');

async function run() {
  // Trim pixels within threshold of the corner color (white/light gray)
  const trimmed = await sharp(inputPath)
    .trim({ threshold: 40 })
    .png()
    .toBuffer();
  const meta = await sharp(trimmed).metadata();
  fs.writeFileSync(outputPath, trimmed);
  console.log('Trimmed x-logo.png — white removed, size now', meta.width, 'x', meta.height);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
