import './Board.css'
import type { Board as BoardState } from '../engine/board.ts'
import { isLightSquare, squareOf } from '../engine/board.ts'
import type { Move, Square as SquareIndex } from '../engine/types.ts'
import { isCapture } from '../engine/types.ts'
import { Square, type SquareTarget } from './Square.tsx'

const FILES = 'abcdefgh'

type BoardProps = {
  board: BoardState
  selected: SquareIndex | null
  moves: Move[]
  onChoose: (square: SquareIndex) => void
}

/** White at the bottom. Rank 8 is the first row. */
export function Board({ board, selected, moves, onChoose }: BoardProps) {
  const targets = new Map<number, SquareTarget>()
  for (const move of moves) {
    targets.set(move.to, isCapture(move) ? 'capture' : 'quiet')
  }

  const squares = []
  for (let rank = 7; rank >= 0; rank--) {
    for (let file = 0; file < 8; file++) {
      const square = squareOf(file, rank)
      squares.push(
        <Square
          key={square}
          square={square}
          light={isLightSquare(square)}
          piece={board[square]}
          selected={square === selected}
          target={targets.get(square) ?? null}
          rankLabel={file === 0 ? String(rank + 1) : undefined}
          fileLabel={rank === 0 ? FILES[file] : undefined}
          onChoose={onChoose}
        />,
      )
    }
  }

  return <div className="board">{squares}</div>
}
