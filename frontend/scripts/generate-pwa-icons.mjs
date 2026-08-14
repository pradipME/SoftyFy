// Dev-time utility: render the PWA launcher icons from public/favicon.svg.
//
// Outputs (into public/icons/):
//   icon-192.png / icon-512.png      "any" purpose icons (Chrome install prompt)
//   maskable-192.png / maskable-512.png   Android maskable icons (full-bleed bg,
//                                         logo kept inside the safe zone)
//   apple-touch-icon.png              iOS home-screen icon (180x180)
//
// Usage:  node scripts/generate-pwa-icons.mjs
//
// The SVG is rasterized at the target resolution (via sharp's `density`) so the
// vector shapes and glow filters stay sharp, then composited on the app's
// base-dark background so the icon looks right on any launcher wallpaper.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT_DIR = resolve(ROOT, 'public/icons')
const SVG_PATH = resolve(ROOT, 'public/favicon.svg')

const SVG_WIDTH = 48 // favicon.svg viewBox width (logo canvas)
const SVG_HEIGHT = 46 // favicon.svg viewBox height
const BACKGROUND = '#121212' // app base color (--color-base)

/** Renders the logo rasterized at target size, returns a PNG Buffer. */
async function renderLogo(widthPx) {
  // Render the vector at the output resolution so filters stay crisp.
  const density = 72 * (widthPx / SVG_WIDTH)
  return sharp(SVG_PATH, { density }).png().toBuffer()
}

/** Composites the logo (scaled to `scale` of the canvas) onto a solid bg. */
async function makeIcon(outName, size, scale) {
  const logoW = Math.round(size * scale)
  const logoH = Math.round(logoW * (SVG_HEIGHT / SVG_WIDTH))
  const logo = sharp(await renderLogo(logoW), { limitInputPixels: false }).resize(logoW, logoH)

  const offsetX = Math.round((size - logoW) / 2)
  const offsetY = Math.round((size - logoH) / 2)

  const canvas = sharp({
    create: { width: size, height: size, channels: 3, background: BACKGROUND },
  })

  const out = await canvas
    .composite([{ input: await logo.png().toBuffer(), left: offsetX, top: offsetY }])
    .png()
    .toBuffer()

  await writeFile(resolve(OUT_DIR, outName), out)
  console.log(`OK ${outName} (${size}x${size}, logo ${scale * 100}%)`)
}

const main = async () => {
  await mkdir(OUT_DIR, { recursive: true })
  const svg = await readFile(SVG_PATH, 'utf8')
  if (!svg.includes('<svg')) throw new Error(`${SVG_PATH} does not look like an SVG`)

  await makeIcon('icon-192.png', 192, 0.86)
  await makeIcon('icon-512.png', 512, 0.86)
  await makeIcon('maskable-192.png', 192, 0.58)
  await makeIcon('maskable-512.png', 512, 0.58)
  await makeIcon('apple-touch-icon.png', 180, 0.86)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
