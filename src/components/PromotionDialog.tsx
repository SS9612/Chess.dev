import './Overlays.css'
import type { Color, PieceType } from '../engine/types.ts'
import { BISHOP, KNIGHT, QUEEN, ROOK, makePiece } from '../engine/types.ts'
import { Piece } from './Piece.tsx'
import { pieceName } from './pieceArt.ts'

const CHOICES: PieceType[] = [QUEEN, ROOK, BISHOP, KNIGHT]

type PromotionDialogProps = {
  color: Color
  onChoose: (piece: PieceType) => void
  onCancel: () => void
}

export function PromotionDialog({ color, onChoose, onCancel }: PromotionDialogProps) {
  return (
    <div className="board-overlay" onClick={onCancel}>
      <div
        className="promotion-dialog"
        role="dialog"
        aria-label="Choose promotion piece"
        onClick={(event) => event.stopPropagation()}
      >
        {CHOICES.map((type) => {
          const piece = makePiece(color, type)
          return (
            <button
              key={type}
              type="button"
              className="promotion-choice"
              aria-label={pieceName(piece)}
              onClick={() => onChoose(type)}
            >
              <Piece piece={piece} decorative />
            </button>
          )
        })}
      </div>
    </div>
  )
}
