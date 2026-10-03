/**
 * Edge-case positions from the Chess Programming Wiki perft results.
 * Kiwipete is position 2. Positions 3-6 follow, covering promotions, en passant and castling.
 */

import { describe, expect, it } from 'vitest'
import { parseFen, toFen } from './fen'
import { perft } from './perft'

const POSITIONS = [
  {
    name: 'Kiwipete',
    fen: 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
    nodes: [48, 2039, 97862, 4085603],
  },
  {
    name: 'position 3',
    fen: '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1',
    nodes: [14, 191, 2812, 43238, 674624, 11030083],
  },
  {
    name: 'position 4',
    fen: 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1',
    nodes: [6, 264, 9467, 422333, 15833292],
  },
  {
    name: 'position 5',
    fen: 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8',
    nodes: [44, 1486, 62379, 2103487],
  },
  {
    name: 'position 6',
    fen: 'r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10',
    nodes: [46, 2079, 89890, 3894594],
  },
]

describe('perft edge-case positions', () => {
  for (const position of POSITIONS) {
    it(`matches the known counts for ${position.name}`, { timeout: 120_000 }, () => {
      const current = parseFen(position.fen)
      for (let depth = 1; depth <= position.nodes.length; depth++) {
        expect(perft(current, depth), `depth ${depth}`).toBe(position.nodes[depth - 1])
      }
      expect(toFen(current)).toBe(position.fen)
    })
  }
})
