/**
 * A GameApi stand-in that does not implement the rules.
 *
 * Pieces on their home squares offer the real opening moves from a lookup
 * table. Everything else offers king-steps. That is enough for the board to
 * behave plausibly; it is not a move generator.
 */

import type { Board, Position } from './board'
import {
  NO_SQUARE,
  algebraicToSquare,
  clonePosition,
  isOnBoard,
  rankOf,
  squareToAlgebraic,
} from './board'
import { START_FEN, parseFen, toFen } from './fen'
import { hashPosition } from './zobrist'
import type { GameApi, GameStatus, MoveRecord } from './gameApi'
import type { Color, Move, PieceType, Square } from './types'
import {
  BLACK,
  EMPTY,
  KNIGHT,
  MOVE_CAPTURE,
  MOVE_DOUBLE_PUSH,
  MOVE_PROMOTION,
  MOVE_QUIET,
  PAWN,
  WHITE,
  isColor,
  makePiece,
  opposite,
  pieceColor,
  pieceType,
} from './types'

/**
 * The real legal moves for pieces still on their home squares. A lookup table,
 * not a generator. Keyed per colour and checked against the piece type, so a
 * white pawn that reaches e7 is not handed black's opening moves.
 */
type HomeMoves = Record<string, { piece: PieceType; to: string[] }>

const WHITE_HOME_MOVES: HomeMoves = {
  a2: { piece: PAWN, to: ['a3', 'a4'] },
  b2: { piece: PAWN, to: ['b3', 'b4'] },
  c2: { piece: PAWN, to: ['c3', 'c4'] },
  d2: { piece: PAWN, to: ['d3', 'd4'] },
  e2: { piece: PAWN, to: ['e3', 'e4'] },
  f2: { piece: PAWN, to: ['f3', 'f4'] },
  g2: { piece: PAWN, to: ['g3', 'g4'] },
  h2: { piece: PAWN, to: ['h3', 'h4'] },
  b1: { piece: KNIGHT, to: ['a3', 'c3'] },
  g1: { piece: KNIGHT, to: ['f3', 'h3'] },
}

const BLACK_HOME_MOVES: HomeMoves = {
  a7: { piece: PAWN, to: ['a6', 'a5'] },
  b7: { piece: PAWN, to: ['b6', 'b5'] },
  c7: { piece: PAWN, to: ['c6', 'c5'] },
  d7: { piece: PAWN, to: ['d6', 'd5'] },
  e7: { piece: PAWN, to: ['e6', 'e5'] },
  f7: { piece: PAWN, to: ['f6', 'f5'] },
  g7: { piece: PAWN, to: ['g6', 'g5'] },
  h7: { piece: PAWN, to: ['h6', 'h5'] },
  b8: { piece: KNIGHT, to: ['a6', 'c6'] },
  g8: { piece: KNIGHT, to: ['f6', 'h6'] },
}

const KING_STEPS = [1, -1, 16, -16, 15, -15, 17, -17]

export class StubGame implements GameApi {
  /** Snapshot per ply. Index 0 is the initial position. */
  private positions: Position[]
  /** One shorter than `positions`; record i produced position i + 1. */
  private records: MoveRecord[] = []
  private cursor = 0
  private forced: Partial<GameStatus> | null = null

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
    const position = this.position()
    const piece = position.board[square]
    if (!isOnBoard(square) || piece === EMPTY || pieceColor(piece) !== position.turn) {
      return []
    }

    const home = position.turn === WHITE ? WHITE_HOME_MOVES : BLACK_HOME_MOVES
    const scripted = home[squareToAlgebraic(square)]
    const targets =
      scripted !== undefined && scripted.piece === pieceType(piece)
        ? scripted.to.map(algebraicToSquare).filter((to) => position.board[to] === EMPTY)
        : KING_STEPS.map((step) => square + step).filter(
            (to) => isOnBoard(to) && !isColor(position.board[to], position.turn),
          )

