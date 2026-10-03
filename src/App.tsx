import './App.css'
import { StubGame } from './engine/stubGame.ts'
import { Atmosphere } from './components/Atmosphere.tsx'
import { Board } from './components/Board.tsx'
import { MoveList } from './components/MoveList.tsx'
import { PieceDefs } from './components/Piece.tsx'
import { createGameStore, useGameStore } from './state/gameStore.ts'

const gameStore = createGameStore(new StubGame())

function App() {
  const game = useGameStore(gameStore)

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
              onChoose={gameStore.chooseSquare}
            />
          </section>
          <aside className="side-stage">
            <MoveList history={game.history} fullmoveNumber={game.position.fullmoveNumber} />
          </aside>
        </div>
      </main>
    </>
  )
}

export default App
