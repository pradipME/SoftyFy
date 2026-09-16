export interface CoverPalette {
  /** Dominant saturated color sampled from the cover art. */
  primary: string
  /** A second, visually distinct color for the ambient gradient. */
  secondary: string
}

const cache = new Map<string, Promise<CoverPalette | null>>()

/**
 * Extracts a small palette from a cover image by downscaling it onto a canvas
 * and histogram-quantizing the pixels. Results are cached per image URL so the
 * work happens once per song. Resolves `null` when the image can't be read.
 *
 * Pixel readback requires a CORS-readable image: an opaque (no-cors) load
 * taints the canvas and `getImageData()` throws. Drive thumbnails
 * (`drive.google.com/thumbnail?id=…&sz=w1000`) redirect 302 to lh3 without a
 * CORS header on that first hop, so loading them here with CORS fails and
 * loading them opaque makes them unreadable. Only same-origin covers (e.g.
 * `/covers/X.jpg` served by the app) are extracted — remote covers resolve
 * `null` and the caller keeps its deterministic fallback palette. Cover art
 * itself still renders normally through plain `<img src>` tags (opaque loads),
 * which never enforce CORS.
 */
export function getCoverColors(src: string): Promise<CoverPalette | null> {
  const existing = cache.get(src)
  if (existing !== undefined) return existing
  const promise = extract(src).catch(() => null)
  cache.set(src, promise)
  return promise
}

function isSameOrigin(src: string): boolean {
  try {
    const url = new URL(src, window.location.href)
    return url.origin === window.location.origin
  } catch {
    return false
  }
}

function extract(src: string): Promise<CoverPalette | null> {
  if (!isSameOrigin(src)) return Promise.resolve(null)
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        if (!img.naturalWidth || !img.naturalHeight) {
          resolve(null)
          return
        }
        const size = 24
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (ctx === null) {
          resolve(null)
          return
        }
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)

        const buckets = new Map<number, { r: number; g: number; b: number; count: number }>()
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3]
          if (a < 125) continue
          const key = (((data[i] >> 5) << 10) | ((data[i + 1] >> 5) << 5) | (data[i + 2] >> 5)) >>> 0
          const bucket = buckets.get(key)
          if (bucket) {
            bucket.r += data[i]
            bucket.g += data[i + 1]
            bucket.b += data[i + 2]
            bucket.count += 1
          } else {
            buckets.set(key, {
              r: data[i],
              g: data[i + 1],
              b: data[i + 2],
              count: 1,
            })
          }
        }
        if (buckets.size === 0) {
          resolve(null)
          return
        }

        const averages = [...buckets.values()]
          .map((b) => ({
            r: Math.round(b.r / b.count),
            g: Math.round(b.g / b.count),
            b: Math.round(b.b / b.count),
            count: b.count,
          }))
          .sort((x, y) => y.count - x.count)

        const primary = pick({ r: 0, g: 0, b: 0 }, averages)
        if (primary === null) {
          resolve(null)
          return
        }
        const secondary = pick(primary, averages) ?? primary
        resolve({
          primary: boost(toHex(primary.r, primary.g, primary.b)),
          secondary: boost(toHex(secondary.r, secondary.g, secondary.b)),
        })
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/** Best bucket (by weight) at least 70 units of RGB distance from `from`. */
function pick(
  from: { r: number; g: number; b: number },
  sorted: { r: number; g: number; b: number; count: number }[],
): { r: number; g: number; b: number } | null {
  for (const bucket of sorted) {
    const dist = Math.abs(bucket.r - from.r) + Math.abs(bucket.g - from.g) + Math.abs(bucket.b - from.b)
    if (dist >= 70) return bucket
  }
  return sorted[0] ?? null
}

/** Dark covers produce muddy ambient — lift them toward a usable mid tone. */
function boost(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
  if (luma >= 90) return hex
  const lift = 0.28
  const nr = Math.round(r + (255 - r) * lift)
  const ng = Math.round(g + (255 - g) * lift)
  const nb = Math.round(b + (255 - b) * lift)
  return toHex(nr, ng, nb)
}

/**
 * Deterministic per-song fallback so the ambient layer always has a distinct
 * hue even before any cover art exists or while an image is still loading.
 * Returns 6-digit hex (so callers can append an alpha suffix safely).
 */
export function fallbackPalette(seed: string): CoverPalette {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  const h1 = hash % 360
  const h2 = (h1 + 60 + (hash % 90)) % 360
  return { primary: hslToHex(h1, 72, 58), secondary: hslToHex(h2, 78, 46) }
}

/** Converts an HSL color to a 6-digit hex string (alpha is appended by callers). */
function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100
  const light = l / 100
  const chroma = (1 - Math.abs(2 * light - 1)) * sat
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = light - chroma / 2
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) {
    r = chroma
    g = x
  } else if (h < 120) {
    r = x
    g = chroma
  } else if (h < 180) {
    g = chroma
    b = x
  } else if (h < 240) {
    g = x
    b = chroma
  } else if (h < 300) {
    r = x
    b = chroma
  } else {
    r = chroma
    b = x
  }
  return toHex(Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255))
}

function toHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const value = hex.replace('#', '')
  const num = Number.parseInt(value, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}
