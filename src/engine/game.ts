/**
 * The rules engine behind GameApi.
 *
 * Legal moves, notation and the result all come from the engine. Undo and redo
 * walk a stored list of positions, and a move played after an undo drops the
 * moves that were ahead.
 */

import { clonePosition } from './board'
import type { Position } from './board'
import { START_FEN, parseFen, toFen } from './fen'
import type { GameApi, GameStatus, MoveRecord } from './gameApi'
import { generateLegalMoves } from './legal'
import { makeMove } from './makeMove'
import { toSan } from './san'
import { positionStatus } from './status'
import type { Color, Move, PieceType, Square } from './types'
import { isPromotion } from './types'

export class Game implements GameApi {
  /** Snapshot per ply. Index 0 is the initial position. */
  private positions: Position[]
  /** One shorter than `positions`; record i produced position i + 1. */
  private records: MoveRecord[] = []
  private cursor = 0

  constructor(fen: string = START_FEN) {
    this.positions = [parseFen(fen)]
  }

  position(): Position {
    return this.positions[this.cursor]
  }

  turn(): Color {
    return this.position().turn
  }

  fen(): string {
    return toFen(this.position())
  }

  legalMovesFrom(square: Square): Move[] {
    if (this.status().outcome !== 'playing') return []
    return generateLegalMoves(this.position()).filter((move) => move.from === square)
  }

  legalMoves(): Move[] {
    if (this.status().outcome !== 'playing') return []
    return generateLegalMoves(this.position())
  }

  move(from: Square, to: Square, promotion?: PieceType): Move | null {
    const choices = this.legalMovesFrom(from).filter((candidate) => candidate.to === to)
    if (choices.length === 0) return null

    if (choices.some(isPromotion)) {
      const chosen = choices.find((candidate) => candidate.promotion === promotion)
      if (chosen === undefined) return null
      this.commit(chosen)
      return chosen
    }

    this.commit(choices[0])
    return choices[0]
  }

  undo(): boolean {
    if (!this.canUndo()) return false
    this.cursor--
    return true
  }

  redo(): boolean {
    if (!this.canRedo()) return false
    this.cursor++
    return true
  }

  canUndo(): boolean {
    return this.cursor > 0
  }

  canRedo(): boolean {
    return this.cursor < this.records.length
  }

  reset(fen: string = START_FEN): void {
    this.positions = [parseFen(fen)]
    this.records = []
    this.cursor = 0
  }

  status(): GameStatus {
    const seen = this.positions.slice(0, this.cursor + 1).map((position) => position.key)
    return positionStatus(this.position(), seen)
  }

  history(): MoveRecord[] {
    return this.records.slice(0, this.cursor)
  }

  lastMove(): Move | null {
    return this.cursor > 0 ? this.records[this.cursor - 1].move : null
  }

  private commit(move: Move): void {
    const current = this.position()
    const san = toSan(current, move)
    const next = clonePosition(current)
    makeMove(next, move)

    this.positions.length = this.cursor + 1
    this.records.length = this.cursor
    this.positions.push(next)
    this.records.push({ move, san, fen: toFen(next) })
    this.cursor++
  }
}
