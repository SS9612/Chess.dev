import { describe, expect, it } from 'vitest'
import { algebraicToSquare, squareToAlgebraic } from './board'
import { START_FEN, parseFen, toFen } from './fen'
import { generateLegalMoves } from './legal'
import { generateMoves } from './moves'
import type { Move } from './types'
import { isCastle, isEnPassant, isPromotion } from './types'

const sq = algebraicToSquare

function destinationsFrom(fen: string, from: string): string[] {
  return generateLegalMoves(parseFen(fen))
    .filter((move) => move.from === sq(from))
    .map((move) => squareToAlgebraic(move.to))
    .sort()
}

function castleDestinations(fen: string): string[] {
  return generateLegalMoves(parseFen(fen))
    .filter(isCastle)
    .map((move) => squareToAlgebraic(move.to))
    .sort()
}

function hasEnPassant(moves: Move[]): boolean {
  return moves.some(isEnPassant)
}

describe('legal moves', () => {
  it('matches the twenty legal moves of the starting position', () => {
    const current = parseFen(START_FEN)
    const before = toFen(current)
    expect(generateLegalMoves(current)).toHaveLength(20)
    expect(toFen(current)).toBe(before)
  })

  it('counts the forty-eight legal moves of the Kiwipete position', () => {
    const moves = generateLegalMoves(
      parseFen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1'),
    )
    expect(moves).toHaveLength(48)
  })

  it('keeps a pinned rook on the line and lets it capture the checker', () => {
    expect(destinationsFrom('4r2k/8/8/8/8/8/4R3/4K3 w - - 0 1', 'e2')).toEqual([
      'e3',
      'e4',
      'e5',
      'e6',
      'e7',
      'e8',
    ])
  })

  it('freezes a pinned knight', () => {
    expect(destinationsFrom('4r2k/8/8/8/8/8/4N3/4K3 w - - 0 1', 'e2')).toEqual([])
  })

  it('keeps a pinned bishop on the diagonal', () => {
    expect(destinationsFrom('k6q/8/8/8/8/8/1B6/K7 w - - 0 1', 'b2')).toEqual([
      'c3',
      'd4',
      'e5',
      'f6',
      'g7',
      'h8',
    ])
  })

  it('lets the king capture an adjacent checking queen and nothing else', () => {
    const moves = generateLegalMoves(parseFen('4k3/8/8/8/8/8/4q3/4K3 w - - 0 1'))
    expect(moves.map((move) => squareToAlgebraic(move.to))).toEqual(['e2'])
  })

  it('answers double check with king moves only', () => {
    const moves = generateLegalMoves(parseFen('4r2k/8/8/8/1b6/8/8/4K3 w - - 0 1'))
    expect(moves.map((move) => squareToAlgebraic(move.to)).sort()).toEqual(['d1', 'f1', 'f2'])
  })

  it('allows an interposition on the checking line', () => {
    expect(destinationsFrom('4r2k/8/8/8/8/8/8/3QK3 w - - 0 1', 'd1')).toContain('e2')
  })

  it('offers both castles when the king is safe and the path is safe', () => {
    expect(castleDestinations('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')).toEqual(['c1', 'g1'])
  })

  it('refuses to castle out of check', () => {
    expect(castleDestinations('r3k2r/8/4r3/8/8/8/8/R3K2R w KQkq - 0 1')).toEqual([])
  })

  it('refuses to castle across an attacked square', () => {
    expect(castleDestinations('r3k2r/8/5r2/8/8/8/8/R3K2R w KQkq - 0 1')).toEqual(['c1'])
    expect(castleDestinations('r3k2r/8/3r4/8/8/8/8/R3K2R w KQkq - 0 1')).toEqual(['g1'])
    expect(castleDestinations('r3k2r/8/8/8/8/4n3/8/R3K2R w KQkq - 0 1')).toEqual([])
    expect(castleDestinations('r3k2r/8/5R2/8/8/8/8/4K3 b kq - 0 1')).toEqual(['c8'])
  })

  it('refuses to castle onto an attacked square', () => {
    expect(castleDestinations('r3k2r/8/6r1/8/8/8/8/R3K2R w KQkq - 0 1')).toEqual(['c1'])
  })

  it('allows queenside castling when only b1 is attacked', () => {
    expect(castleDestinations('r3k2r/8/1r6/8/8/8/8/R3K2R w KQkq - 0 1')).toEqual(['c1', 'g1'])
  })

  it('allows an en passant capture that leaves the king safe', () => {
    const current = parseFen('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1')
    expect(hasEnPassant(generateLegalMoves(current))).toBe(true)
  })

  it('refuses an en passant capture that opens a line onto the king', () => {
    const current = parseFen('4k3/8/8/2KpP2r/8/8/8/8 w - d6 0 1')
    expect(hasEnPassant(generateMoves(current))).toBe(true)
    expect(hasEnPassant(generateLegalMoves(current))).toBe(false)
  })

  it('keeps all four promotions when the pawn is free to promote', () => {
    const promotions = generateLegalMoves(parseFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1')).filter(isPromotion)
    expect(promotions).toHaveLength(4)
    expect(promotions.map((move) => squareToAlgebraic(move.to))).toEqual(['a8', 'a8', 'a8', 'a8'])
  })
})
