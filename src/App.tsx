import { useState } from 'react'
import './App.css'
import { StubGame } from './engine/stubGame.ts'
import { Atmosphere } from './components/Atmosphere.tsx'
import { Board } from './components/Board.tsx'
import { GameOver } from './components/GameOver.tsx'
import { GameControls, type Difficulty, type Orientation } from './components/GameControls.tsx'
import { MoveList } from './components/MoveList.tsx'
import { PieceDefs } from './components/Piece.tsx'
import { PromotionDialog } from './components/PromotionDialog.tsx'
import { createGameStore, useGameStore } from './state/gameStore.ts'

const gameStore = createGameStore(new StubGame())

function App() {
  const game = useGameStore(gameStore)
  const [orientation, setOrientation] = useState<Orientation>('white')
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
            {game.pendingPromotion !== null && game.status.outcome === 'playing' && (
              <PromotionDialog
                color={game.turn}
                onChoose={(piece) => gameStore.confirmPromotion(piece)}
                onCancel={() => gameStore.cancelPromotion()}
              />
            )}
            <GameOver status={game.status} onNewGame={() => gameStore.reset()} />
          </section>
          <aside className="side-stage">
            <MoveList history={game.history} fullmoveNumber={game.position.fullmoveNumber} />
            <GameControls
              canUndo={game.canUndo}
              canRedo={game.canRedo}
              orientation={orientation}
              difficulty={difficulty}
              onNewGame={() => gameStore.reset()}
              onFlip={() => setOrientation((current) => (current === 'white' ? 'black' : 'white'))}
              onUndo={() => gameStore.undo()}
              onRedo={() => gameStore.redo()}
              onDifficulty={setDifficulty}
            />
          </aside>
        </div>
      </main>
    </>
  )
}

export default App
