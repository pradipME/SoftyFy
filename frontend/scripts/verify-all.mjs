// End-to-end verification of every generated song: streams (via the app's
// candidate chain, exactly as buildAudioCandidates builds it) + cover images,
// grouped by API key.
import { readFileSync } from 'node:fs'

const songsTs = readFileSync('src/data/songs.ts', 'utf8')

const entryRe = /\{\s*?id:\s*'([^']+)'[\s\S]*?audioSrc:\s*'([^']+)'[\s\S]*?coverSrc:\s*'([^']+)'[\s\S]*?\}/g
const songs = []
let m
while ((m = entryRe.exec(songsTs)) !== null) {
  const [, id, audioSrc, coverSrc] = m
  const fm = /\/files\/([^?]+)\?alt=media&key=([^']+)/.exec(audioSrc)
  if (!fm) throw new Error('unexpected audioSrc: ' + audioSrc)
  songs.push({ id, fileId: fm[1], key: fm[2], audioSrc, coverSrc })
}
console.log(`parsed ${songs.length} songs\n`)

function candidateUrls(song) {
  return {
    usercontent: `https://drive.usercontent.google.com/download?id=${song.fileId}&export=download`,
    uc: `https://drive.google.com/uc?export=download&confirm=t&id=${song.fileId}`,
    api: song.audioSrc,
  }
}

async function probe(url, range = true) {
  const headers = range ? { Range: 'bytes=0-2047' } : {}
  const t0 = Date.now()
  try {
    const r = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    })
    const ct = (r.headers.get('content-type') || 'none').split(';')[0]
    return { ok: r.status === (range ? 206 : 200), status: r.status, ct, ms: Date.now() - t0 }
  } catch (e) {
    return { ok: false, status: 'ERR', ct: String((e && e.message) || e).slice(0, 60), ms: Date.now() - t0 }
  }
}

const CONCURRENCY = 5
async function mapLimit(items, fn) {
  const results = new Array(items.length)
  let i = 0
  const worker = async () => {
    while (true) {
      const idx = i++
      if (idx >= items.length) return
      results[idx] = await fn(items[idx], idx)
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker))
  return results
}

const audioRes = await mapLimit(songs, async (s) => {
  const urls = candidateUrls(s)
  const [usercontent, uc, api] = await Promise.all([
    probe(urls.usercontent),
    probe(urls.uc),
    probe(urls.api),
  ])
  const cover = await probe(s.coverSrc, false)
  return { song: s, urls, usercontent, uc, api, cover }
})

// Per-key aggregate
const byKey = new Map()
for (const r of audioRes) {
  if (!byKey.has(r.song.key)) byKey.set(r.song.key, [])
  byKey.get(r.song.key).push(r)
}

let allOk = true
for (const [key, rows] of byKey) {
  const n = rows.length
  const count = (f) => rows.filter(f).length
  const us = count((r) => r.usercontent.ok)
  const uc = count((r) => r.uc.ok)
  const ap = count((r) => r.api.ok)
  const cv = count((r) => r.cover.ok)
  const anyAudio = count((r) => r.usercontent.ok || r.uc.ok || r.api.ok)
  console.log(`KEY ${key.slice(-4)}…   songs=${n}`)
  console.log(`  usercontent(keyless) ${us}/${n}   uc(keyless) ${uc}/${n}   api(keyed) ${ap}/${n}   covers ${cv}/${n}   playable(any host) ${anyAudio}/${n}`)
  if (us !== n || cv !== n) allOk = false
}

console.log('\n---- details (failures / anomalies) ----')
for (const r of audioRes) {
  const bad = []
  if (!r.usercontent.ok) bad.push(`usercontent ${r.usercontent.status}/${r.usercontent.ct}`)
  if (!r.uc.ok) bad.push(`uc ${r.uc.status}/${r.uc.ct}`)
  if (!r.api.ok) bad.push(`api ${r.api.status}/${r.api.ct}`)
  if (!r.cover.ok) bad.push(`cover ${r.cover.status}/${r.cover.ct}`)
  if (bad.length) {
    allOk = false
    console.log(`[${r.song.id}] key..${r.song.key.slice(-4)}: ${bad.join('  |  ')}`)
  }
  if (!r.usercontent.ok || !r.uc.ok) {
    if (r.uc.ok) console.log(`   (> note: ${r.song.id} usercontent failed but uc OK)`)
    if (r.usercontent.ok) console.log(`   (> note: ${r.song.id} uc failed but usercontent OK)`)
  }
}

console.log(allOk ? '\nALL GREEN' : '\nSOME FAILURES ABOVE')