import { describe, expect, it } from 'vitest'
import { clonePosition } from './board'
import { START_FEN, parseFen, toFen } from './fen'
import { makeMove, unmakeMove } from './makeMove'
import { generateMoves } from './moves'
import type { Move } from './types'
import { hashPosition } from './zobrist'

describe('zobrist keys', () => {
  it('hashes the same position to the same key on every parse', () => {
    const first = parseFen(START_FEN)
    const second = parseFen(START_FEN)
    expect(first.key).toBe(second.key)
    expect(first.key).toBe(hashPosition(first))
  })

  it('ignores the clocks', () => {
    const early = parseFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1')
    const late = parseFen('4k3/8/8/8/8/8/8/4K3 w - - 40 9')
    expect(early.key).toBe(late.key)
  })

  it('changes when the side to move, castling, en passant file or a piece changes', () => {
    const white = parseFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')
    const black = parseFen('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1')
    const fewerRights = parseFen('r3k2r/8/8/8/8/8/8/R3K2R w KQ - 0 1')
    const noRights = parseFen('r3k2r/8/8/8/8/8/8/R3K2R w - - 0 1')
    const withEp = parseFen('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2')
    const withoutEp = parseFen('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2')

    expect(white.key).not.toBe(black.key)
    expect(white.key).not.toBe(fewerRights.key)
    expect(fewerRights.key).not.toBe(noRights.key)
    expect(withEp.key).not.toBe(withoutEp.key)
    expect(parseFen(START_FEN).key).not.toBe(withEp.key)
  })

  it('tracks every generated move and its undo', () => {
    for (const fen of [
      START_FEN,
      'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
      'r3k2r/pP6/8/8/8/8/8/R3K2R w KQkq - 0 1',
      '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1',
    ]) {
      const current = parseFen(fen)
      const original = current.key
      for (const move of generateMoves(current)) {
        makeMove(current, move)
        expect(current.key).toBe(hashPosition(current))
        unmakeMove(current, move, {
          captured: move.captured,
          castling: parseFen(fen).castling,
          epSquare: parseFen(fen).epSquare,
          halfmoveClock: parseFen(fen).halfmoveClock,
          fullmoveNumber: parseFen(fen).fullmoveNumber,
        })
      }
      expect(current.key).toBe(original)
      expect(toFen(current)).toBe(fen)
    }
  })

  it('matches a from-scratch hash through a long game and back', () => {
    for (const [fen, seed] of [
      [START_FEN, 1],
      ['r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1', 2],
      ['rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3', 3],
      ['r3k2r/pP6/8/8/8/8/8/R3K2R w KQkq - 0 1', 4],
    ] as const) {
      const current = parseFen(fen)
      const original = clonePosition(current)
      const stack: { move: Move; undo: ReturnType<typeof makeMove> }[] = []
      const random = lcg(seed)

      for (let ply = 0; ply < 80; ply++) {
        const moves = generateMoves(current)
        if (moves.length === 0) break
        const move = moves[Math.floor(random() * moves.length)]
        stack.push({ move, undo: makeMove(current, move) })
        expect(current.key).toBe(hashPosition(current))
      }

      expect(stack.length).toBeGreaterThan(30)

      while (stack.length > 0) {
        const entry = stack.pop()
        if (entry === undefined) break
        unmakeMove(current, entry.move, entry.undo)
        expect(current.key).toBe(hashPosition(current))
      }

      expect(current.key).toBe(original.key)
    }
  })
})

function lcg(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 4294967296
  }
}
