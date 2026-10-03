import { Piece } from './Piece.tsx'
import type { Piece as PieceCode } from '../engine/types.ts'
import { EMPTY } from '../engine/types.ts'

type SquareProps = {
  light: boolean
  piece: PieceCode
  rankLabel?: string
  fileLabel?: string
}

export function Square({ light, piece, rankLabel, fileLabel }: SquareProps) {
  const tone = light ? 'square-light' : 'square-dark'

  return (
    <div className={`square ${tone}`}>
      {piece !== EMPTY && <Piece piece={piece} />}
      {rankLabel !== undefined && <span className="coord coord-rank">{rankLabel}</span>}
      {fileLabel !== undefined && <span className="coord coord-file">{fileLabel}</span>}
    </div>
  )
}
