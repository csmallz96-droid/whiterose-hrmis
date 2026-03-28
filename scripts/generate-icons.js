const sharp = require('sharp');
const path = require('path');

const input = path.join(__dirname, '../public/logo.jpeg');
const outputDir = path.join(__dirname, '../public');

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-48x48.png', size: 48 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'apple-touch-icon-152x152.png', size: 152 },
  { name: 'apple-touch-icon-120x120.png', size: 120 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'mstile-150x150.png', size: 150 },
];

async function generateIcons() {
  for (const icon of sizes) {
    await sharp(input)
      .resize(icon.size, icon.size, {
        fit: 'contain',
        background: { r: 43, g: 57, b: 144, alpha: 1 },
      })
      .png()
      .toFile(path.join(outputDir, icon.name));
    console.log(`Generated: ${icon.name}`);
  }
  console.log('All icons generated successfully.');
}

generateIcons().catch(console.error);
