import './GameControls.css'

export type Orientation = 'white' | 'black'
export type Opponent = 'human' | 'computer'
export type Difficulty = 'easy' | 'medium' | 'hard'

type GameControlsProps = {
  canUndo: boolean
  canRedo: boolean
  orientation: Orientation
  opponent: Opponent
  difficulty: Difficulty
  onNewGame: () => void
  onFlip: () => void
  onUndo: () => void
  onRedo: () => void
  onOpponent: (opponent: Opponent) => void
  onDifficulty: (difficulty: Difficulty) => void
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

export function GameControls({
  canUndo,
  canRedo,
  orientation,
  opponent,
  difficulty,
  onNewGame,
  onFlip,
  onUndo,
  onRedo,
  onOpponent,
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
      <div className="control-group" role="group" aria-label="Opponent">
        <span className="control-label">Opponent</span>
        <div className="control-row">
          <button
            type="button"
            className="control-button"
            aria-pressed={opponent === 'human'}
            onClick={() => onOpponent('human')}
          >
            Human
          </button>
          <button
            type="button"
            className="control-button"
            aria-pressed={opponent === 'computer'}
            onClick={() => onOpponent('computer')}
          >
            Computer
          </button>
        </div>
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
              disabled={opponent === 'human'}
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
