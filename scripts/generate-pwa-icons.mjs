/**
 * Generates PWA icons from an SVG source using sharp.
 * Run once: node scripts/generate-pwa-icons.mjs
 */
import sharp from "sharp";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Square icon SVG — uses the Rx circle emblem from the ShiftSwap logo.
// Centered on a deep teal (#1a4a3a) square so it looks good on home screens.
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Background square — deep teal brand colour -->
  <rect width="512" height="512" fill="#1a4a3a" rx="0"/>

  <!-- Outer dashed ring -->
  <circle cx="256" cy="256" r="210" stroke="#5a8f5e" stroke-width="5" fill="none" stroke-dasharray="14 10"/>
  <!-- Inner filled circle -->
  <circle cx="256" cy="256" r="168" fill="#f0f6f0"/>

  <!-- Swap arc — top (left to right) -->
  <path d="M138 145 Q256 80 374 145" stroke="#5a8f5e" stroke-width="7" fill="none" stroke-linecap="round"/>
  <!-- Arrowhead top right -->
  <polyline points="356,125 374,145 353,158" stroke="#5a8f5e" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Swap arc — bottom (right to left) -->
  <path d="M374 367 Q256 432 138 367" stroke="#5a8f5e" stroke-width="7" fill="none" stroke-linecap="round"/>
  <!-- Arrowhead bottom left -->
  <polyline points="158,387 138,367 160,354" stroke="#5a8f5e" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Rx letterform — centred -->
  <text x="156" y="318" font-family="Georgia, serif" font-size="174" font-style="italic" font-weight="400" fill="#2c3e2d">Rx</text>
</svg>`;

// Apple touch icon: same design, rounded rect background for iOS.
// iOS clips to a rounded rect so we don't add corner radius ourselves.
const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <rect width="180" height="180" fill="#1a4a3a"/>
  <circle cx="90" cy="90" r="74" stroke="#5a8f5e" stroke-width="2" fill="none" stroke-dasharray="5 3.5"/>
  <circle cx="90" cy="90" r="59" fill="#f0f6f0"/>
  <path d="M49 51 Q90 28 131 51" stroke="#5a8f5e" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <polyline points="125,44 131,51 124,56" stroke="#5a8f5e" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M131 129 Q90 152 49 129" stroke="#5a8f5e" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <polyline points="55,136 49,129 56,124" stroke="#5a8f5e" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="55" y="112" font-family="Georgia, serif" font-size="61" font-style="italic" font-weight="400" fill="#2c3e2d">Rx</text>
</svg>`;

async function generate() {
  const iconSvgBuf = Buffer.from(iconSvg);
  const appleSvgBuf = Buffer.from(appleSvg);

  // 192×192 PNG
  await sharp(iconSvgBuf).resize(192, 192).png().toFile(join(root, "public/icons/icon-192x192.png"));
  console.log("✓ public/icons/icon-192x192.png");

  // 512×512 PNG
  await sharp(iconSvgBuf).resize(512, 512).png().toFile(join(root, "public/icons/icon-512x512.png"));
  console.log("✓ public/icons/icon-512x512.png");

  // Apple touch icon 180×180
  await sharp(appleSvgBuf).resize(180, 180).png().toFile(join(root, "public/apple-touch-icon.png"));
  console.log("✓ public/apple-touch-icon.png");

  // Favicon 32×32 (also in public root)
  await sharp(iconSvgBuf).resize(32, 32).png().toFile(join(root, "public/favicon-32x32.png"));
  console.log("✓ public/favicon-32x32.png");

  // favicon.ico — 32×32 inside an ICO container using raw PNG bytes
  // sharp can output PNG; for a proper .ico we write a minimal ICO wrapper.
  const pngBuf32 = await sharp(iconSvgBuf).resize(32, 32).png().toBuffer();
  writeFileSync(join(root, "public/favicon.ico"), buildIco(pngBuf32));
  console.log("✓ public/favicon.ico");

  console.log("\nAll icons generated.");
}

/**
 * Builds a minimal ICO file containing a single 32×32 PNG image.
 * ICO format: https://en.wikipedia.org/wiki/ICO_(file_format)
 */
function buildIco(pngBuffer) {
  const HEADER_SIZE = 6;
  const ENTRY_SIZE = 16;
  const dataOffset = HEADER_SIZE + ENTRY_SIZE;

  const buf = Buffer.alloc(dataOffset + pngBuffer.length);

  // ICO header
  buf.writeUInt16LE(0, 0);       // reserved
  buf.writeUInt16LE(1, 2);       // type: 1 = ICO
  buf.writeUInt16LE(1, 4);       // number of images

  // Image entry
  buf.writeUInt8(32, 6);         // width (32 = 32px; 0 = 256px)
  buf.writeUInt8(32, 7);         // height
  buf.writeUInt8(0, 8);          // color count (0 = >256 colors)
  buf.writeUInt8(0, 9);          // reserved
  buf.writeUInt16LE(1, 10);      // color planes
  buf.writeUInt16LE(32, 12);     // bits per pixel
  buf.writeUInt32LE(pngBuffer.length, 14); // size of image data
  buf.writeUInt32LE(dataOffset, 18);       // offset to image data

  pngBuffer.copy(buf, dataOffset);
  return buf;
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
