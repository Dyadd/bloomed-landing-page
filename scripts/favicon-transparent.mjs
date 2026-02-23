/**
 * Makes white (and near-white) pixels in public/favicon.png transparent.
 * Run: npm run favicon:transparent
 */
import sharp from 'sharp';
import { renameSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const input = join(root, 'public', 'favicon.png');
const output = join(root, 'public', 'favicon-transparent.png');

const image = sharp(input);
const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
// Treat pixels as white if R, G, B are all >= 250
const threshold = 250;
for (let i = 0; i < data.length; i += channels) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  if (r >= threshold && g >= threshold && b >= threshold) {
    data[i + 3] = 0; // full transparent
  }
}
await sharp(data, { raw: { width, height, channels } })
  .png()
  .toFile(output);
renameSync(output, input);
console.log('Favicon updated with transparent background:', input);
