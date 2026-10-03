import { squareToAlgebraic } from '../engine/board.ts'
import type { Piece as PieceCode, Square as SquareIndex } from '../engine/types.ts'
import { EMPTY } from '../engine/types.ts'
import { Piece } from './Piece.tsx'
import { pieceName } from './pieceArt.ts'

export type SquareTarget = 'quiet' | 'capture'

type SquareProps = {
  square: SquareIndex
  light: boolean
  piece: PieceCode
  selected: boolean
  target: SquareTarget | null
  rankLabel?: string
  fileLabel?: string
  onChoose: (square: SquareIndex) => void
}

export function Square({
  square,
  light,
  piece,
  selected,
  target,
  rankLabel,
  fileLabel,
  onChoose,
}: SquareProps) {
  const tone = light ? 'square-light' : 'square-dark'
  const classes = ['square', tone]
  if (selected) classes.push('square-selected')

  return (
    <button
      type="button"
      className={classes.join(' ')}
      aria-label={squareLabel(square, piece, target)}
      aria-pressed={selected}
      onClick={() => onChoose(square)}
    >
      {piece !== EMPTY && <Piece piece={piece} decorative />}
      {target === 'quiet' && <span className="move-dot" />}
      {target === 'capture' && <span className="capture-ring" />}
      {rankLabel !== undefined && <span className="coord coord-rank">{rankLabel}</span>}
      {fileLabel !== undefined && <span className="coord coord-file">{fileLabel}</span>}
    </button>
  )
}

function squareLabel(square: SquareIndex, piece: PieceCode, target: SquareTarget | null): string {
  const name = squareToAlgebraic(square)
  const occupant = piece === EMPTY ? '' : `, ${pieceName(piece)}`
  const action = target === 'capture' ? ', capture' : target === 'quiet' ? ', legal move' : ''
  return `${name}${occupant}${action}`
}
