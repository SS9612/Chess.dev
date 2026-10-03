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
import type { Color, Move, PieceType, Square } from '../engine/types'
import { EMPTY, isColor, isPromotion } from '../engine/types'

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
}

export function createGameStore(game: GameApi): GameStore {
  const listeners = new Set<Listener>()
  let selected: Square | null = null
  let pendingPromotion: PendingPromotion | null = null
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
    if (game.status().outcome !== 'playing') return

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
    if (pendingPromotion === null || game.status().outcome !== 'playing') return
    const { from, to } = pendingPromotion
    game.move(from, to, piece)
    selected = null
    pendingPromotion = null
    publish()
  }

  function cancelPromotion(): void {
    if (pendingPromotion === null) return
    pendingPromotion = null
    publish()
  }

  function undo(): void {
    if (!game.undo()) return
    selected = null
    pendingPromotion = null
    publish()
  }

  function redo(): void {
    if (!game.redo()) return
    selected = null
    pendingPromotion = null
    publish()
  }

  function reset(fen?: string): void {
    game.reset(fen)
    selected = null
    pendingPromotion = null
    publish()
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
  }
}

export function useGameStore(store: GameStore): GameSnapshot {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
}
