/**
 * Check, checkmate, stalemate and draws.
 *
 * The side to move is in check when its king is attacked. With no legal move,
 * that is checkmate, or stalemate when the king is safe. A position that still
 * has a move can be drawn by dead material, threefold repetition or the
 * fifty-move rule, in that order.
 */

import { isSquareAttacked } from './attacks'
import { NO_SQUARE, findKing } from './board'
import type { Position } from './board'
import { fiftyMoveDraw, insufficientMaterial, threefoldRepetition } from './draws'
import type { DrawReason, GameStatus } from './gameApi'
import { generateLegalMoves } from './legal'
import { opposite } from './types'

export function positionStatus(position: Position, history: readonly bigint[] = []): GameStatus {
  const kingSquare = findKing(position.board, position.turn)
  const inCheck = isSquareAttacked(position.board, kingSquare, opposite(position.turn))
  const hasMove = generateLegalMoves(position).length > 0

  if (!hasMove && inCheck) {
    return {
      outcome: 'checkmate',
      turn: position.turn,
      inCheck: true,
      checkSquare: kingSquare,
      winner: opposite(position.turn),
      drawReason: null,
    }
  }

  if (!hasMove) {
    return {
      outcome: 'stalemate',
      turn: position.turn,
      inCheck: false,
      checkSquare: NO_SQUARE,
      winner: null,
      drawReason: null,
    }
  }

  const drawReason = drawn(position, history)
  return {
    outcome: drawReason === null ? 'playing' : 'draw',
    turn: position.turn,
    inCheck,
    checkSquare: inCheck ? kingSquare : NO_SQUARE,
    winner: null,
    drawReason,
  }
}

function drawn(position: Position, history: readonly bigint[]): DrawReason | null {
  if (insufficientMaterial(position.board)) return 'insufficient-material'
  if (threefoldRepetition(position.key, history)) return 'threefold-repetition'
  if (fiftyMoveDraw(position)) return 'fifty-move'
  return null
}
