import { describe, expect, it } from 'vitest'
import { rankSans, scoreSan } from './rankMoves'

describe('rankMoves', () => {
  it('puts mate and check ahead of quiet moves', () => {
    expect(scoreSan('Qxh7#')).toBeGreaterThan(scoreSan('Qxh7+'))
    expect(scoreSan('Qh5+')).toBeGreaterThan(scoreSan('Qh5'))
    expect(scoreSan('Nxe5')).toBeGreaterThan(scoreSan('Nf3'))
  })

  it('orders opening moves with central play first', () => {
    const ranked = rankSans(['a3', 'h3', 'Nf3', 'e4', 'Na3', 'd4'])
    expect(ranked.slice(0, 3)).toEqual(expect.arrayContaining(['e4', 'd4', 'Nf3']))
    expect(ranked.indexOf('e4')).toBeLessThan(ranked.indexOf('a3'))
    expect(ranked.slice(-2)).toEqual(expect.arrayContaining(['a3', 'h3']))
  })
})
