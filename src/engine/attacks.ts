/**
 * Whether a colour can capture on a square.
 *
 * The search starts at the square and looks outward, so it does not depend on
 * move generation. The piece standing on the square, if any, is ignored: the
 * question is whether `byColor` has a piece that could take something there.
 * Rays stop at the first piece they meet.
 */

import type { Board } from './board'
import { isOnBoard } from './board'
import type { Color, Square } from './types'
import { BISHOP, EMPTY, KING, KNIGHT, PAWN, QUEEN, ROOK, WHITE, makePiece } from './types'

const KNIGHT_OFFSETS = [14, 18, 31, 33, -14, -18, -31, -33]
const KING_OFFSETS = [1, -1, 16, -16, 15, -15, 17, -17]
const ROOK_OFFSETS = [1, -1, 16, -16]
const BISHOP_OFFSETS = [15, -15, 17, -17]

export function isSquareAttacked(board: Board, square: Square, byColor: Color): boolean {
  if (!isOnBoard(square)) return false

  if (leapsTo(board, square, KNIGHT_OFFSETS, makePiece(byColor, KNIGHT))) return true
  if (leapsTo(board, square, KING_OFFSETS, makePiece(byColor, KING))) return true
  if (pawnAttacks(board, square, byColor)) return true

  const queen = makePiece(byColor, QUEEN)
  if (rayAttacks(board, square, ROOK_OFFSETS, makePiece(byColor, ROOK), queen)) return true
  if (rayAttacks(board, square, BISHOP_OFFSETS, makePiece(byColor, BISHOP), queen)) return true

  return false
}

function leapsTo(board: Board, square: Square, offsets: readonly number[], attacker: number): boolean {
  for (const offset of offsets) {
    const from = square + offset
    if (isOnBoard(from) && board[from] === attacker) return true
  }
  return false
}

/**
 * A pawn attacks one step diagonally forward, so the pawn that hits this
 * square stands one step diagonally back from the attacker's point of view.
 */
function pawnAttacks(board: Board, square: Square, byColor: Color): boolean {
  const pawn = makePiece(byColor, PAWN)
  const backward = byColor === WHITE ? -16 : 16
  for (const fileStep of [-1, 1]) {
    const from = square + backward + fileStep
    if (isOnBoard(from) && board[from] === pawn) return true
  }
  return false
}

function rayAttacks(
  board: Board,
  square: Square,
  offsets: readonly number[],
  slider: number,
  queen: number,
): boolean {
  for (const offset of offsets) {
    let from = square + offset
    while (isOnBoard(from)) {
      const piece = board[from]
      if (piece !== EMPTY) {
        if (piece === slider || piece === queen) return true
        break
      }
      from += offset
    }
  }
  return false
}
