import { useState } from 'react'
import './App.css'
import { StubGame } from './engine/stubGame.ts'
import { Atmosphere } from './components/Atmosphere.tsx'
import { Board } from './components/Board.tsx'
import { GameControls, type Difficulty, type Opponent, type Orientation } from './components/GameControls.tsx'
import { MoveList } from './components/MoveList.tsx'
import { PieceDefs } from './components/Piece.tsx'
import { createGameStore, useGameStore } from './state/gameStore.ts'

const gameStore = createGameStore(new StubGame())

function App() {
  const game = useGameStore(gameStore)
  const [orientation, setOrientation] = useState<Orientation>('white')
  const [opponent, setOpponent] = useState<Opponent>('human')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')

  return (
    <>
      <PieceDefs />
      <Atmosphere />
      <main className="app">
        <h1>Chess</h1>
        <div className="stage">
          <section className="board-stage" aria-label="Chessboard">
            <Board
              board={game.position.board}
              selected={game.selected}
              moves={game.movesFromSelection}
              lastMove={game.lastMove}
              checkSquare={game.status.checkSquare}
              orientation={orientation}
              onChoose={gameStore.chooseSquare}
            />
          </section>
          <aside className="side-stage">
            <MoveList history={game.history} fullmoveNumber={game.position.fullmoveNumber} />
            <GameControls
              canUndo={game.canUndo}
              canRedo={game.canRedo}
              orientation={orientation}
              opponent={opponent}
              difficulty={difficulty}
              onNewGame={() => gameStore.reset()}
              onFlip={() => setOrientation((current) => (current === 'white' ? 'black' : 'white'))}
              onUndo={() => gameStore.undo()}
              onRedo={() => gameStore.redo()}
              onOpponent={setOpponent}
              onDifficulty={setDifficulty}
            />
          </aside>
        </div>
      </main>
    </>
  )
}

export default App
