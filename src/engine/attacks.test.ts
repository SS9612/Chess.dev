import { describe, expect, it } from 'vitest'
import { isSquareAttacked } from './attacks'
import { algebraicToSquare } from './board'
import { START_FEN, parseFen } from './fen'
import { BLACK, WHITE, type Color } from './types'

const sq = algebraicToSquare

function attacked(fen: string, square: string, byColor: Color): boolean {
  return isSquareAttacked(parseFen(fen).board, sq(square), byColor)
}

describe('isSquareAttacked', () => {
  it('is false when nothing bears on the square', () => {
    expect(attacked('8/8/8/8/8/8/8/8 w - - 0 1', 'e4', WHITE)).toBe(false)
    expect(attacked('8/8/8/8/8/8/8/8 w - - 0 1', 'e4', BLACK)).toBe(false)
  })

  it('is false for a square off the board', () => {
    expect(isSquareAttacked(parseFen(START_FEN).board, 8, WHITE)).toBe(false)
  })

  it('sees every knight leap and rejects a non-leap', () => {
    const fen = '8/8/8/8/4N3/8/8/4K3 w - - 0 1'
    for (const square of ['c3', 'c5', 'd2', 'd6', 'f2', 'f6', 'g3', 'g5']) {
      expect(attacked(fen, square, WHITE)).toBe(true)
    }
    expect(attacked(fen, 'd5', WHITE)).toBe(false)
    expect(attacked(fen, 'e5', WHITE)).toBe(false)
    expect(attacked(fen, 'd6', BLACK)).toBe(false)
  })

  it('does not let a knight wrap around the a-file', () => {
    expect(attacked('8/8/8/8/8/8/8/N7 w - - 0 1', 'b3', WHITE)).toBe(true)
    expect(attacked('8/8/8/8/8/8/8/N7 w - - 0 1', 'c2', WHITE)).toBe(true)
    expect(attacked('8/8/8/8/8/8/8/N7 w - - 0 1', 'h2', WHITE)).toBe(false)
  })

  it('sees a king on the adjacent squares only', () => {
    expect(attacked('8/8/8/8/8/8/8/K7 w - - 0 1', 'a2', WHITE)).toBe(true)
    expect(attacked('8/8/8/8/8/8/8/K7 w - - 0 1', 'b1', WHITE)).toBe(true)
    expect(attacked('8/8/8/8/8/8/8/K7 w - - 0 1', 'b2', WHITE)).toBe(true)
    expect(attacked('8/8/8/8/8/8/8/K7 w - - 0 1', 'a3', WHITE)).toBe(false)
    expect(attacked('8/8/8/8/8/8/8/K7 w - - 0 1', 'c2', WHITE)).toBe(false)
  })

  it('sees a rook along an open rank or file and stops at the first piece', () => {
    const fen = '8/8/8/8/p7/8/8/R7 w - - 0 1'
    expect(attacked(fen, 'a2', WHITE)).toBe(true)
    expect(attacked(fen, 'a3', WHITE)).toBe(true)
    expect(attacked(fen, 'a4', WHITE)).toBe(true)
    expect(attacked(fen, 'a5', WHITE)).toBe(false)
    expect(attacked(fen, 'b1', WHITE)).toBe(true)
    expect(attacked(fen, 'h1', WHITE)).toBe(true)
  })

  it('does not count a friendly blocker as an attack on the squares beyond it', () => {
    expect(attacked('8/8/8/8/8/P7/8/R7 w - - 0 1', 'a4', WHITE)).toBe(false)
    expect(attacked('8/8/8/8/8/P7/8/R7 w - - 0 1', 'a5', WHITE)).toBe(false)
    expect(attacked('8/8/8/8/8/P7/8/R7 w - - 0 1', 'a2', WHITE)).toBe(true)
  })

  it('sees a bishop and a queen on the diagonal', () => {
    expect(attacked('8/8/8/8/4B3/8/8/4K3 w - - 0 1', 'h7', WHITE)).toBe(true)
    expect(attacked('8/8/8/8/4B3/8/8/4K3 w - - 0 1', 'b1', WHITE)).toBe(true)
    expect(attacked('8/8/8/8/4B3/8/8/4K3 w - - 0 1', 'e5', WHITE)).toBe(false)
    expect(attacked('8/8/8/8/4Q3/8/8/4K3 w - - 0 1', 'e8', WHITE)).toBe(true)
    expect(attacked('8/8/8/8/4Q3/8/8/4K3 w - - 0 1', 'a8', WHITE)).toBe(true)
    expect(attacked('8/8/8/8/4Q3/8/8/4K3 w - - 0 1', 'h4', WHITE)).toBe(true)
  })

  it('keeps looking on other rays after a blocker', () => {
    expect(attacked('8/8/8/8/3R1p2/8/8/4K3 w - - 0 1', 'e4', WHITE)).toBe(true)
    expect(attacked('8/8/8/3p4/8/8/2B5/4K3 w - - 0 1', 'e4', WHITE)).toBe(true)
  })

  it('stops a queen at the first piece on the ray', () => {
    expect(attacked('4k3/8/8/4p3/8/8/8/4Q3 w - - 0 1', 'e5', WHITE)).toBe(true)
    expect(attacked('4k3/8/8/4p3/8/8/8/4Q3 w - - 0 1', 'e6', WHITE)).toBe(false)
    expect(attacked('4k3/8/8/4p3/8/8/8/4Q3 w - - 0 1', 'e8', WHITE)).toBe(false)
  })

  it('sees white pawn attacks one square diagonally forward', () => {
    const fen = '8/8/8/8/4P3/8/8/4K3 w - - 0 1'
    expect(attacked(fen, 'd5', WHITE)).toBe(true)
    expect(attacked(fen, 'f5', WHITE)).toBe(true)
    expect(attacked(fen, 'e5', WHITE)).toBe(false)
    expect(attacked(fen, 'd4', WHITE)).toBe(false)
    expect(attacked(fen, 'd3', WHITE)).toBe(false)
    expect(attacked(fen, 'd5', BLACK)).toBe(false)
  })

  it('sees black pawn attacks one square diagonally forward', () => {
    const fen = '4k3/8/8/4p3/8/8/8/8 w - - 0 1'
    expect(attacked(fen, 'd4', BLACK)).toBe(true)
    expect(attacked(fen, 'f4', BLACK)).toBe(true)
    expect(attacked(fen, 'e4', BLACK)).toBe(false)
    expect(attacked(fen, 'd6', BLACK)).toBe(false)
  })

  it('does not let a pawn wrap past the a-file or the h-file', () => {
    expect(attacked('8/8/8/8/8/8/P7/4K3 w - - 0 1', 'b3', WHITE)).toBe(true)
    expect(attacked('8/8/8/8/8/8/P7/4K3 w - - 0 1', 'h3', WHITE)).toBe(false)
    expect(attacked('4k3/7p/8/8/8/8/8/8 w - - 0 1', 'g6', BLACK)).toBe(true)
    expect(attacked('4k3/7p/8/8/8/8/8/8 w - - 0 1', 'a6', BLACK)).toBe(false)
  })

  it('leaves both kings unattacked in the starting position', () => {
    const board = parseFen(START_FEN).board
    expect(isSquareAttacked(board, sq('e1'), BLACK)).toBe(false)
    expect(isSquareAttacked(board, sq('e8'), WHITE)).toBe(false)
  })

  it('detects a king in check', () => {
    expect(attacked('4k3/4R3/8/8/8/8/8/4K3 w - - 0 1', 'e8', WHITE)).toBe(true)
    expect(attacked('4k3/8/8/8/8/8/4q3/4K3 w - - 0 1', 'e1', BLACK)).toBe(true)
  })
})
