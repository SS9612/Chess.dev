import { describe, expect, it } from 'vitest'
import { algebraicToSquare } from './board'
import { insufficientMaterial } from './draws'
import { parseFen } from './fen'
import { makeMove } from './makeMove'
import { generateMovesFrom } from './moves'
import { positionStatus } from './status'
import { WHITE } from './types'

const sq = algebraicToSquare

describe('insufficient material', () => {
  it('draws king against king, bishop or knight', () => {
    expect(insufficientMaterial(parseFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1').board)).toBe(true)
    expect(insufficientMaterial(parseFen('4k3/8/8/8/8/8/8/4KB2 w - - 0 1').board)).toBe(true)
    expect(insufficientMaterial(parseFen('4k3/8/8/8/8/8/8/4KN2 w - - 0 1').board)).toBe(true)
    expect(insufficientMaterial(parseFen('4k1n1/8/8/8/8/8/8/4K3 w - - 0 1').board)).toBe(true)
  })

  it('draws bishops that all stand on one colour', () => {
    expect(insufficientMaterial(parseFen('1b2k3/8/8/8/8/8/8/2B1K3 w - - 0 1').board)).toBe(true)
    expect(insufficientMaterial(parseFen('1b1b2k1/8/8/8/8/8/8/2B1K3 w - - 0 1').board)).toBe(true)
  })

  it('keeps positions where a mate is still possible', () => {
    expect(insufficientMaterial(parseFen('4k3/8/8/8/8/8/8/3NNK2 w - - 0 1').board)).toBe(false)
    expect(insufficientMaterial(parseFen('2b1k3/8/8/8/8/8/8/2B1K3 w - - 0 1').board)).toBe(false)
    expect(insufficientMaterial(parseFen('4k3/8/8/8/8/8/8/2BNK3 w - - 0 1').board)).toBe(false)
    expect(insufficientMaterial(parseFen('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1').board)).toBe(false)
    expect(insufficientMaterial(parseFen('4k3/8/8/8/8/8/8/4KR2 w - - 0 1').board)).toBe(false)
    expect(insufficientMaterial(parseFen('4k3/8/8/8/8/8/8/4KQ2 w - - 0 1').board)).toBe(false)
  })
})

describe('draw results', () => {
  it('draws on the hundredth ply without a pawn move or capture', () => {
    expect(positionStatus(parseFen('4k3/8/8/8/8/8/8/4KQ2 w - - 99 80')).outcome).toBe('playing')
    expect(positionStatus(parseFen('4k3/8/8/8/8/8/8/4KQ2 w - - 100 80'))).toMatchObject({
      outcome: 'draw',
      drawReason: 'fifty-move',
      inCheck: false,
    })
  })

  it('draws a repeated position on the third occurrence', () => {
    const position = parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    const history = [position.key]
    const cycle = [
      ['g1', 'f3'],
      ['g8', 'f6'],
      ['f3', 'g1'],
      ['f6', 'g8'],
    ] as const

    for (const [from, to] of cycle) {
      const move = generateMovesFrom(position, sq(from)).find((candidate) => candidate.to === sq(to))
      if (move === undefined) throw new Error(`missing ${from}${to}`)
      makeMove(position, move)
      history.push(position.key)
    }
    expect(positionStatus(position, history).outcome).toBe('playing')

    for (const [from, to] of cycle) {
      const move = generateMovesFrom(position, sq(from)).find((candidate) => candidate.to === sq(to))
      if (move === undefined) throw new Error(`missing ${from}${to}`)
      makeMove(position, move)
      history.push(position.key)
    }
    expect(positionStatus(position, history)).toMatchObject({
      outcome: 'draw',
      drawReason: 'threefold-repetition',
    })
  })

  it('reports checkmate ahead of the clock and the repetition history', () => {
    const position = parseFen('7k/6Q1/6K1/8/8/8/8/8 b - - 100 80')
    expect(positionStatus(position, [position.key, position.key, position.key])).toMatchObject({
      outcome: 'checkmate',
      drawReason: null,
      winner: WHITE,
    })
  })

  it('reports stalemate ahead of the fifty-move rule', () => {
    expect(positionStatus(parseFen('7k/5Q2/6K1/8/8/8/8/8 b - - 100 80')).outcome).toBe('stalemate')
  })

  it('reports dead material ahead of the clock', () => {
    expect(positionStatus(parseFen('4k3/8/8/8/8/8/8/4K3 w - - 100 80')).drawReason).toBe(
      'insufficient-material',
    )
  })

  it('keeps the check flag on a draw', () => {
    expect(positionStatus(parseFen('4k3/8/3N4/8/8/8/8/4K3 b - - 0 1'))).toMatchObject({
      outcome: 'draw',
      drawReason: 'insufficient-material',
      inCheck: true,
      checkSquare: sq('e8'),
    })
  })
})
