import { describe, expect, it } from 'vitest'
import { algebraicToSquare } from './board'
import { parseFen, toFen } from './fen'
import { generateLegalMoves } from './legal'
import { toSan } from './san'
import { BISHOP, KNIGHT, QUEEN, ROOK, type PieceType } from './types'

const sq = algebraicToSquare

function san(fen: string, from: string, to: string, promotion: PieceType | 0 = 0): string {
  const position = parseFen(fen)
  const move = generateLegalMoves(position).find(
    (candidate) => candidate.from === sq(from) && candidate.to === sq(to) && candidate.promotion === promotion,
  )
  if (move === undefined) throw new Error(`No move ${from}${to} in ${fen}`)
  const before = toFen(position)
  const text = toSan(position, move)
  expect(toFen(position)).toBe(before)
  return text
}

describe('toSan', () => {
  it('writes pawn moves, captures and en passant', () => {
    expect(san('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'e2', 'e4')).toBe('e4')
    expect(san('rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', 'e4', 'd5')).toBe('exd5')
    expect(san('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', 'e5', 'd6')).toBe('exd6')
  })

  it('writes piece moves and captures', () => {
    expect(san('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'g1', 'f3')).toBe('Nf3')
    expect(san('rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', 'e4', 'd5')).toBe('exd5')
    expect(san('4k3/8/8/3p4/8/4N3/8/4K3 w - - 0 1', 'e3', 'd5')).toBe('Nxd5')
  })

  it('writes both castles for both colours', () => {
    const open = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'
    expect(san(open, 'e1', 'g1')).toBe('O-O')
    expect(san(open, 'e1', 'c1')).toBe('O-O-O')
    const black = 'r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1'
    expect(san(black, 'e8', 'g8')).toBe('O-O')
    expect(san(black, 'e8', 'c8')).toBe('O-O-O')
  })

  it('writes promotions, including a capture', () => {
    const pawn = '8/P7/4k3/8/8/8/8/4K3 w - - 0 1'
    expect(san(pawn, 'a7', 'a8', QUEEN)).toBe('a8=Q')
    expect(san(pawn, 'a7', 'a8', ROOK)).toBe('a8=R')
    expect(san(pawn, 'a7', 'a8', BISHOP)).toBe('a8=B')
    expect(san(pawn, 'a7', 'a8', KNIGHT)).toBe('a8=N')
    expect(san('r7/1P2k3/8/8/8/8/8/4K3 w - - 0 1', 'b7', 'a8', QUEEN)).toBe('bxa8=Q')
  })

  it('disambiguates by file, by rank, and by both', () => {
    expect(san('4k3/8/8/8/8/2N1N3/8/4K3 w - - 0 1', 'c3', 'd5')).toBe('Ncd5')
    expect(san('4k3/8/8/8/8/2N1N3/8/4K3 w - - 0 1', 'e3', 'd5')).toBe('Ned5')
    expect(san('4k3/8/8/3p4/8/2N1N3/8/4K3 w - - 0 1', 'c3', 'd5')).toBe('Ncxd5')
    expect(san('k7/8/8/8/4R3/8/8/4R2K w - - 0 1', 'e1', 'e2')).toBe('R1e2')
    expect(san('k7/8/8/8/4R3/8/8/4R2K w - - 0 1', 'e4', 'e2')).toBe('R4e2')
    expect(san('8/7k/8/8/8/Q7/8/Q1Q4K w - - 0 1', 'a1', 'b2')).toBe('Qa1b2')
    expect(san('8/7k/8/8/8/Q7/8/Q1Q4K w - - 0 1', 'a3', 'b2')).toBe('Q3b2')
    expect(san('8/7k/8/8/8/Q7/8/Q1Q4K w - - 0 1', 'c1', 'b2')).toBe('Qcb2')
  })

  it('ignores a pinned piece that cannot share the square', () => {
    expect(san('4r2k/8/8/8/8/2N1N3/8/4K3 w - - 0 1', 'c3', 'd5')).toBe('Nd5')
  })

  it('marks check, mate, and a checking castle or promotion', () => {
    expect(san('4k3/8/8/8/8/8/8/3QK3 w - - 0 1', 'd1', 'e2')).toBe('Qe2+')
    expect(san('7k/Q7/6K1/8/8/8/8/8 w - - 0 1', 'a7', 'g7')).toBe('Qg7#')
    expect(san('5k2/8/8/8/8/8/8/R3K2R w KQ - 0 1', 'e1', 'g1')).toBe('O-O+')
    expect(san('3k4/8/8/8/8/8/8/R3K2R w KQ - 0 1', 'e1', 'c1')).toBe('O-O-O+')
    expect(san('7k/4P3/8/8/8/8/8/4K3 w - - 0 1', 'e7', 'e8', QUEEN)).toBe('e8=Q+')
    expect(san('7k/5P2/6K1/8/8/8/8/8 w - - 0 1', 'f7', 'f8', QUEEN)).toBe('f8=Q#')
  })
})
