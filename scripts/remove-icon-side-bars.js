/**
 * Remove the two vertical black bars/blocks on the left and right of the OrbTap icon.
 * Run from repo root: node scripts/remove-icon-side-bars.js
 *
 * Uses sharp to crop the icon. Adjust CROP_LEFT and CROP_RIGHT (pixels) if your
 * icon dimensions or bar widths differ. Output overwrites assets/images/icon.png.
 */
const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, '../assets/images/icon.png');
const outputPath = path.join(__dirname, '../assets/images/icon.png');

// Pixels to crop from left and right (black vertical bars). Tune to match your asset.
const CROP_LEFT = 18;
const CROP_RIGHT = 18;

async function main() {
  const meta = await sharp(inputPath).metadata();
  const { width, height } = meta;
  if (!width || !height) throw new Error('Could not read image dimensions');
  const newWidth = Math.max(1, width - CROP_LEFT - CROP_RIGHT);
  await sharp(inputPath)
    .extract({ left: CROP_LEFT, top: 0, width: newWidth, height })
    .toFile(outputPath);
  console.log(`Cropped icon: removed ${CROP_LEFT}px left, ${CROP_RIGHT}px right. New width: ${newWidth}px.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
