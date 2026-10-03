/**
 * 0x88 board representation.
 *
 * The board is a 128-entry array laid out as two side-by-side 8x8 halves. The
 * left half holds the real squares and the right half is padding, which makes
 * off-board detection a single bitwise test: a square index is valid exactly
 * when `(square & 0x88) === 0`. Sliding a piece off the edge of a rank lands in
 * the padding rather than wrapping onto the next rank, so ray generation needs
 * no bounds arithmetic.
 *
 * Index is `rank * 16 + file`, with rank 0 and file 0 at a1, so a1 is 0 and h8
 * is 119.
 */

import type { Color, Piece, PieceType, Square } from './types'
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
  makePiece,
  pieceType,
} from './types'

export type Board = Int8Array

export const BOARD_ARRAY_SIZE = 128

export const A1 = 0
export const H1 = 7
export const A8 = 112
export const H8 = 119

/** Used where a Square is absent, such as when there is no en passant target. */
export const NO_SQUARE = -1

/** Castling rights, held as a bitmask so they are cheap to copy and hash. */
export const CASTLE_WK = 1
export const CASTLE_WQ = 2
export const CASTLE_BK = 4
export const CASTLE_BQ = 8
export const CASTLE_ALL = CASTLE_WK | CASTLE_WQ | CASTLE_BK | CASTLE_BQ

/** The complete state of a game at one point in time. */
export interface Position {
  board: Board
  turn: Color
  /** Bitmask of the CASTLE_* flags. */
  castling: number
  /** The square a pawn may capture onto, or NO_SQUARE. */
  epSquare: Square
  /** Plies since the last capture or pawn move, for the fifty-move rule. */
  halfmoveClock: number
  /** Starts at 1 and increments after each black move. */
  fullmoveNumber: number
  /**
   * Zobrist key of the pieces, the side to move, the castling rights and the
   * en passant file. The clocks are not part of it.
   */
  key: bigint
}

export function clonePosition(position: Position): Position {
  return { ...position, board: position.board.slice() }
}

const FILE_CHARS = 'abcdefgh'
const RANK_CHARS = '12345678'

/** Indexed by piece type, so PAWN (1) maps to 'p'. */
const TYPE_CHARS = '.pnbrqk'

export function isOnBoard(square: Square): boolean {
  return (square & 0x88) === 0
}

export function fileOf(square: Square): number {
  return square & 7
}

export function rankOf(square: Square): number {
  return square >> 4
}

export function squareOf(file: number, rank: number): Square {
  return rank * 16 + file
}

/** Light squares and dark squares alternate; a1 is dark. */
export function isLightSquare(square: Square): boolean {
  return (fileOf(square) + rankOf(square)) % 2 === 1
}

export function squareToAlgebraic(square: Square): string {
  if (!isOnBoard(square)) {
    throw new Error(`Square ${square} is off the board`)
  }
  return FILE_CHARS[fileOf(square)] + RANK_CHARS[rankOf(square)]
}

export function algebraicToSquare(name: string): Square {
  const file = FILE_CHARS.indexOf(name[0])
  const rank = RANK_CHARS.indexOf(name[1])
  if (name.length !== 2 || file === -1 || rank === -1) {
    throw new Error(`Invalid square name "${name}"`)
  }
  return squareOf(file, rank)
}

/** FEN-style piece letter: uppercase for white, lowercase for black. */
export function pieceToChar(piece: Piece): string {
  if (piece === EMPTY) return '.'
  const char = TYPE_CHARS[pieceType(piece)]
  return piece > 0 ? char.toUpperCase() : char
}

export function charToPiece(char: string): Piece {
  const type = TYPE_CHARS.indexOf(char.toLowerCase()) as PieceType
  if (char.length !== 1 || type < 1) {
    throw new Error(`Invalid piece character "${char}"`)
  }
  const color: Color = char === char.toUpperCase() ? WHITE : BLACK
  return makePiece(color, type)
}

export function createEmptyBoard(): Board {
  return new Int8Array(BOARD_ARRAY_SIZE)
}

/** Back rank layout from the a-file to the h-file. */
const BACK_RANK: PieceType[] = [ROOK, KNIGHT, BISHOP, QUEEN, KING, BISHOP, KNIGHT, ROOK]

export function createStartingBoard(): Board {
  const board = createEmptyBoard()
  for (let file = 0; file < 8; file++) {
    const type = BACK_RANK[file]
    board[squareOf(file, 0)] = makePiece(WHITE, type)
    board[squareOf(file, 1)] = makePiece(WHITE, PAWN)
    board[squareOf(file, 6)] = makePiece(BLACK, PAWN)
    board[squareOf(file, 7)] = makePiece(BLACK, type)
  }
  return board
}

/** Iterates the 64 real squares from a1 to h8. */
export function* eachSquare(): Generator<Square> {
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      yield squareOf(file, rank)
    }
  }
}

export function findKing(board: Board, color: Color): Square {
  const king = makePiece(color, KING)
  for (const square of eachSquare()) {
    if (board[square] === king) return square
  }
  return -1
}

/**
 * Renders the board as ASCII with rank 8 at the top, matching how a board is
 * normally printed. Used for debugging move generation.
 */
export function dumpBoard(board: Board): string {
  const lines: string[] = []
  for (let rank = 7; rank >= 0; rank--) {
    const cells: string[] = []
    for (let file = 0; file < 8; file++) {
      cells.push(pieceToChar(board[squareOf(file, rank)]))
    }
    lines.push(`${RANK_CHARS[rank]}  ${cells.join(' ')}`)
  }
  lines.push('')
  lines.push(`   ${FILE_CHARS.split('').join(' ')}`)
  return lines.join('\n')
}
