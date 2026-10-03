import type { MoveRecord } from '../engine/gameApi.ts'

export interface MoveRow {
  number: number
  white: string | null
  black: string | null
}

/**
 * Groups a flat history into numbered pairs. `fullmoveNumber` is the current
 * position's move number, after the history has been played.
 */
export function moveRows(history: MoveRecord[], fullmoveNumber: number): MoveRow[] {
  const blackMoves = history.filter((record) => record.move.piece < 0).length
  let number = fullmoveNumber - blackMoves
  const rows: MoveRow[] = []

  for (const record of history) {
    if (record.move.piece > 0) {
      rows.push({ number, white: record.san, black: null })
      continue
    }

    const open = rows.at(-1)
    if (open !== undefined && open.white !== null && open.black === null) {
      open.black = record.san
    } else {
      rows.push({ number, white: null, black: record.san })
    }
    number += 1
  }

  return rows
}
