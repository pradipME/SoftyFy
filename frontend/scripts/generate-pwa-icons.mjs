// Dev-time utility: generate the SoftyFy PWA launcher icons + favicon from the
// official logo (scripts/softyfy-logo.png).
//
// The source is the final app-icon artwork (red rounded square with the
// portrait + colorful music waves). It is used EXACTLY as provided:
//
//   icon-192.png / icon-512.png / apple-touch-icon.png
//     The artwork resized 1:1 to the target size — rounded square, red
//     background and all, untouched.
//
//   maskable-192.png / maskable-512.png
//     Same artwork, but the near-black surround is replaced with the artwork's
//     own red so the maskable icon has a full-bleed background, and the logo is
//     scaled into the Android safe zone (central ~80% circle) so the face and
//     music-wave details are never cut off by the launcher mask.
//
//   favicon.png (public/)
//     The artwork at 96x96 for the browser tab favicon.
//
// Usage:  node scripts/generate-pwa-icons.mjs   (or: npm run icons)
//
// Only the dark pixels connected to the image border are treated as the
// surround; dark details inside the artwork (sunglasses, hair, shadows) stay
// untouched because they are not connected to the border.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SOURCE = resolve(ROOT, 'scripts/softyfy-logo.png')
const ICONS_DIR = resolve(ROOT, 'public/icons')

// Proportion of the canvas the logo should occupy on maskable icons. Fits the
// whole artwork (including the wave detail near its bottom edge) comfortably
// inside Android's 80%-diameter safe-zone circle.
const MASKABLE_SCALE = 0.78

// Luminance below which a pixel is considered part of the dark surround.
const DARK_LUMA = 45

/**
 * Reads the source artwork once and returns { width, height, rgb } where rgb is
 * a flat Uint8Array of RGB triplets.
 */
async function readSource() {
  const { data, info } = await sharp(SOURCE).raw().toBuffer({ resolveWithObject: true })
  return { width: info.width, height: info.height, rgb: new Uint8Array(data.buffer, data.byteOffset, data.length) }
}

/**
 * The artwork's own red background color (average of the red band mid-edges),
 * used as the full-bleed fill behind maskable icons. Returns [r, g, b].
 */
function dominantRed(src) {
  const { width: w, height: h, rgb } = src
  const samples = [
    [Math.floor(w / 2), Math.floor(h * 0.06)],
    [Math.floor(w * 0.06), Math.floor(h / 2)],
    [Math.floor(w * 0.94), Math.floor(h / 2)],
    [Math.floor(w / 2), Math.floor(h * 0.93)],
  ]
  const ok = []
  for (const [x, y] of samples) {
    const i = (y * w + x) * 3
    const r = rgb[i]
    const g = rgb[i + 1]
    const b = rgb[i + 2]
    if (r > 60 && r > g * 1.6 && r > b * 1.6) ok.push([r, g, b])
  }
  if (ok.length === 0) return [139, 0, 0]
  const n = ok.length
  return [
    Math.round(ok.reduce((s, c) => s + c[0], 0) / n),
    Math.round(ok.reduce((s, c) => s + c[1], 0) / n),
    Math.round(ok.reduce((s, c) => s + c[2], 0) / n),
  ]
}

/**
 * Flood-fills dark pixels connected to the image border and returns an RGBA
 * buffer with those pixels made transparent. Interior dark details (not
 * connected to the border) are preserved.
 */
function removeDarkSurround(src) {
  const { width: w, height: h, rgb } = src
  const rgba = Buffer.alloc(w * h * 4)
  for (let i = 0; i < w * h; i += 1) {
    rgba[i * 4] = rgb[i * 3]
    rgba[i * 4 + 1] = rgb[i * 3 + 1]
    rgba[i * 4 + 2] = rgb[i * 3 + 2]
    rgba[i * 4 + 3] = 255
  }

  const isDark = (i) => {
    const r = rgb[i * 3]
    const g = rgb[i * 3 + 1]
    const b = rgb[i * 3 + 2]
    return (0.299 * r + 0.587 * g + 0.114 * b) < DARK_LUMA
  }

  const visited = new Uint8Array(w * h)
  const queue = new Int32Array(w * h)
  let head = 0
  let tail = 0

  const push = (i) => {
    if (visited[i]) return
    visited[i] = 1
    queue[tail++] = i
  }

  for (let x = 0; x < w; x += 1) {
    if (isDark(x)) push(x)
    if (isDark((h - 1) * w + x)) push((h - 1) * w + x)
  }
  for (let y = 0; y < h; y += 1) {
    if (isDark(y * w)) push(y * w)
    if (isDark(y * w + w - 1)) push(y * w + w - 1)
  }

  while (head < tail) {
    const i = queue[head++]
    rgba[i * 4 + 3] = 0
    const x = i % w
    const y = (i - x) / w
    if (x > 0 && isDark(i - 1)) push(i - 1)
    if (x < w - 1 && isDark(i + 1)) push(i + 1)
    if (y > 0 && isDark(i - w)) push(i - w)
    if (y < h - 1 && isDark(i + w)) push(i + w)
  }

  return rgba
}

/** Direct 1:1 resize of the artwork (kept exactly as provided). */
async function plainIcon(size, outName, destDir) {
  const out = await sharp(SOURCE).resize(size, size).png().toBuffer()
  await writeFile(resolve(destDir, outName), out)
  console.log(`OK ${outName} (${size}x${size}, artwork as provided)`)
}

/** Maskable icon: full-bleed red + artwork scaled into the safe zone. */
async function maskableIcon(size, outName) {
  const src = await readSource()
  const red = dominantRed(src)
  const rgba = removeDarkSurround(src)

  const masked = await sharp(rgba, {
    raw: { width: src.width, height: src.height, channels: 4 },
  })
    .png()
    .toBuffer()

  const logoSize = Math.round(size * MASKABLE_SCALE)
  const logo = sharp(masked).resize(logoSize, logoSize)

  const canvas = sharp({
    create: { width: size, height: size, channels: 3, background: { r: red[0], g: red[1], b: red[2] } },
  })

  const offset = Math.round((size - logoSize) / 2)
  const out = await canvas
    .composite([{ input: await logo.png().toBuffer(), left: offset, top: offset }])
    .png()
    .toBuffer()

  await writeFile(resolve(ICONS_DIR, outName), out)
  console.log(
    `OK ${outName} (${size}x${size}, red fill #${red.map((v) => v.toString(16).padStart(2, '0')).join('')}, logo ${MASKABLE_SCALE * 100}%)`,
  )
}

const main = async () => {
  await mkdir(ICONS_DIR, { recursive: true })
  const probe = await readFile(SOURCE)
  if (probe.length === 0) throw new Error(`${SOURCE} is empty or missing`)

  await plainIcon(192, 'icon-192.png', ICONS_DIR)
  await plainIcon(512, 'icon-512.png', ICONS_DIR)
  await plainIcon(180, 'apple-touch-icon.png', ICONS_DIR)
  await maskableIcon(192, 'maskable-192.png')
  await maskableIcon(512, 'maskable-512.png')
  await plainIcon(96, 'favicon.png', resolve(ROOT, 'public'))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
