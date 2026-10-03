import { describe, expect, it } from 'vitest'
import { algebraicToSquare, squareToAlgebraic } from './board'
import { START_FEN, parseFen } from './fen'
import { generateMoves, generateMovesFrom } from './moves'
import type { Move } from './types'
import { BISHOP, BLACK, EMPTY, KING, KNIGHT, MOVE_CASTLE_KING, MOVE_CASTLE_QUEEN, MOVE_DOUBLE_PUSH, PAWN, QUEEN, ROOK, WHITE, isCapture, isCastle, isEnPassant, isPromotion, makePiece } from './types'

const sq = algebraicToSquare

function position(fen: string) {
  return parseFen(fen)
}

function destinations(moves: Move[]): string[] {
  return moves.map((move) => squareToAlgebraic(move.to)).sort()
}

describe('knight moves', () => {
  it('has eight moves from the centre of an empty board', () => {
    const moves = generateMovesFrom(position('8/8/8/8/4N3/8/8/4K3 w - - 0 1'), sq('e4'))
    expect(destinations(moves)).toEqual(['c3', 'c5', 'd2', 'd6', 'f2', 'f6', 'g3', 'g5'])
    expect(moves.every((move) => move.piece === makePiece(WHITE, KNIGHT))).toBe(true)
    expect(moves.every((move) => move.captured === EMPTY && move.promotion === 0)).toBe(true)
  })

  it('has two moves from a1 and two from h8', () => {
    expect(destinations(generateMovesFrom(position('8/8/8/8/8/8/8/N3K3 w - - 0 1'), sq('a1')))).toEqual([
      'b3',
      'c2',
    ])
    expect(destinations(generateMovesFrom(position('4k2N/8/8/8/8/8/8/8 w - - 0 1'), sq('h8')))).toEqual([
      'f7',
      'g6',
    ])
  })

  it('has four moves from the a-file', () => {
    expect(destinations(generateMovesFrom(position('8/8/8/8/N7/8/8/4K3 w - - 0 1'), sq('a4')))).toEqual([
      'b2',
      'b6',
      'c3',
      'c5',
    ])
  })

  it('does not land on its own pieces and does capture enemies', () => {
    const moves = generateMovesFrom(position('8/8/3p4/8/4N3/8/5P2/4K3 w - - 0 1'), sq('e4'))
    const capture = moves.find((move) => move.to === sq('d6'))
    expect(capture).toBeDefined()
    expect(isCapture(capture!)).toBe(true)
    expect(capture!.captured).toBe(makePiece(BLACK, PAWN))
    expect(destinations(moves)).not.toContain('f2')
    expect(destinations(moves)).toHaveLength(7)
  })

  it('ignores a knight of the side that is not to move', () => {
    expect(generateMovesFrom(position('8/8/8/8/4n3/8/8/4K3 w - - 0 1'), sq('e4'))).toEqual([])
  })
})

describe('king moves', () => {
  it('has eight moves from the centre', () => {
    expect(destinations(generateMovesFrom(position('8/8/8/8/4K3/8/8/8 w - - 0 1'), sq('e4')))).toEqual([
      'd3',
      'd4',
      'd5',
      'e3',
      'e5',
      'f3',
      'f4',
      'f5',
    ])
  })

  it('has three moves from a corner', () => {
    expect(destinations(generateMovesFrom(position('8/8/8/8/8/8/8/K7 w - - 0 1'), sq('a1')))).toEqual([
      'a2',
      'b1',
      'b2',
    ])
    expect(destinations(generateMovesFrom(position('k7/8/8/8/8/8/8/8 b - - 0 1'), sq('a8')))).toEqual([
      'a7',
      'b7',
      'b8',
    ])
  })

  it('captures an adjacent enemy and refuses its own piece', () => {
    const moves = generateMovesFrom(position('8/8/8/8/4K3/4p3/8/8 w - - 0 1'), sq('e4'))
    const capture = moves.find((move) => move.to === sq('e3'))
    expect(isCapture(capture!)).toBe(true)
    expect(capture!.captured).toBe(makePiece(BLACK, PAWN))
    expect(destinations(moves)).toHaveLength(8)
  })

  it('does not castle out of the starting position', () => {
    const moves = generateMovesFrom(position(START_FEN), sq('e1'))
    expect(moves).toEqual([])
  })
})

