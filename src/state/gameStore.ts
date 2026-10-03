/**
 * UI state for one game: the position from a GameApi, plus which square is
 * selected and a promotion waiting for a piece choice.
 *
 * getSnapshot returns the same object until an action changes something, which
 * is what useSyncExternalStore requires.
 */

import { useSyncExternalStore } from 'react'
import { clonePosition } from '../engine/board'
import type { Position } from '../engine/board'
import type { GameApi, GameStatus, MoveRecord } from '../engine/gameApi'
import { acceptReply } from '../opponent/acceptReply'
import { buildMoveContext } from '../opponent/context'
import type { Difficulty, MoveContext } from '../opponent/context'
import type { Color, Move, PieceType, Square } from '../engine/types'
import { BLACK, EMPTY, WHITE, isColor, isPromotion } from '../engine/types'

export interface PendingPromotion {
  from: Square
  to: Square
}

export interface GameSnapshot {
  position: Position
  turn: Color
  fen: string
  status: GameStatus
  history: MoveRecord[]
  lastMove: Move | null
  selected: Square | null
  /** Legal moves for the selected piece. Empty when nothing is selected. */
  movesFromSelection: Move[]
  pendingPromotion: PendingPromotion | null
  canUndo: boolean
  canRedo: boolean
  difficulty: Difficulty
  thinking: boolean
}

type Listener = () => void

export interface GameStore {
  subscribe: (listener: Listener) => () => void
  getSnapshot: () => GameSnapshot
  /** Select a piece, play a move to a highlighted square, or clear the selection. */
  chooseSquare: (square: Square) => void
  /** Completes a promotion that chooseSquare paused for a piece choice. */
  confirmPromotion: (piece: PieceType) => void
  cancelPromotion: () => void
  undo: () => void
  redo: () => void
  reset: (fen?: string) => void
  setDifficulty: (difficulty: Difficulty) => void
}

export interface GameStoreOptions {
  /** When set, this chooses Black's reply after White moves. */
  chooseMove?: (context: MoveContext) => Promise<string | null>
  /** How long a fast reply stays on screen as thinking, in milliseconds. */
  pauseMs?: number
}

export function createGameStore(game: GameApi, options: GameStoreOptions = {}): GameStore {
  const listeners = new Set<Listener>()
  const chooseMove = options.chooseMove
  const pauseMs = options.pauseMs ?? 0
  let selected: Square | null = null
  let pendingPromotion: PendingPromotion | null = null
  let difficulty: Difficulty = 'medium'
  let thinking = false
  let request = 0
  let snapshot = capture()

  function capture(): GameSnapshot {
    return {
      position: clonePosition(game.position()),
      turn: game.turn(),
      fen: game.fen(),
      status: game.status(),
      history: game.history(),
      lastMove: game.lastMove(),
      selected,
      movesFromSelection: selected === null ? [] : game.legalMovesFrom(selected),
      pendingPromotion,
      canUndo: game.canUndo(),
      canRedo: game.canRedo(),
      difficulty,
      thinking,
    }
  }

  function publish(): void {
    snapshot = capture()
    for (const listener of listeners) listener()
  }

  function subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  function chooseSquare(square: Square): void {
    if (thinking || game.status().outcome !== 'playing') return
    if (chooseMove !== undefined && game.turn() !== WHITE) return

    const hadPendingPromotion = pendingPromotion !== null
    pendingPromotion = null

    if (selected !== null) {
      const move = game.legalMovesFrom(selected).find((candidate) => candidate.to === square)
      if (move !== undefined) {
        if (isPromotion(move)) {
          pendingPromotion = { from: selected, to: square }
          publish()
          return
        }
        game.move(selected, square)
        selected = null
        publish()
        void replyForBlack()
        return
      }

      if (square === selected) {
        selected = null
        publish()
        return
      }
    }

    const piece = game.position().board[square]
    if (piece !== EMPTY && isColor(piece, game.turn())) {
      if (square === selected && !hadPendingPromotion) return
      selected = square
      publish()
      return
    }

    if (selected !== null || hadPendingPromotion) {
      selected = null
      publish()
    }
  }

  function confirmPromotion(piece: PieceType): void {
    if (thinking || pendingPromotion === null || game.status().outcome !== 'playing') return
    const { from, to } = pendingPromotion
    game.move(from, to, piece)
    selected = null
    pendingPromotion = null
    publish()
    void replyForBlack()
  }

  function cancelPromotion(): void {
    if (pendingPromotion === null) return
    pendingPromotion = null
    publish()
  }

  function undo(): void {
    const wasThinking = thinking
    cancelReply()
    if (!game.undo() && !wasThinking) return
    selected = null
    pendingPromotion = null
    publish()
  }

  function redo(): void {
    const wasThinking = thinking
    cancelReply()
    if (!game.redo() && !wasThinking) return
    selected = null
    pendingPromotion = null
    publish()
  }

  function reset(fen?: string): void {
    cancelReply()
    game.reset(fen)
    selected = null
    pendingPromotion = null
    publish()
  }

  function setDifficulty(next: Difficulty): void {
    if (difficulty === next) return
    difficulty = next
    publish()
  }

  function cancelReply(): void {
    request += 1
    thinking = false
  }

  async function replyForBlack(): Promise<void> {
    if (chooseMove === undefined) return
    if (game.turn() !== BLACK || game.status().outcome !== 'playing') return

    const id = request + 1
    request = id
    thinking = true
    selected = null
    pendingPromotion = null
    publish()

    try {
      const context = buildMoveContext(game, difficulty)
      const started = Date.now()
      const answer = await chooseMove(context)
      if (id !== request) return
      const remaining = pauseMs - (Date.now() - started)
      if (remaining > 0) await wait(remaining)
      if (id !== request) return
      if (game.turn() === BLACK && game.status().outcome === 'playing') {
        acceptReply(game, answer ?? '')
      }
    } finally {
      if (id === request) {
        thinking = false
        publish()
      }
    }
  }

  return {
    subscribe,
    getSnapshot: () => snapshot,
    chooseSquare,
    confirmPromotion,
    cancelPromotion,
    undo,
    redo,
    reset,
    setDifficulty,
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function useGameStore(store: GameStore): GameSnapshot {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
}
