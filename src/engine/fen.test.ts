import { describe, expect, it } from 'vitest'
import {
  CASTLE_ALL,
  CASTLE_BQ,
  CASTLE_WK,
  NO_SQUARE,
  algebraicToSquare,
  createStartingBoard,
  eachSquare,
} from './board'
import { START_FEN, parseFen, toFen } from './fen'
import { BLACK, EMPTY, KING, PAWN, QUEEN, WHITE, makePiece } from './types'

/** Positions used throughout the perft suite later, plus a few edge cases. */
const FENS = [
  START_FEN,
  'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
  '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1',
  'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1',
  'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8',
  'r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10',
  '8/8/8/8/8/8/8/8 w - - 0 1',
  '4k3/8/8/8/8/8/8/4K3 b - - 99 175',
  'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2',
]

describe('parseFen', () => {
  it('parses the starting position into the same board built by hand', () => {
    const position = parseFen(START_FEN)
    expect([...position.board]).toEqual([...createStartingBoard()])
  })

  it('parses the non-placement fields of the starting position', () => {
    const position = parseFen(START_FEN)
    expect(position.turn).toBe(WHITE)
    expect(position.castling).toBe(CASTLE_ALL)
    expect(position.epSquare).toBe(NO_SQUARE)
    expect(position.halfmoveClock).toBe(0)
    expect(position.fullmoveNumber).toBe(1)
  })

  it('reads placement from rank 8 downwards', () => {
    const position = parseFen('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1')
    expect(position.board[algebraicToSquare('e8')]).toBe(makePiece(BLACK, KING))
    expect(position.board[algebraicToSquare('e2')]).toBe(makePiece(WHITE, PAWN))
    expect(position.board[algebraicToSquare('e1')]).toBe(makePiece(WHITE, KING))
  })

  it('parses side to move, clocks and partial castling rights', () => {
    const position = parseFen('4k3/8/8/8/8/8/8/4K3 b Kq - 13 42')
    expect(position.turn).toBe(BLACK)
    expect(position.castling).toBe(CASTLE_WK | CASTLE_BQ)
    expect(position.halfmoveClock).toBe(13)
    expect(position.fullmoveNumber).toBe(42)
  })

  it('parses an en passant target square', () => {
    const position = parseFen('rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2')
    expect(position.epSquare).toBe(algebraicToSquare('d6'))
  })

  it('defaults the clocks when they are omitted', () => {
    const position = parseFen('4k3/8/8/8/8/8/8/4K3 w KQkq -')
    expect(position.halfmoveClock).toBe(0)
    expect(position.fullmoveNumber).toBe(1)
  })

  it('parses an empty board', () => {
    const position = parseFen('8/8/8/8/8/8/8/8 w - - 0 1')
    expect([...eachSquare()].every((sq) => position.board[sq] === EMPTY)).toBe(true)
    expect(position.castling).toBe(0)
  })

  it('handles a rank that mixes gaps and pieces', () => {
    const position = parseFen('8/8/8/8/8/8/8/Q6q w - - 0 1')
    expect(position.board[algebraicToSquare('a1')]).toBe(makePiece(WHITE, QUEEN))
    expect(position.board[algebraicToSquare('h1')]).toBe(makePiece(BLACK, QUEEN))
  })

  describe('rejects malformed input', () => {
    it('with too few fields', () => {
      expect(() => parseFen('8/8/8/8/8/8/8/8 w -')).toThrow(/at least 4 fields/)
    })

    it('with the wrong number of ranks', () => {
      expect(() => parseFen('8/8/8/8/8/8/8 w - - 0 1')).toThrow(/8 ranks/)
    })

    it('with a rank that is too short', () => {
      expect(() => parseFen('8/8/8/8/8/8/8/7 w - - 0 1')).toThrow(/expected 8/)
    })

    it('with a rank that overflows', () => {
      expect(() => parseFen('8/8/8/8/8/8/8/QQQQQQQQQ w - - 0 1')).toThrow(/overflows/)
    })

    it('with an unknown piece letter', () => {
      expect(() => parseFen('8/8/8/8/8/8/8/XXXXXXXX w - - 0 1')).toThrow(/piece character/)
    })

    it('with an invalid side to move', () => {
      expect(() => parseFen('8/8/8/8/8/8/8/8 x - - 0 1')).toThrow(/side to move/)
    })

    it('with an invalid castling character', () => {
      expect(() => parseFen('8/8/8/8/8/8/8/8 w KQxq - 0 1')).toThrow(/castling/)
    })

    it('with an en passant square on the wrong rank', () => {
      expect(() => parseFen('8/8/8/8/8/8/8/8 w - e4 0 1')).toThrow(/rank 3 or 6/)
    })

    it('with a negative halfmove clock', () => {
      expect(() => parseFen('8/8/8/8/8/8/8/8 w - - -1 1')).toThrow(/halfmove clock/)
    })
  })
})

describe('toFen', () => {
  it('serializes the starting position', () => {
    expect(toFen(parseFen(START_FEN))).toBe(START_FEN)
  })

  it('writes a dash when there are no castling rights', () => {
    expect(toFen(parseFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1'))).toContain(' w - - ')
  })

  it('orders castling rights as KQkq regardless of input order', () => {
    expect(toFen(parseFen('4k3/8/8/8/8/8/8/4K3 w qkQK - 0 1'))).toContain(' KQkq ')
  })

  it('fills in the clocks that were omitted on input', () => {
    expect(toFen(parseFen('4k3/8/8/8/8/8/8/4K3 w - -'))).toBe('4k3/8/8/8/8/8/8/4K3 w - - 0 1')
  })
})

describe('FEN round-trip', () => {
  it.each(FENS)('survives parse then serialize: %s', (fen) => {
    expect(toFen(parseFen(fen))).toBe(fen)
  })
})