describe('castling', () => {
  const open = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'

  it('offers both wings when the rights are set and the path is empty', () => {
    const moves = generateMovesFrom(position(open), sq('e1'))
    expect(destinations(moves.filter(isCastle))).toEqual(['c1', 'g1'])
    expect(moves.find((move) => move.to === sq('g1'))?.flags).toBe(MOVE_CASTLE_KING)
    expect(moves.find((move) => move.to === sq('c1'))?.flags).toBe(MOVE_CASTLE_QUEEN)
  })

  it('offers both wings to black', () => {
    const moves = generateMovesFrom(position('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1'), sq('e8'))
    expect(destinations(moves.filter(isCastle))).toEqual(['c8', 'g8'])
  })

  it('follows the rights, not merely the empty squares', () => {
    const moves = generateMovesFrom(position('r3k2r/8/8/8/8/8/8/R3K2R w K - 0 1'), sq('e1'))
    expect(destinations(moves.filter(isCastle))).toEqual(['g1'])
  })

  it('refuses a wing when a square in between is occupied', () => {
    const moves = generateMovesFrom(position('r3k2r/8/8/8/8/8/8/R3K1NR w KQkq - 0 1'), sq('e1'))
    expect(destinations(moves.filter(isCastle))).toEqual(['c1'])
  })

  it('refuses to castle when the rook is missing', () => {
    const moves = generateMovesFrom(position('4k3/8/8/8/8/8/8/4K2R w Q - 0 1'), sq('e1'))
    expect(moves.filter(isCastle)).toEqual([])
  })
})

