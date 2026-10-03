import './Overlays.css'
import type { GameStatus } from '../engine/gameApi.ts'
import { gameOverCopy } from './gameOverCopy.ts'

type GameOverProps = {
  status: GameStatus
  onNewGame: () => void
}

export function GameOver({ status, onNewGame }: GameOverProps) {
  const copy = gameOverCopy(status)
  if (copy === null) return null

  return (
    <div className="board-overlay">
      <div className="game-over" role="dialog" aria-label="Game over">
        <h2>{copy.title}</h2>
        {copy.detail !== '' && <p>{copy.detail}</p>}
        <button type="button" className="game-over-action" onClick={onNewGame}>
          New game
        </button>
      </div>
    </div>
  )
}
