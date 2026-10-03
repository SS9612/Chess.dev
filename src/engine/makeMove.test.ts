import { describe, expect, it } from 'vitest'
import { algebraicToSquare, clonePosition, type Position } from './board'
import { START_FEN, parseFen, toFen } from './fen'
import { makeMove, unmakeMove, type Undo } from './makeMove'
import { generateMoves, generateMovesFrom } from './moves'
import { KNIGHT, QUEEN, type Move, type PieceType } from './types'

function position(fen: string): Position {
  return parseFen(fen)
}

function findMove(current: Position, from: string, to: string, promotion: PieceType | 0 = 0): Move {
  const move = generateMovesFrom(current, algebraicToSquare(from)).find(
    (candidate) => candidate.to === algebraicToSquare(to) && candidate.promotion === promotion,
  )
  if (move === undefined) {
    throw new Error(`No move ${from}${to} in ${toFen(current)}`)
  }
  return move
}

function play(current: Position, from: string, to: string, promotion: PieceType | 0 = 0): { move: Move; undo: Undo } {
  const move = findMove(current, from, to, promotion)
  return { move, undo: makeMove(current, move) }
}

function expectSame(actual: Position, expected: Position): void {
  expect(actual.turn).toBe(expected.turn)
  expect(actual.castling).toBe(expected.castling)
  expect(actual.epSquare).toBe(expected.epSquare)
  expect(actual.halfmoveClock).toBe(expected.halfmoveClock)
  expect(actual.fullmoveNumber).toBe(expected.fullmoveNumber)
  expect(actual.key).toBe(expected.key)
  expect(Array.from(actual.board)).toEqual(Array.from(expected.board))
}

function roundTrip(fen: string, from: string, to: string, after: string, promotion: PieceType | 0 = 0): void {
  const current = position(fen)
  const original = clonePosition(current)
  const { move, undo } = play(current, from, to, promotion)
  expect(toFen(current)).toBe(after)
  unmakeMove(current, move, undo)
  expectSame(current, original)
}

describe('make and unmake', () => {
  it('double-pushes a pawn and records the square it passed over', () => {
    const current = position(START_FEN)
    const { undo } = play(current, 'e2', 'e4')
    expect(toFen(current)).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1')
    expect(undo.captured).toBe(0)
    expect(undo.halfmoveClock).toBe(0)
    expect(undo.epSquare).toBe(-1)
  })

  it('clears the en passant square on the following quiet move', () => {
    roundTrip(
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
      'g1',
      'f3',
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
    )
  })

  it('increments the fullmove number after black moves', () => {
    const current = position(START_FEN)
    const original = clonePosition(current)
    const first = play(current, 'e2', 'e4')
    const second = play(current, 'e7', 'e5')
    expect(toFen(current)).toBe('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2')
    unmakeMove(current, second.move, second.undo)
    expect(toFen(current)).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1')
    unmakeMove(current, first.move, first.undo)
    expectSame(current, original)
  })

  it('removes a captured piece and resets the halfmove clock', () => {
    roundTrip(
      'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      'e4',
      'd5',
      'rnbqkbnr/ppp1pppp/8/3P4/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2',
    )
  })

  it('takes en passant and puts the pawn back on unmake', () => {
    const current = position('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1')
    const original = clonePosition(current)
    const { move, undo } = play(current, 'e5', 'd6')
    expect(toFen(current)).toBe('4k3/8/3P4/8/8/8/8/4K3 b - - 0 1')
    expect(undo.captured).not.toBe(0)
    unmakeMove(current, move, undo)
    expectSame(current, original)
  })

  it('promotes and restores the pawn', () => {
    roundTrip('4k3/P7/8/8/8/8/8/4K3 w - - 0 1', 'a7', 'a8', 'Q3k3/8/8/8/8/8/8/4K3 b - - 0 1', QUEEN)
    roundTrip('4k3/P7/8/8/8/8/8/4K3 w - - 0 1', 'a7', 'a8', 'N3k3/8/8/8/8/8/8/4K3 b - - 0 1', KNIGHT)
    roundTrip('4k3/8/8/8/8/8/p7/4K3 b - - 0 1', 'a2', 'a1', '4k3/8/8/8/8/8/8/q3K3 w - - 0 2', QUEEN)
  })

  it('promotes onto a captured piece', () => {
    roundTrip('r3k3/1P6/8/8/8/8/8/4K3 w - - 0 1', 'b7', 'a8', 'Q3k3/8/8/8/8/8/8/4K3 b - - 0 1', QUEEN)
  })

  it('castles on both wings for both colours', () => {
    const open = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'
    roundTrip(open, 'e1', 'g1', 'r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1')
    roundTrip(open, 'e1', 'c1', 'r3k2r/8/8/8/8/8/8/2KR3R b kq - 1 1')
    roundTrip('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1', 'e8', 'g8', 'r4rk1/8/8/8/8/8/8/R3K2R w KQ - 1 2')
    roundTrip('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1', 'e8', 'c8', '2kr3r/8/8/8/8/8/8/R3K2R w KQ - 1 2')
  })

  it('drops castling rights when the king moves, a rook moves, or a rook is captured', () => {
    const open = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'
    roundTrip(open, 'e1', 'e2', 'r3k2r/8/8/8/8/8/4K3/R6R b kq - 1 1')
    roundTrip(open, 'a1', 'a2', 'r3k2r/8/8/8/8/8/R7/4K2R b Kkq - 1 1')
    roundTrip(open, 'a1', 'a8', 'R3k2r/8/8/8/8/8/8/4K2R b Kk - 0 1')
  })

  it('returns every pseudo-legal move to the same position', () => {
    for (const fen of [
      START_FEN,
      'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
      'r3k2r/pP6/8/8/8/8/8/R3K2R w KQkq - 0 1',
      '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1',
    ]) {
      const current = position(fen)
      const original = clonePosition(current)
      for (const move of generateMoves(current)) {
        const undo = makeMove(current, move)
        unmakeMove(current, move, undo)
        expectSame(current, original)
      }
    }
  })

  it('rewinds a long random game to the identical board', () => {
    for (const [fen, seed] of [
      [START_FEN, 1],
      ['r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1', 2],
      ['rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3', 3],
      ['r3k2r/pP6/8/8/8/8/8/R3K2R w KQkq - 0 1', 4],
    ] as const) {
      const current = position(fen)
      const original = clonePosition(current)
      const seen = [toFen(current)]
      const stack: { move: Move; undo: Undo }[] = []
      const random = lcg(seed)

      for (let ply = 0; ply < 80; ply++) {
        const moves = generateMoves(current)
        if (moves.length === 0) break
        const move = moves[Math.floor(random() * moves.length)]
        stack.push({ move, undo: makeMove(current, move) })
        seen.push(toFen(current))
      }

      expect(stack.length).toBeGreaterThan(30)

      while (stack.length > 0) {
        const entry = stack.pop()
        if (entry === undefined) break
        unmakeMove(current, entry.move, entry.undo)
        seen.pop()
        expect(toFen(current)).toBe(seen[seen.length - 1])
      }

      expectSame(current, original)
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