describe('sliding moves', () => {
  it('slides a rook along rank and file until the edge', () => {
    expect(destinations(generateMovesFrom(position('4k3/8/8/8/3R4/8/8/4K3 w - - 0 1'), sq('d4')))).toEqual([
      'a4',
      'b4',
      'c4',
      'd1',
      'd2',
      'd3',
      'd5',
      'd6',
      'd7',
      'd8',
      'e4',
      'f4',
      'g4',
      'h4',
    ])
  })

  it('does not wrap a rook onto the next rank', () => {
    const moves = generateMovesFrom(position('4k3/8/8/8/7R/8/8/4K3 w - - 0 1'), sq('h4'))
    expect(destinations(moves)).not.toContain('a5')
    expect(destinations(moves)).toContain('a4')
    expect(destinations(moves)).toHaveLength(14)
  })

  it('stops a rook at its own piece and includes an enemy as a capture', () => {
    const moves = generateMovesFrom(position('4k3/8/8/8/p7/8/8/R7 w - - 0 1'), sq('a1'))
    const capture = moves.find((move) => move.to === sq('a4'))
    expect(isCapture(capture!)).toBe(true)
    expect(capture!.captured).toBe(makePiece(BLACK, PAWN))
    expect(destinations(moves)).toEqual(['a2', 'a3', 'a4', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'])
  })

  it('slides a bishop on diagonals only', () => {
    expect(destinations(generateMovesFrom(position('4k3/8/8/8/3B4/8/8/4K3 w - - 0 1'), sq('d4')))).toEqual([
      'a1',
      'a7',
      'b2',
      'b6',
      'c3',
      'c5',
      'e3',
      'e5',
      'f2',
      'f6',
      'g1',
      'g7',
      'h8',
    ])
  })

  it('stops a bishop before its own piece and captures the first enemy', () => {
    const moves = generateMovesFrom(position('4k3/8/8/4P3/3B4/2p5/8/4K3 w - - 0 1'), sq('d4'))
    expect(destinations(moves)).toEqual(['a7', 'b6', 'c3', 'c5', 'e3', 'f2', 'g1'])
    expect(isCapture(moves.find((move) => move.to === sq('c3'))!)).toBe(true)
    expect(destinations(moves)).not.toContain('e5')
  })

  it('gives a queen the rook rays and the bishop rays', () => {
    const moves = generateMovesFrom(position('4k3/8/8/8/3Q4/8/8/4K3 w - - 0 1'), sq('d4'))
    expect(destinations(moves)).toHaveLength(27)
    expect(destinations(moves)).toEqual(expect.arrayContaining(['d8', 'h4', 'a1', 'h8']))
  })
})

describe('pawn moves', () => {
  it('pushes one square, or two from the starting rank', () => {
    const moves = generateMovesFrom(position('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1'), sq('e2'))
    expect(destinations(moves)).toEqual(['e3', 'e4'])
    expect(moves.find((move) => move.to === sq('e4'))?.flags).toBe(MOVE_DOUBLE_PUSH)
    expect(moves.find((move) => move.to === sq('e3'))?.flags).toBe(0)
  })

  it('does not push through a piece or capture straight ahead', () => {
    expect(generateMovesFrom(position('4k3/8/8/8/8/4p3/4P3/4K3 w - - 0 1'), sq('e2'))).toEqual([])
    expect(destinations(generateMovesFrom(position('4k3/8/8/8/4p3/8/4P3/4K3 w - - 0 1'), sq('e2')))).toEqual([
      'e3',
    ])
  })

  it('captures diagonally and does not wrap off the a-file', () => {
    const moves = generateMovesFrom(position('4k3/8/8/8/8/1p6/P7/4K3 w - - 0 1'), sq('a2'))
    expect(destinations(moves)).toEqual(['a3', 'a4', 'b3'])
    const capture = moves.find((move) => move.to === sq('b3'))
    expect(isCapture(capture!)).toBe(true)
    expect(capture!.captured).toBe(makePiece(BLACK, PAWN))
  })

  it('pushes and double-pushes a black pawn toward white', () => {
    const moves = generateMovesFrom(position('4k3/7p/8/8/8/8/8/4K3 b - - 0 1'), sq('h7'))
    expect(destinations(moves)).toEqual(['h5', 'h6'])
    expect(moves.find((move) => move.to === sq('h5'))?.flags).toBe(MOVE_DOUBLE_PUSH)
  })

  it('promotes a pawn into each of the four pieces', () => {
    const moves = generateMovesFrom(position('k7/4P3/8/8/8/8/8/4K3 w - - 0 1'), sq('e7'))
    expect(moves.map((move) => move.to)).toEqual([sq('e8'), sq('e8'), sq('e8'), sq('e8')])
    expect(moves.map((move) => move.promotion)).toEqual([QUEEN, ROOK, BISHOP, KNIGHT])
    expect(moves.every((move) => isPromotion(move) && !isCapture(move))).toBe(true)
  })

  it('promotes a capturing pawn as well', () => {
    const moves = generateMovesFrom(position('k2r4/4P3/8/8/8/8/8/4K3 w - - 0 1'), sq('e7'))
    const captures = moves.filter((move) => move.to === sq('d8'))
    expect(captures).toHaveLength(4)
    expect(captures.every((move) => isPromotion(move) && isCapture(move))).toBe(true)
    expect(captures[0].captured).toBe(makePiece(BLACK, ROOK))
  })

  it('captures en passant onto the target square', () => {
    const moves = generateMovesFrom(position('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1'), sq('e5'))
    const ep = moves.find((move) => move.to === sq('d6'))
    expect(ep).toBeDefined()
    expect(isEnPassant(ep!)).toBe(true)
    expect(isCapture(ep!)).toBe(true)
    expect(ep!.captured).toBe(makePiece(BLACK, PAWN))
    expect(ep!.promotion).toBe(0)
    expect(destinations(moves)).toEqual(['d6', 'e6'])
  })

  it('does not capture en passant without an en passant square', () => {
    const moves = generateMovesFrom(position('4k3/8/8/3pP3/8/8/8/4K3 w - - 0 1'), sq('e5'))
    expect(destinations(moves)).toEqual(['e6'])
  })

  it('lets a black pawn capture en passant', () => {
    const moves = generateMovesFrom(position('4k3/8/8/8/2Pp4/8/8/4K3 b - c3 0 1'), sq('d4'))
    const ep = moves.find((move) => move.to === sq('c3'))
    expect(isEnPassant(ep!)).toBe(true)
    expect(ep!.captured).toBe(makePiece(WHITE, PAWN))
  })

  it('does not capture a friendly piece', () => {
    const moves = generateMovesFrom(position('4k3/8/8/3P4/4P3/8/8/4K3 w - - 0 1'), sq('e4'))
    expect(destinations(moves)).toEqual(['e5'])
  })
})

describe('generateMoves', () => {
  it('lists the twenty moves from the starting position', () => {
    const moves = generateMoves(position(START_FEN))
    expect(moves).toHaveLength(20)
    const doubles = moves.filter((move) => move.flags === MOVE_DOUBLE_PUSH)
    expect(doubles).toHaveLength(8)
  })

  it('moves a black knight when it is black to move', () => {
    const moves = generateMoves(position('4k3/8/8/8/4n3/8/8/4K3 b - - 0 1'))
    expect(destinations(moves.filter((move) => move.piece === makePiece(BLACK, KNIGHT)))).toEqual([
      'c3',
      'c5',
      'd2',
      'd6',
      'f2',
      'f6',
      'g3',
      'g5',
    ])
    expect(moves.some((move) => move.piece === makePiece(BLACK, KING))).toBe(true)
  })
})
