import type { CSSProperties } from 'react'
import { pieceMarkup, pieceName } from './pieceArt.ts'
import type { Piece } from '../engine/types.ts'

type PieceProps = {
  piece: Piece
  /** The square button names the piece, so the graphic itself stays silent. */
  decorative?: boolean
  /** Screen-square offset the slide starts from. Omitted when the piece is still. */
  travel?: { x: number; y: number } | null
  /** Fades out. Used for the piece that was just taken. */
  taken?: boolean
}

export function Piece({ piece, decorative = false, travel = null, taken = false }: PieceProps) {
  const markup = pieceMarkup(piece)
  if (markup === null) return null

  const side = piece > 0 ? 'white' : 'black'
  const moving = travel !== null && !taken
  const classes = ['piece', `piece-${side}`]
  if (moving) classes.push('piece-moving')
  if (taken) classes.push('piece-taken')

  return (
    <span
      className={classes.join(' ')}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : pieceName(piece)}
      style={
        moving
          ? ({
              '--from-x': travel.x,
              '--from-y': travel.y,
            } as CSSProperties)
          : undefined
      }
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
          <stop offset="42%" stopColor="#eef6ff" />
          <stop offset="100%" stopColor="#9bb4c8" />
        </linearGradient>
        <linearGradient id="piece-dark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#5fd0a0" />
          <stop offset="34%" stopColor="#1f6b6b" />
          <stop offset="100%" stopColor="#12353a" />
        </linearGradient>
      </defs>
    </svg>
  )
}
