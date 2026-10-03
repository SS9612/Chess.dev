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
  last: boolean
  inCheck: boolean
  target: SquareTarget | null
  travel: { x: number; y: number } | null
  taken: PieceCode | null
  rankLabel?: string
  fileLabel?: string
  onChoose: (square: SquareIndex) => void
}

export function Square({
  square,
  light,
  piece,
  selected,
  last,
  inCheck,
  target,
  travel,
  taken,
  rankLabel,
  fileLabel,
  onChoose,
}: SquareProps) {
  const tone = light ? 'square-light' : 'square-dark'
  const classes = ['square', tone]
  if (selected) classes.push('square-selected')
  if (last) classes.push('square-last')
  if (inCheck) classes.push('square-check')

  return (
    <button
      type="button"
      className={classes.join(' ')}
      aria-label={squareLabel(square, piece, target, inCheck)}
      aria-pressed={selected}
      onClick={() => onChoose(square)}
    >
      {taken !== null && <Piece piece={taken} decorative taken />}
      {piece !== EMPTY && <Piece piece={piece} decorative travel={travel} />}
      {inCheck && <span className="check-pulse" />}
      {target === 'quiet' && <span className="move-dot" />}
      {target === 'capture' && <span className="capture-ring" />}
      {rankLabel !== undefined && <span className="coord coord-rank">{rankLabel}</span>}
      {fileLabel !== undefined && <span className="coord coord-file">{fileLabel}</span>}
    </button>
  )
}

function squareLabel(
  square: SquareIndex,
  piece: PieceCode,
  target: SquareTarget | null,
  inCheck: boolean,
): string {
  const name = squareToAlgebraic(square)
  const occupant = piece === EMPTY ? '' : `, ${pieceName(piece)}`
  const action = target === 'capture' ? ', capture' : target === 'quiet' ? ', legal move' : ''
  const check = inCheck ? ', in check' : ''
  return `${name}${occupant}${action}${check}`
}
