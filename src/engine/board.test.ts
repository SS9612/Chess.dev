import { describe, expect, it } from 'vitest'
import {
  A1,
  A8,
  H1,
  H8,
  algebraicToSquare,
  charToPiece,
  createEmptyBoard,
  createStartingBoard,
  dumpBoard,
  eachSquare,
  fileOf,
  findKing,
  isLightSquare,
  isOnBoard,
  pieceToChar,
  rankOf,
  squareOf,
  squareToAlgebraic,
} from './board'
import type { Color, PieceType } from './types'
import {
  BISHOP,
  BLACK,
  EMPTY,
  KING,
  KNIGHT,
  PAWN,
  QUEEN,
  ROOK,
  WHITE,
  isColor,
  makePiece,
  opposite,
  pieceColor,
  pieceType,
} from './types'

describe('0x88 indexing', () => {
  it('places the corners where the layout says they should be', () => {
    expect(A1).toBe(0)
    expect(H1).toBe(7)
    expect(A8).toBe(112)
    expect(H8).toBe(119)
  })

  it('treats exactly 64 of the 128 indices as real squares', () => {
    const onBoard = Array.from({ length: 128 }, (_, i) => i).filter(isOnBoard)
    expect(onBoard).toHaveLength(64)
  })

  it('rejects the padding half of each rank', () => {
    for (let rank = 0; rank < 8; rank++) {
      for (let pad = 8; pad < 16; pad++) {
        expect(isOnBoard(rank * 16 + pad)).toBe(false)
      }
    }
  })

  it('round-trips file and rank through squareOf', () => {
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = squareOf(file, rank)
        expect(fileOf(square)).toBe(file)
        expect(rankOf(square)).toBe(rank)
      }
    }
  })

  it('does not wrap when a rank is walked off its right edge', () => {
    // One step east of h4 must land in padding, not on a5.
    expect(isOnBoard(algebraicToSquare('h4') + 1)).toBe(false)
  })

  it('knows a1 is dark and h1 is light', () => {
    expect(isLightSquare(A1)).toBe(false)
    expect(isLightSquare(H1)).toBe(true)
    expect(isLightSquare(A8)).toBe(true)
    expect(isLightSquare(H8)).toBe(false)
  })

  it('yields all 64 squares from a1 to h8', () => {
    const squares = [...eachSquare()]
    expect(squares).toHaveLength(64)
    expect(squares[0]).toBe(A1)
    expect(squares[63]).toBe(H8)
    expect(squares.every(isOnBoard)).toBe(true)
  })
})

describe('algebraic notation', () => {
  it('round-trips every square', () => {
    for (const square of eachSquare()) {
      expect(algebraicToSquare(squareToAlgebraic(square))).toBe(square)
    }
  })

  it('maps known squares', () => {
    expect(squareToAlgebraic(A1)).toBe('a1')
    expect(squareToAlgebraic(H8)).toBe('h8')
    expect(algebraicToSquare('e4')).toBe(squareOf(4, 3))
    expect(algebraicToSquare('d5')).toBe(squareOf(3, 4))
  })

  it('rejects malformed names', () => {
    expect(() => algebraicToSquare('i1')).toThrow()
    expect(() => algebraicToSquare('a9')).toThrow()
    expect(() => algebraicToSquare('e')).toThrow()
    expect(() => algebraicToSquare('')).toThrow()
  })

  it('rejects off-board indices', () => {
    expect(() => squareToAlgebraic(8)).toThrow()
  })
})

describe('piece encoding', () => {
  const types: PieceType[] = [PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING]
  const colors: Color[] = [WHITE, BLACK]

  it('round-trips colour and type', () => {
    for (const color of colors) {
      for (const type of types) {
        const piece = makePiece(color, type)
        expect(pieceType(piece)).toBe(type)
        expect(pieceColor(piece)).toBe(color)
        expect(isColor(piece, color)).toBe(true)
        expect(isColor(piece, opposite(color))).toBe(false)
      }
    }
  })

  it('distinguishes colours by sign', () => {
    expect(makePiece(WHITE, KNIGHT)).toBe(2)
    expect(makePiece(BLACK, KNIGHT)).toBe(-2)
  })

  it('treats an empty square as neither colour', () => {
    expect(isColor(EMPTY, WHITE)).toBe(false)
    expect(isColor(EMPTY, BLACK)).toBe(false)
  })

  it('round-trips FEN piece letters', () => {
    for (const color of colors) {
      for (const type of types) {
        const piece = makePiece(color, type)
        expect(charToPiece(pieceToChar(piece))).toBe(piece)
      }
    }
  })

  it('uses uppercase for white and lowercase for black', () => {
    expect(pieceToChar(makePiece(WHITE, KING))).toBe('K')
    expect(pieceToChar(makePiece(BLACK, KING))).toBe('k')
    expect(pieceToChar(EMPTY)).toBe('.')
  })

  it('rejects invalid piece letters', () => {
    expect(() => charToPiece('x')).toThrow()
    expect(() => charToPiece('.')).toThrow()
    expect(() => charToPiece('1')).toThrow()
  })
})

describe('board setup', () => {
  it('starts empty', () => {
    const board = createEmptyBoard()
    expect(board).toHaveLength(128)
    expect([...eachSquare()].every((sq) => board[sq] === EMPTY)).toBe(true)
  })

  it('places 32 pieces in the starting position', () => {
    const board = createStartingBoard()
    const occupied = [...eachSquare()].filter((sq) => board[sq] !== EMPTY)
    expect(occupied).toHaveLength(32)
  })

  it('places the back ranks and pawns correctly', () => {
    const board = createStartingBoard()
    expect(board[algebraicToSquare('a1')]).toBe(makePiece(WHITE, ROOK))
    expect(board[algebraicToSquare('e1')]).toBe(makePiece(WHITE, KING))
    expect(board[algebraicToSquare('d1')]).toBe(makePiece(WHITE, QUEEN))
    expect(board[algebraicToSquare('e8')]).toBe(makePiece(BLACK, KING))
    expect(board[algebraicToSquare('d8')]).toBe(makePiece(BLACK, QUEEN))
    expect(board[algebraicToSquare('h8')]).toBe(makePiece(BLACK, ROOK))

    for (let file = 0; file < 8; file++) {
      expect(board[squareOf(file, 1)]).toBe(makePiece(WHITE, PAWN))
      expect(board[squareOf(file, 6)]).toBe(makePiece(BLACK, PAWN))
    }
  })

  it('leaves the middle four ranks empty', () => {
    const board = createStartingBoard()
    for (let rank = 2; rank <= 5; rank++) {
      for (let file = 0; file < 8; file++) {
        expect(board[squareOf(file, rank)]).toBe(EMPTY)
      }
    }
  })

  it('finds both kings', () => {
    const board = createStartingBoard()
    expect(findKing(board, WHITE)).toBe(algebraicToSquare('e1'))
    expect(findKing(board, BLACK)).toBe(algebraicToSquare('e8'))
  })

  it('reports a missing king as -1', () => {
    expect(findKing(createEmptyBoard(), WHITE)).toBe(-1)
  })
})

describe('dumpBoard', () => {
  it('prints the starting position with rank 8 at the top', () => {
    expect(dumpBoard(createStartingBoard())).toBe(
      [
        '8  r n b q k b n r',
        '7  p p p p p p p p',
        '6  . . . . . . . .',
        '5  . . . . . . . .',
        '4  . . . . . . . .',
        '3  . . . . . . . .',
        '2  P P P P P P P P',
        '1  R N B Q K B N R',
        '',
        '   a b c d e f g h',
      ].join('\n'),
    )
  })
})
