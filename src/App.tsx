import { useState } from 'react'
import './App.css'
import { Game } from './engine/game.ts'
import { chooseMove } from './opponent/chooseMove.ts'
import { Atmosphere } from './components/Atmosphere.tsx'
import { Board } from './components/Board.tsx'
import { GameOver } from './components/GameOver.tsx'
import { GameControls, type Orientation } from './components/GameControls.tsx'
import { MoveList } from './components/MoveList.tsx'
import { PieceDefs } from './components/Piece.tsx'
import { PromotionDialog } from './components/PromotionDialog.tsx'
import { createGameStore, useGameStore } from './state/gameStore.ts'

const gameStore = createGameStore(new Game(), { chooseMove, pauseMs: 400 })

function App() {
  const game = useGameStore(gameStore)
  const [orientation, setOrientation] = useState<Orientation>('white')

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
              disabled={game.thinking || game.status.outcome !== 'playing'}
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
            <MoveList
              history={game.history}
              fullmoveNumber={game.position.fullmoveNumber}
              thinking={game.thinking}
            />
            <GameControls
              canUndo={game.canUndo}
              canRedo={game.canRedo}
              orientation={orientation}
              difficulty={game.difficulty}
              onNewGame={() => gameStore.reset()}
              onFlip={() => setOrientation((current) => (current === 'white' ? 'black' : 'white'))}
              onUndo={() => gameStore.undo()}
              onRedo={() => gameStore.redo()}
              onDifficulty={gameStore.setDifficulty}
            />
          </aside>
        </div>
      </main>
    </>
  )
}

export default App
