/**
 * Core value types for the engine.
 *
 * A piece is encoded as a single signed integer so the board can live in an
 * Int8Array: the sign carries the colour and the magnitude carries the type.
 * White knight is 2, black knight is -2, and 0 is an empty square.
 */

export const WHITE = 1
export const BLACK = -1

export type Color = typeof WHITE | typeof BLACK

export const PAWN = 1
export const KNIGHT = 2
export const BISHOP = 3
export const ROOK = 4
export const QUEEN = 5
export const KING = 6

export type PieceType =
  | typeof PAWN
  | typeof KNIGHT
  | typeof BISHOP
  | typeof ROOK
  | typeof QUEEN
  | typeof KING

/** An encoded piece, or EMPTY for a vacant square. */
export type Piece = number

export const EMPTY = 0

/** A 0x88 board index in the range 0..127. Only 64 of those are real squares. */
export type Square = number

export function makePiece(color: Color, type: PieceType): Piece {
  return color * type
}

export function pieceType(piece: Piece): PieceType {
  return Math.abs(piece) as PieceType
}

/** Only meaningful for a non-empty square. */
export function pieceColor(piece: Piece): Color {
  return piece > 0 ? WHITE : BLACK
}

export function isColor(piece: Piece, color: Color): boolean {
  return piece !== EMPTY && (piece > 0 ? WHITE : BLACK) === color
}

export function opposite(color: Color): Color {
  return -color as Color
}
