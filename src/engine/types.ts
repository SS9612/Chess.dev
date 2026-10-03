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

/**
 * What kind of move this is. A move carries at most one of the castle flags and
 * may combine PROMOTION with CAPTURE, so these are a bitmask rather than an
 * enumeration of mutually exclusive cases.
 */
export const MOVE_QUIET = 0
export const MOVE_CAPTURE = 1
export const MOVE_DOUBLE_PUSH = 2
export const MOVE_EN_PASSANT = 4
export const MOVE_CASTLE_KING = 8
export const MOVE_CASTLE_QUEEN = 16
export const MOVE_PROMOTION = 32

/**
 * A single move. Kept as a plain object rather than a packed integer because
 * the UI reads the fields directly.
 */
export interface Move {
  from: Square
  to: Square
  piece: Piece
  /** EMPTY when nothing is taken. For en passant, the pawn removed in passing. */
  captured: Piece
  /** What a pawn promotes to, or 0 when this is not a promotion. */
  promotion: PieceType | 0
  /** Bitmask of the MOVE_* flags. */
  flags: number
}

export function isCapture(move: Move): boolean {
  return (move.flags & MOVE_CAPTURE) !== 0
}

export function isPromotion(move: Move): boolean {
  return (move.flags & MOVE_PROMOTION) !== 0
}

export function isCastle(move: Move): boolean {
  return (move.flags & (MOVE_CASTLE_KING | MOVE_CASTLE_QUEEN)) !== 0
}

export function isEnPassant(move: Move): boolean {
  return (move.flags & MOVE_EN_PASSANT) !== 0
}

/** True when both moves describe the same board change. */
export function sameMove(a: Move, b: Move): boolean {
  return a.from === b.from && a.to === b.to && a.promotion === b.promotion
}
