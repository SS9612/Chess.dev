import './App.css'
import { StubGame } from './engine/stubGame.ts'
import { Atmosphere } from './components/Atmosphere.tsx'
import { Board } from './components/Board.tsx'
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
              onChoose={gameStore.chooseSquare}
            />
          </section>
          <aside className="side-stage" aria-label="Game" />
        </div>
      </main>
    </>
  )
}

export default App
