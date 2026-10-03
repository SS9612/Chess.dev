/**
 * Draws by the fifty-move rule, threefold repetition and dead material.
 *
 * Material is dead when no series of legal moves can checkmate: king against
 * king, king and one minor piece against a lone king, or bishops that all
 * stand on the same colour. Two knights against a lone king can still mate, so
 * that position is not dead.
 */

import type { Board } from './board'
import { eachSquare, fileOf, rankOf } from './board'
import type { Position } from './board'
import { BISHOP, EMPTY, KING, KNIGHT, pieceType } from './types'

export function fiftyMoveDraw(position: Position): boolean {
  return position.halfmoveClock >= 100
}

/** `history` lists every position reached, including the current one. */
export function threefoldRepetition(key: bigint, history: readonly bigint[]): boolean {
  let count = 0
  for (const entry of history) {
    if (entry === key) count++
  }
  return count >= 3
}

export function insufficientMaterial(board: Board): boolean {
  let knights = 0
  let lightBishops = 0
  let darkBishops = 0

  for (const square of eachSquare()) {
    const piece = board[square]
    if (piece === EMPTY || pieceType(piece) === KING) continue

    if (pieceType(piece) === KNIGHT) {
      knights++
      continue
    }

    if (pieceType(piece) === BISHOP) {
      if ((fileOf(square) + rankOf(square)) % 2 === 1) lightBishops++
      else darkBishops++
      continue
    }

    return false
  }

  if (lightBishops > 0 && darkBishops > 0) return false
  if (knights > 0 && lightBishops + darkBishops > 0) return false
  return knights <= 1
}
