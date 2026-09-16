// End-to-end verification of every generated song: the single playable stream
// URL (buildAudioCandidates now returns only the googleapis media URL — every
// other host was proven broken for cross-site media in real browsers) + cover
// images.
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
  const [api, cover] = await Promise.all([probe(s.audioSrc), probe(s.coverSrc, false)])
  return { song: s, api, cover }
})

const n = audioRes.length
const ap = audioRes.filter((r) => r.api.ok).length
const cv = audioRes.filter((r) => r.cover.ok).length
const allOk = ap === n && cv === n
console.log(`api(keyed, 206) ${ap}/${n}   covers ${cv}/${n}`)

console.log('\n---- details (failures / anomalies) ----')
for (const r of audioRes) {
  const bad = []
  if (!r.api.ok) bad.push(`api ${r.api.status}/${r.api.ct}`)
  if (!r.cover.ok) bad.push(`cover ${r.cover.status}/${r.cover.ct}`)
  if (bad.length) console.log(`[${r.song.id}] key..${r.song.key.slice(-4)}: ${bad.join('  |  ')}`)
}

console.log(allOk ? '\nALL GREEN' : '\nSOME FAILURES ABOVE')