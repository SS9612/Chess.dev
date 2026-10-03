import type { GameStatus } from '../engine/gameApi.ts'
import { BLACK, WHITE } from '../engine/types.ts'

export interface GameOverCopy {
  title: string
  detail: string
}

const DRAW_REASONS = {
  'fifty-move': 'Fifty-move rule',
  'threefold-repetition': 'Threefold repetition',
  'insufficient-material': 'Insufficient material',
} as const

/** Wording for a finished game. Null while the game is still being played. */
export function gameOverCopy(status: GameStatus): GameOverCopy | null {
  if (status.outcome === 'playing') return null

  if (status.outcome === 'checkmate') {
    const winner = status.winner === WHITE ? 'White' : status.winner === BLACK ? 'Black' : null
    return { title: 'Checkmate', detail: winner === null ? '' : `${winner} wins` }
  }

  if (status.outcome === 'stalemate') {
    return { title: 'Stalemate', detail: 'Draw' }
  }

  const reason = status.drawReason === null ? '' : DRAW_REASONS[status.drawReason]
  return { title: 'Draw', detail: reason }
}
