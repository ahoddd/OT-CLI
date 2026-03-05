#!/usr/bin/env node
/**
 * Generate app icon pack from assets/images/logo-source.png
 * Use the main OrbTap logo (dark theme) as logo-source.png so the app icon is the dark logo for all users.
 * Produces: icon.png (1024x1024), adaptive-icon.png (1024x1024), favicon.png (48x48), all with dark background.
 * Run: npm run generate-icons  (or node scripts/generate-icons.js)
 * Requires: npm install sharp --save-dev
 */

const path = require('path');
const fs = require('fs');

const ASSETS = path.join(__dirname, '..', 'assets', 'images');
const SOURCE = path.join(ASSETS, 'logo-source.png');

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.warn('Install sharp first: npm install sharp --save-dev');
    process.exit(1);
  }

  if (!fs.existsSync(SOURCE)) {
    console.warn('Missing logo-source.png in assets/images/. Add your logo there and run again.');
    process.exit(1);
  }

  const size1024 = 1024;
  const sizeFavicon = 48;

  // 1024x1024: fit logo inside square, black background (no transparency for iOS)
  const icon1024 = sharp(SOURCE).resize(size1024, size1024, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 1 },
  });

  await icon1024.clone().png().toFile(path.join(ASSETS, 'icon.png'));
  await icon1024.clone().png().toFile(path.join(ASSETS, 'adaptive-icon.png'));

  await sharp(SOURCE)
    .resize(sizeFavicon, sizeFavicon, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toFile(path.join(ASSETS, 'favicon.png'));

  console.log('Icon pack generated: icon.png (1024x1024), adaptive-icon.png (1024x1024), favicon.png (48x48)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
