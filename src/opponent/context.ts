/**
 * What the computer is told before it chooses a move.
 *
 * Easy, medium, and hard share the position, the move history, and the legal
 * moves. They differ in how carefully the instructions ask for the choice.
 */

import type { GameApi } from '../engine/gameApi.ts'
import { toSan } from '../engine/san.ts'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface MoveContext {
  fen: string
  difficulty: Difficulty
  /** Legal moves in standard algebraic notation. */
  legalMoves: string[]
  /** Moves already played, in order, in standard algebraic notation. */
  history: string[]
  instructions: string
}

const INSTRUCTIONS: Record<Difficulty, string> = {
  easy: 'Play a casual legal move. Prefer quiet development; you may miss a tactic. Answer with one move from the list only.',
  medium:
    'Play a solid legal move. Prefer checks, good captures, castling, and central development over edge pawn moves. Answer with one move from the list only.',
  hard: 'Play the strongest legal move. Prioritize: (1) mate, (2) checks, (3) captures that win material, (4) castling or developing toward the center, (5) stopping threats on your king or queen. Answer with one move from the list only.',
}

export function buildMoveContext(game: GameApi, difficulty: Difficulty): MoveContext {
  const position = game.position()
  const legalMoves = game.legalMoves().map((move) => toSan(position, move))
  legalMoves.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))

  return {
    fen: game.fen(),
    difficulty,
    legalMoves,
    history: game.history().map((record) => record.san),
    instructions: INSTRUCTIONS[difficulty],
  }
}
