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

// Shortcut icon — Browse Shifts: calendar grid on teal
const calendarSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <rect width="96" height="96" fill="#1a4a3a"/>
  <rect x="16" y="22" width="64" height="58" rx="6" fill="#f0f6f0"/>
  <rect x="16" y="22" width="64" height="20" rx="6" fill="#5a8f5e"/>
  <rect x="16" y="34" width="64" height="8" fill="#5a8f5e"/>
  <line x1="34" y1="22" x2="34" y2="16" stroke="#f0f6f0" stroke-width="4" stroke-linecap="round"/>
  <line x1="62" y1="22" x2="62" y2="16" stroke="#f0f6f0" stroke-width="4" stroke-linecap="round"/>
  <rect x="24" y="52" width="10" height="8" rx="2" fill="#2c3e2d"/>
  <rect x="43" y="52" width="10" height="8" rx="2" fill="#2c3e2d"/>
  <rect x="62" y="52" width="10" height="8" rx="2" fill="#2c3e2d"/>
  <rect x="24" y="66" width="10" height="8" rx="2" fill="#2c3e2d"/>
  <rect x="43" y="66" width="10" height="8" rx="2" fill="#2c3e2d"/>
</svg>`;

// Shortcut icon — Post a Shift: pencil + plus on teal
const postSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <rect width="96" height="96" fill="#1a4a3a"/>
  <rect x="20" y="58" width="40" height="18" rx="4" fill="#f0f6f0"/>
  <rect x="20" y="20" width="40" height="44" rx="4" fill="#f0f6f0"/>
  <rect x="27" y="30" width="26" height="3" rx="1.5" fill="#5a8f5e"/>
  <rect x="27" y="37" width="20" height="3" rx="1.5" fill="#5a8f5e"/>
  <rect x="27" y="44" width="16" height="3" rx="1.5" fill="#5a8f5e"/>
  <circle cx="70" cy="65" r="14" fill="#f59e0b"/>
  <rect x="63" y="63.5" width="14" height="3" rx="1.5" fill="#1a4a3a"/>
  <rect x="68.5" y="58" width="3" height="14" rx="1.5" fill="#1a4a3a"/>
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

  // Shortcut icons 96×96
  await sharp(Buffer.from(calendarSvg)).resize(96, 96).png().toFile(join(root, "public/icons/shortcut-calendar.png"));
  console.log("✓ public/icons/shortcut-calendar.png");

  await sharp(Buffer.from(postSvg)).resize(96, 96).png().toFile(join(root, "public/icons/shortcut-post.png"));
  console.log("✓ public/icons/shortcut-post.png");

  // Apple touch icon 180×180
  await sharp(appleSvgBuf).resize(180, 180).png().toFile(join(root, "public/apple-touch-icon.png"));
  console.log("✓ public/apple-touch-icon.png");

  // Favicon 32×32 (also in public root)
  await sharp(iconSvgBuf).resize(32, 32).png().toFile(join(root, "public/favicon-32x32.png"));
  console.log("✓ public/favicon-32x32.png");

  // favicon.ico — 32×32 inside an ICO container using raw PNG bytes
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
