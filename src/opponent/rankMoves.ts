/**
 * Cheap move ordering for the local model.
 *
 * llama3.2 is not a chess engine, so the prompt lists stronger-looking legal
 * moves first (checks, captures, development) and the fallback picks that way
 * too when the model returns nothing usable.
 */

const PIECE_VALUE: Record<string, number> = {
  P: 100,
  N: 320,
  B: 330,
  R: 500,
  Q: 900,
  K: 0,
}

/** Higher is more attractive for a serious reply. */
export function scoreSan(san: string): number {
  const body = san.replace(/[+#]/g, '')
  let score = 0

  if (san.includes('#')) score += 100_000
  else if (san.includes('+')) score += 8_000

  if (body.includes('x')) score += 400 + captureBonus(body)

  if (body.startsWith('O-O-O')) score += 280
  else if (body.startsWith('O-O')) score += 300

  if (/=Q/.test(body)) score += 850
  else if (/=R/.test(body)) score += 450
  else if (/=N/.test(body) || /=B/.test(body)) score += 300

  const piece = mover(body)
  const dest = destination(body)
  if (dest !== null) score += centerBonus(dest)

  if (piece === 'N' || piece === 'B') score += 90
  if (piece === 'P' && (body === 'e4' || body === 'd4' || body === 'e5' || body === 'd5')) score += 150
  else if (piece === 'P' && (body === 'c4' || body === 'c5')) score += 110

  // Soft penalties for common early weak moves.
  if (/^[Nah]3$/.test(body) || /^[Nah]6$/.test(body)) score -= 80
  if (body === 'f3' || body === 'f6' || body === 'f4' || body === 'f5') score -= 40
  if (piece === 'Q' && !body.includes('x') && !san.includes('+')) score -= 50

  return score
}

/** Best first. Equal scores keep alphabetical order for stability. */
export function rankSans(moves: readonly string[]): string[] {
  return [...moves].sort((a, b) => {
    const diff = scoreSan(b) - scoreSan(a)
    if (diff !== 0) return diff
    return a < b ? -1 : a > b ? 1 : 0
  })
}

function mover(body: string): string {
  if (body.startsWith('O-O')) return 'K'
  const letter = body[0]
  if (letter !== undefined && 'NBRQK'.includes(letter)) return letter
  return 'P'
}

function destination(body: string): string | null {
  if (body.startsWith('O-O')) return null
  const match = /([a-h][1-8])(?:=[NBRQ])?$/.exec(body)
  return match?.[1] ?? null
}

function centerBonus(square: string): number {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0)
  const rank = square.charCodeAt(1) - '1'.charCodeAt(0)
  const fileDist = Math.min(file, 7 - file)
  const rankDist = Math.min(rank, 7 - rank)
  if (fileDist >= 2 && rankDist >= 2 && file >= 2 && file <= 5 && rank >= 2 && rank <= 5) return 40
  if (file >= 2 && file <= 5 && rank >= 2 && rank <= 5) return 20
  return 0
}

function captureBonus(body: string): number {
  // SAN does not name the captured piece; prefer capturing with a cheaper unit.
  const attacker = mover(body)
  return Math.max(0, 200 - (PIECE_VALUE[attacker] ?? 100) / 4)
}
