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
  lastMove: Move | null
  checkSquare: SquareIndex
  orientation: 'white' | 'black'
  onChoose: (square: SquareIndex) => void
}

/** `white` puts white at the bottom. */
export function Board({
  board,
  selected,
  moves,
  lastMove,
  checkSquare,
  orientation,
  onChoose,
}: BoardProps) {
  const targets = new Map<number, SquareTarget>()
  for (const move of moves) {
    targets.set(move.to, isCapture(move) ? 'capture' : 'quiet')
  }

  const ranks = orientation === 'black' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0]
  const files = orientation === 'black' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7]
  const leftFile = files[0]
  const bottomRank = ranks[ranks.length - 1]

  const squares = []
  for (const rank of ranks) {
    for (const file of files) {
      const square = squareOf(file, rank)
      squares.push(
        <Square
          key={square}
          square={square}
          light={isLightSquare(square)}
          piece={board[square]}
          selected={square === selected}
          last={square === lastMove?.from || square === lastMove?.to}
          inCheck={square === checkSquare}
          target={targets.get(square) ?? null}
          rankLabel={file === leftFile ? String(rank + 1) : undefined}
          fileLabel={rank === bottomRank ? FILES[file] : undefined}
          onChoose={onChoose}
        />,
      )
    }
  }

  return <div className="board">{squares}</div>
}
