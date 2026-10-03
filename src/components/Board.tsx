import './Board.css'
import type { Board as BoardState } from '../engine/board.ts'
import { isLightSquare, squareOf } from '../engine/board.ts'
import { Square } from './Square.tsx'

const FILES = 'abcdefgh'

/** White at the bottom. Rank 8 is the first row. */
export function Board({ board }: { board: BoardState }) {
  const squares = []
  for (let rank = 7; rank >= 0; rank--) {
    for (let file = 0; file < 8; file++) {
      const square = squareOf(file, rank)
      squares.push(
        <Square
          key={square}
          light={isLightSquare(square)}
          piece={board[square]}
          rankLabel={file === 0 ? String(rank + 1) : undefined}
          fileLabel={rank === 0 ? FILES[file] : undefined}
        />,
      )
    }
  }

  return <div className="board">{squares}</div>
}
