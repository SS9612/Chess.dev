import './MoveList.css'
import type { MoveRecord } from '../engine/gameApi.ts'
import { moveRows } from './moveRows.ts'

type MoveListProps = {
  history: MoveRecord[]
  fullmoveNumber: number
}

export function MoveList({ history, fullmoveNumber }: MoveListProps) {
  const rows = moveRows(history, fullmoveNumber)
  const last = history.at(-1)
  const lastIsBlack = last !== undefined && last.move.piece < 0

  return (
    <section className="move-panel" aria-label="Moves">
      <h2>Moves</h2>
      {rows.length === 0 ? (
        <p className="move-empty">No moves yet</p>
      ) : (
        <ol className="move-list">
          {rows.map((row, index) => {
            const isLastRow = index === rows.length - 1
            return (
              <li key={row.number} className="move-row" value={row.number}>
                <span className="move-number">{row.number}</span>
                <span className={cellClass(isLastRow && !lastIsBlack && row.white !== null)}>
                  {row.white ?? ''}
                </span>
                <span className={cellClass(isLastRow && lastIsBlack && row.black !== null)}>
                  {row.black ?? ''}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

function cellClass(current: boolean): string {
  return current ? 'move-san move-current' : 'move-san'
}
