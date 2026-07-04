// Image pipeline per Build Bible §10.2: responsive AVIF/WebP/JPG at
// 480/960/1440/1920 (capped to native width), plus a base64 LQIP manifest.
import sharp from 'sharp';
import { readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SRC_DIR = 'assets';
const OUT_DIR = 'public/images';
const WIDTHS = [480, 960, 1440, 1920];

mkdirSync(OUT_DIR, { recursive: true });

const files = readdirSync(SRC_DIR).filter((f) => /\.(webp|jpg|jpeg|png)$/i.test(f));
const lqip = {};

for (const file of files) {
  const srcPath = path.join(SRC_DIR, file);
  const name = file.replace(/\.[^.]+$/, '');
  const meta = await sharp(srcPath).metadata();
  const targetWidths = [...new Set(WIDTHS.filter((w) => w <= meta.width).concat(meta.width <= WIDTHS[0] ? [meta.width] : []))];

  for (const w of targetWidths) {
    const base = sharp(srcPath).resize({ width: w });
    await base.clone().avif({ quality: 50 }).toFile(path.join(OUT_DIR, `${name}-${w}.avif`));
    await base.clone().webp({ quality: 72 }).toFile(path.join(OUT_DIR, `${name}-${w}.webp`));
    await base.clone().flatten({ background: '#0b0e14' }).jpeg({ quality: 72, mozjpeg: true }).toFile(path.join(OUT_DIR, `${name}-${w}.jpg`));
  }

  const lqipBuf = await sharp(srcPath).resize({ width: 24 }).blur(2).jpeg({ quality: 40 }).toBuffer();
  lqip[name] = {
    dataUri: `data:image/jpeg;base64,${lqipBuf.toString('base64')}`,
    widths: targetWidths.sort((a, b) => a - b),
    nativeWidth: meta.width,
    nativeHeight: meta.height,
  };

  console.log(`processed ${file} → widths [${targetWidths.join(', ')}]`);
}

writeFileSync(path.join(OUT_DIR, 'lqip.json'), JSON.stringify(lqip, null, 2));
mkdirSync('src/data', { recursive: true });
writeFileSync('src/data/image-manifest.json', JSON.stringify(lqip, null, 2));
console.log(`Done — ${files.length} source images, manifest written to ${OUT_DIR}/lqip.json and src/data/image-manifest.json`);
