/**
 * Known node counts for the starting position.
 *
 * Depth 6 visits about 119 million nodes, so it runs only when PERFT_DEPTH_6=1.
 */

import { describe, expect, it } from 'vitest'
import { START_FEN, parseFen, toFen } from './fen'
import { perft } from './perft'

const START_NODES = [20, 400, 8902, 197281, 4865609]

describe('perft starting position', () => {
  it('matches the known counts through depth 5', { timeout: 60_000 }, () => {
    const position = parseFen(START_FEN)
    for (let depth = 1; depth <= START_NODES.length; depth++) {
      expect(perft(position, depth), `depth ${depth}`).toBe(START_NODES[depth - 1])
    }
    expect(toFen(position)).toBe(START_FEN)
  })

  it.skipIf(process.env.PERFT_DEPTH_6 !== '1')(
    'matches the known count at depth 6',
    { timeout: 600_000 },
    () => {
      expect(perft(parseFen(START_FEN), 6)).toBe(119060324)
    },
  )
})