    return targets.map((to) => this.describeMove(square, to))
  }

  legalMoves(): Move[] {
    const position = this.position()
    const moves: Move[] = []
    for (let square = 0; square < 128; square++) {
      if (isOnBoard(square) && isColor(position.board[square], position.turn)) {
        moves.push(...this.legalMovesFrom(square))
      }
    }
    return moves
  }

  move(from: Square, to: Square, promotion?: PieceType): Move | null {
    const legal = this.legalMovesFrom(from).find((candidate) => candidate.to === to)
    if (legal === undefined) return null

    const move = promotion === undefined ? legal : { ...legal, promotion }
    this.apply(move)
    return move
  }

  /**
   * Applies a move without checking it against the fixture's move list, so
   * demo games can use moves the lookup table does not know about.
   */
  forceMove(from: Square, to: Square, san?: string): Move {
    const move = this.describeMove(from, to)
    this.apply(move, san)
    return move
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
    this.forced = null
  }

  status(): GameStatus {
    const base: GameStatus = {
      outcome: 'playing',
      turn: this.turn(),
      inCheck: false,
      checkSquare: NO_SQUARE,
      winner: null,
      drawReason: null,
    }
    return this.forced === null ? base : { ...base, ...this.forced }
  }

  /** Overrides the reported status. Pass null to clear the override. */
  forceStatus(status: Partial<GameStatus> | null): void {
    this.forced = status
  }

  history(): MoveRecord[] {
    return this.records.slice(0, this.cursor)
  }

  lastMove(): Move | null {
    return this.cursor > 0 ? this.records[this.cursor - 1].move : null
  }

  private describeMove(from: Square, to: Square): Move {
    const board = this.position().board
    const piece = board[from]
    const captured = board[to]
    const isPawn = pieceType(piece) === PAWN
    const distance = Math.abs(rankOf(to) - rankOf(from))

    let flags = MOVE_QUIET
    if (captured !== EMPTY) flags |= MOVE_CAPTURE
    if (isPawn && distance === 2) flags |= MOVE_DOUBLE_PUSH

    const promotionRank = pieceColor(piece) === WHITE ? 7 : 0
    const promoting = isPawn && rankOf(to) === promotionRank
    if (promoting) flags |= MOVE_PROMOTION

    return { from, to, piece, captured, promotion: 0, flags }
  }

  private apply(move: Move, san?: string): void {
    // Playing a move after undoing discards the moves that were undone.
    this.positions.length = this.cursor + 1
    this.records.length = this.cursor

    const next = clonePosition(this.position())
    movePiece(next.board, move)

    const isPawnMove = pieceType(move.piece) === PAWN
    next.epSquare =
      (move.flags & MOVE_DOUBLE_PUSH) !== 0 ? (move.from + move.to) / 2 : NO_SQUARE
    next.halfmoveClock =
      isPawnMove || move.captured !== EMPTY ? 0 : this.position().halfmoveClock + 1
    if (next.turn === BLACK) next.fullmoveNumber++
    next.turn = opposite(next.turn)
    next.key = hashPosition(next)

    this.positions.push(next)
    this.records.push({ move, san: san ?? describeSan(move), fen: toFen(next) })
    this.cursor++
  }
}

function movePiece(board: Board, move: Move): void {
  const promoted =
    (move.flags & MOVE_PROMOTION) !== 0 && move.promotion !== 0
      ? makePiece(pieceColor(move.piece), move.promotion)
      : move.piece
  board[move.from] = EMPTY
  board[move.to] = promoted
}

/** Rough SAN. No disambiguation, and no check or mate suffixes. */
function describeSan(move: Move): string {
  const letters = ['', '', 'N', 'B', 'R', 'Q', 'K']
  const prefix = letters[pieceType(move.piece)]
  const capture = (move.flags & MOVE_CAPTURE) !== 0 ? 'x' : ''
  const target = squareToAlgebraic(move.to)
  const promotion = move.promotion !== 0 ? `=${letters[move.promotion]}` : ''
  return `${prefix}${capture}${target}${promotion}`
}

/** The opening of a Ruy Lopez, so the move list has realistic content to render. */
const DEMO_MOVES: ReadonlyArray<readonly [string, string, string]> = [
  ['e2', 'e4', 'e4'],
  ['e7', 'e5', 'e5'],
  ['g1', 'f3', 'Nf3'],
  ['b8', 'c6', 'Nc6'],
  ['f1', 'b5', 'Bb5'],
  ['a7', 'a6', 'a6'],
]

export function createDemoGame(): StubGame {
  const game = new StubGame()
  for (const [from, to, san] of DEMO_MOVES) {
    game.forceMove(algebraicToSquare(from), algebraicToSquare(to), san)
  }
  return game
}
