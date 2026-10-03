/**
 * The seam between the UI and the rules engine.
 *
 * Components talk to a game only through this interface, so the implementation
 * behind it can change without the UI changing with it.
 */

import type { Position } from './board'
import type { Color, Move, PieceType, Square } from './types'

export type GameOutcome = 'playing' | 'checkmate' | 'stalemate' | 'draw'

export type DrawReason = 'fifty-move' | 'threefold-repetition' | 'insufficient-material'

export interface GameStatus {
  outcome: GameOutcome
  /** Side to move. On checkmate this is the side that has been mated. */
  turn: Color
  inCheck: boolean
  /** The king under attack, or NO_SQUARE when not in check. */
  checkSquare: Square
  /** Set only when the outcome is checkmate. */
  winner: Color | null
  /** Set only when the outcome is a draw. */
  drawReason: DrawReason | null
}

/** One played move, with everything the move list needs to render it. */
export interface MoveRecord {
  move: Move
  san: string
  /** The position after the move, for replaying from the move list. */
  fen: string
}

export interface GameApi {
  position(): Position
  turn(): Color
  fen(): string

  /** Legal destinations for the piece on this square. Empty when there are none. */
  legalMovesFrom(square: Square): Move[]
  legalMoves(): Move[]

  /**
   * Plays a move if it is legal. `promotion` is required when a pawn reaches
   * the last rank and ignored otherwise. Returns the move played, or null when
   * the move was rejected.
   */
  move(from: Square, to: Square, promotion?: PieceType): Move | null

  undo(): boolean
  redo(): boolean
  canUndo(): boolean
  canRedo(): boolean

  /** Restarts from a FEN, defaulting to the standard starting position. */
  reset(fen?: string): void

  status(): GameStatus
  history(): MoveRecord[]
  lastMove(): Move | null
}
