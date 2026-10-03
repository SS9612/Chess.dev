import { fileOf, rankOf, squareOf } from '../engine/board.ts'
import type { Move, Square } from '../engine/types.ts'
import { EMPTY, isCapture, isEnPassant } from '../engine/types.ts'

export interface MoveTravel {
  /** Squares to the right of the destination. Negative is left. */
  x: number
  /** Squares below the destination. Negative is above. */
  y: number
}

/**
 * Where a piece on `square` should begin its slide, in screen squares, so that
 * it finishes on the destination. Null when this square is not the move's
 * destination.
 */
export function moveTravel(
  square: Square,
  lastMove: Move | null,
  orientation: 'white' | 'black',
): MoveTravel | null {
  if (lastMove === null || lastMove.to !== square) return null

  const fileSign = orientation === 'white' ? 1 : -1
  const rankSign = orientation === 'white' ? -1 : 1
  const dx = (fileOf(lastMove.to) - fileOf(lastMove.from)) * fileSign
  const dy = (rankOf(lastMove.to) - rankOf(lastMove.from)) * rankSign
  if (dx === 0 && dy === 0) return null

  const x = -dx
  const y = -dy
  return { x: x === 0 ? 0 : x, y: y === 0 ? 0 : y }
}

/** The square the taken piece stood on, or null when the move took nothing. */
export function capturedSquare(move: Move | null): Square | null {
  if (move === null || move.captured === EMPTY || !isCapture(move)) return null
  if (isEnPassant(move)) return squareOf(fileOf(move.to), rankOf(move.from))
  return move.to
}
