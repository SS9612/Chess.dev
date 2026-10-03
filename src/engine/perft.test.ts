import { describe, expect, it } from 'vitest'
import { parseFen, toFen } from './fen'
import { generateLegalMoves } from './legal'
import { formatPerftDivide, perft, perftDivide } from './perft'

const KINGS = '4k3/8/8/8/8/8/8/4K3 w - - 0 1'
const STALEMATE = '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'

describe('perft', () => {
  it('counts the position itself at depth 0', () => {
    expect(perft(parseFen(KINGS), 0)).toBe(1)
  })

  it('counts legal moves at depth 1', () => {
    const current = parseFen(KINGS)
    expect(perft(current, 1)).toBe(generateLegalMoves(current).length)
    expect(perft(current, 1)).toBe(5)
  })

  it('counts every reply at depth 2', () => {
    const current = parseFen(KINGS)
    const before = toFen(current)
    expect(perft(current, 2)).toBe(25)
    expect(toFen(current)).toBe(before)
  })

  it('counts a position with no legal moves as zero', () => {
    const current = parseFen(STALEMATE)
    expect(perft(current, 1)).toBe(0)
    expect(perft(current, 2)).toBe(0)
  })
})

describe('perftDivide', () => {
  it('gives each root move its own leaf at depth 1', () => {
    const current = parseFen(KINGS)
    const entries = perftDivide(current, 1)
    expect(entries.map((entry) => entry.move)).toEqual(['e1d1', 'e1d2', 'e1e2', 'e1f1', 'e1f2'])
    expect(entries.every((entry) => entry.nodes === 1)).toBe(true)
    expect(sum(entries)).toBe(perft(current, 1))
  })

  it('splits a depth-2 count across the root moves', () => {
    const current = parseFen(KINGS)
    const before = toFen(current)
    const entries = perftDivide(current, 2)
    expect(entries).toEqual([
      { move: 'e1d1', nodes: 5 },
      { move: 'e1d2', nodes: 5 },
      { move: 'e1e2', nodes: 5 },
      { move: 'e1f1', nodes: 5 },
      { move: 'e1f2', nodes: 5 },
    ])
    expect(sum(entries)).toBe(perft(current, 2))
    expect(toFen(current)).toBe(before)
    expect(formatPerftDivide(entries)).toBe(
      ['e1d1: 5', 'e1d2: 5', 'e1e2: 5', 'e1f1: 5', 'e1f2: 5', 'nodes: 25'].join('\n'),
    )
  })

  it('names promotions in the move text', () => {
    const entries = perftDivide(parseFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1'), 1)
    const promotions = entries.filter((entry) => entry.move.startsWith('a7a8')).map((entry) => entry.move)
    expect(promotions).toEqual(['a7a8b', 'a7a8n', 'a7a8q', 'a7a8r'])
  })

  it('adds up to the same total on a position with castling', () => {
    const current = parseFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')
    const before = toFen(current)
    const entries = perftDivide(current, 2)
    expect(sum(entries)).toBe(perft(current, 2))
    expect(entries.some((entry) => entry.move === 'e1g1')).toBe(true)
    expect(entries.some((entry) => entry.move === 'e1c1')).toBe(true)
    expect(toFen(current)).toBe(before)
  })

  it('returns no rows at depth 0', () => {
    expect(perftDivide(parseFen(KINGS), 0)).toEqual([])
  })
})

function sum(entries: { nodes: number }[]): number {
  return entries.reduce((total, entry) => total + entry.nodes, 0)
}
