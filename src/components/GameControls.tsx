import './GameControls.css'

export type Orientation = 'white' | 'black'
export type Difficulty = 'easy' | 'medium' | 'hard'

type GameControlsProps = {
  canUndo: boolean
  canRedo: boolean
  orientation: Orientation
  difficulty: Difficulty
  onNewGame: () => void
  onFlip: () => void
  onUndo: () => void
  onRedo: () => void
  onDifficulty: (difficulty: Difficulty) => void
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

export function GameControls({
  canUndo,
  canRedo,
  orientation,
  difficulty,
  onNewGame,
  onFlip,
  onUndo,
  onRedo,
  onDifficulty,
}: GameControlsProps) {
  return (
    <div className="controls">
      <div className="control-row">
        <button type="button" className="control-button" onClick={onNewGame}>
          New game
        </button>
        <button
          type="button"
          className="control-button"
          aria-pressed={orientation === 'black'}
          onClick={onFlip}
        >
          Flip
        </button>
      </div>
      <div className="control-row">
        <button type="button" className="control-button" disabled={!canUndo} onClick={onUndo}>
          Undo
        </button>
        <button type="button" className="control-button" disabled={!canRedo} onClick={onRedo}>
          Redo
        </button>
      </div>
      <div className="control-group" role="group" aria-label="Difficulty">
        <span className="control-label">Difficulty</span>
        <div className="control-row">
          {DIFFICULTIES.map((level) => (
            <button
              key={level}
              type="button"
              className="control-button"
              aria-pressed={difficulty === level}
              onClick={() => onDifficulty(level)}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
