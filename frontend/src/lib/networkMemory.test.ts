import { afterEach, describe, expect, it } from 'vitest'
import {
  INSTANT_LOAD_MS,
  RECOVER_GOOD_SAMPLES,
  SLOW_LOAD_MS,
  STALL_LIMIT,
  autoQualityDecision,
  networkMemorySnapshot,
  recordLoadSample,
  resetNetworkMemory,
  sampleVerdict,
  type LoadSample,
} from './networkMemory'

/** A comfortable HQ load: buffered the runway well inside the time budget. */
function goodHQ(id: string): LoadSample {
  return { songId: id, quality: 'hq', timeToBufferMs: 600, stalls: 0 }
}

/** A comfortable LQ load — the measured evidence that there is HQ headroom. */
function goodLQ(id: string): LoadSample {
  return { songId: id, quality: 'lq', timeToBufferMs: 400, stalls: 0 }
}

function stalled(id: string, stalls: number): LoadSample {
  return { songId: id, quality: 'hq', timeToBufferMs: 600, stalls }
}

function slowBuffer(id: string): LoadSample {
  return { songId: id, quality: 'hq', timeToBufferMs: SLOW_LOAD_MS + 500, stalls: 0 }
}

afterEach(() => {
  resetNetworkMemory()
  delete (navigator as { connection?: unknown }).connection
})

describe('sampleVerdict', () => {
  it('calls a comfortably buffered, stall-free load good', () => {
    expect(sampleVerdict(goodHQ('a'))).toBe('good')
  })

  it('condemns a load that stalled at the stall limit', () => {
    expect(sampleVerdict(stalled('a', STALL_LIMIT))).toBe('weak')
  })

  it('tolerates a single stall', () => {
    expect(sampleVerdict(stalled('a', 1))).toBe('neutral')
  })

  it('condemns a very slow time-to-buffer', () => {
    expect(sampleVerdict(slowBuffer('a'))).toBe('weak')
  })

  it('condemns a load that never filled its buffer', () => {
    expect(sampleVerdict({ songId: 'a', quality: 'hq', timeToBufferMs: null, stalls: 0 })).toBe(
      'weak',
    )
  })

  it('treats a cache hit as evidence of nothing', () => {
    // A warm start says the bytes were already local, not that the network is fast.
    expect(
      sampleVerdict({ songId: 'a', quality: 'hq', timeToBufferMs: INSTANT_LOAD_MS - 50, stalls: 0 }),
    ).toBe('neutral')
  })

  it('demands more of an LQ load before calling it good (bigger headroom for HQ)', () => {
    expect(sampleVerdict({ songId: 'a', quality: 'lq', timeToBufferMs: 900, stalls: 0 })).toBe(
      'neutral',
    )
    expect(sampleVerdict({ songId: 'a', quality: 'lq', timeToBufferMs: 700, stalls: 0 })).toBe('good')
  })
})

describe('autoQualityDecision', () => {
  it('defaults to HQ when nothing has been measured and no API exists', () => {
    expect(autoQualityDecision()).toEqual({ quality: 'hq', reason: 'unknown-default-hq' })
  })

  it('downgrades the songs after one that stalled twice', () => {
    recordLoadSample(stalled('a', 2))
    const decision = autoQualityDecision()
    expect(decision.quality).toBe('lq')
    expect(decision.reason).toBe('weak-network:stalls:2')
  })

  it('downgrades after a load that took far too long to buffer', () => {
    recordLoadSample(slowBuffer('a'))
    expect(autoQualityDecision()).toEqual({
      quality: 'lq',
      reason: `weak-network:buffer:${SLOW_LOAD_MS + 500}ms`,
    })
  })

  it('stays on LQ while recovering, so the tier cannot flip-flop between songs', () => {
    recordLoadSample(stalled('a', 2))
    // Two comfortable loads are not enough: a network that just stopped being
    // bad would otherwise bounce back to HQ on the very next song.
    for (const id of ['b', 'c']) {
      recordLoadSample(goodHQ(id))
      expect(autoQualityDecision().quality).toBe('lq')
    }
    recordLoadSample(goodHQ('d'))
    expect(autoQualityDecision().quality).toBe('hq')
  })

  it('restarts the recovery count when a bad load interrupts it', () => {
    recordLoadSample(stalled('a', 2))
    recordLoadSample(goodHQ('b'))
    recordLoadSample(goodHQ('c'))
    recordLoadSample(stalled('d', 3))
    recordLoadSample(goodHQ('e'))
    recordLoadSample(goodHQ('f'))
    expect(autoQualityDecision().quality).toBe('lq')
    recordLoadSample(goodHQ('g'))
    expect(autoQualityDecision().quality).toBe('hq')
  })

  it('upgrades back on comfortably buffered LQ loads — they prove HQ headroom', () => {
    for (let i = 0; i < RECOVER_GOOD_SAMPLES; i += 1) {
      recordLoadSample(stalled(`stall${i}`, 2))
      for (let j = 0; j < RECOVER_GOOD_SAMPLES; j += 1) {
        recordLoadSample(goodLQ(`lq${i}-${j}`))
      }
    }
    expect(autoQualityDecision().quality).toBe('hq')
  })

  it('trusts a measured fast load over a navigator.connection slow hint', () => {
    // The whole point: a weak mobile signal reports "4g" while the 3g label
    // must not be able to override what actually played.
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { effectiveType: '3g', rtt: 900, downlink: 0.2, saveData: false },
    })
    recordLoadSample(goodHQ('a'))
    expect(autoQualityDecision()).toEqual({ quality: 'hq', reason: 'measured-fast:600ms' })
  })

  it('falls back to the navigator hint while nothing has been measured', () => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { effectiveType: '3g', rtt: 300, downlink: 0.7, saveData: false },
    })
    expect(autoQualityDecision()).toEqual({ quality: 'lq', reason: 'effectiveType:3g' })
  })

  it('keeps only the most recent samples in the rolling window', () => {
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) {
      recordLoadSample(goodHQ(id))
    }
    const snapshot = networkMemorySnapshot()
    expect(snapshot.sampleCount).toBe(5)
    expect(snapshot.timeToBufferMs).toBe(600)
  })

  it('recovers the fill rate for the debug report', () => {
    recordLoadSample({ songId: 'a', quality: 'hq', timeToBufferMs: 1000, stalls: 0 })
    // 5 s of runway buffered in 1 s of wall clock.
    expect(networkMemorySnapshot().fillRate).toBe(5)
  })
})
