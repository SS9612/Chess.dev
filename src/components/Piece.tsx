import { pieceMarkup, pieceName } from './pieceArt.ts'
import type { Piece } from '../engine/types.ts'

type PieceProps = {
  piece: Piece
  /** The square button names the piece, so the graphic itself stays silent. */
  decorative?: boolean
}

export function Piece({ piece, decorative = false }: PieceProps) {
  const markup = pieceMarkup(piece)
  if (markup === null) return null

  const side = piece > 0 ? 'white' : 'black'

  return (
    <span
      className={`piece piece-${side}`}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : pieceName(piece)}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  )
}

/** Shared gradients referenced by every piece. */
export function PieceDefs() {
  return (
    <svg className="piece-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="piece-light" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="42%" stopColor="#d7e2ee" />
          <stop offset="100%" stopColor="#7f93a8" />
        </linearGradient>
        <linearGradient id="piece-dark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#d2c4ea" />
          <stop offset="34%" stopColor="#7a68a0" />
          <stop offset="100%" stopColor="#322844" />
        </linearGradient>
      </defs>
    </svg>
  )
}
