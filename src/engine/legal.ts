/**
 * Legal moves.
 *
 * A pseudo-legal move is legal when the mover's king is not attacked afterwards.
 * Castling has two extra refusals the final king square does not cover: the
 * king may not be in check already, and the square it crosses may not be attacked.
 */

import type { Position } from './board'
import { findKing } from './board'
import { isSquareAttacked } from './attacks'
import { makeMove, unmakeMove } from './makeMove'
import { generateMoves } from './moves'
import type { Move } from './types'
import { KING, isCastle, opposite, pieceType } from './types'

export function generateLegalMoves(position: Position): Move[] {
  const legal: Move[] = []
  const enemy = opposite(position.turn)
  const kingSquare = findKing(position.board, position.turn)
  const inCheck = isSquareAttacked(position.board, kingSquare, enemy)

  for (const move of generateMoves(position)) {
    if (isCastle(move) && (inCheck || isSquareAttacked(position.board, crossedSquare(move), enemy))) {
      continue
    }

    const undo = makeMove(position, move)
    const king = pieceType(move.piece) === KING ? move.to : kingSquare
    const leavesKingInCheck = isSquareAttacked(position.board, king, enemy)
    unmakeMove(position, move, undo)

    if (!leavesKingInCheck) legal.push(move)
  }

  return legal
}

/** The one square a castling king steps across, midway between its start and its destination. */
function crossedSquare(move: Move): number {
  return (move.from + move.to) >> 1
}
