/**
 * Sanity-check: bundled Pro end = last program calendar day + 30 days,
 * equivalent to compact offset (programLength + 30 - 1) from enrollment start.
 * Run: node scripts/verify-program-pro-formula.mjs
 */
import { addDays, startOfDay } from 'date-fns'

function parseLocalDateKey(dateKey) {
  const [y, m, d] = dateKey.split('-').map((n) => Number(n))
  if (!y || !m || !d) return startOfDay(new Date())
  return startOfDay(new Date(y, m - 1, d))
}

function computeTwoStep(enrollmentStartDateKey, programLengthDays, continuationDays) {
  const start = parseLocalDateKey(enrollmentStartDateKey)
  const lastProgramCalendarDay = addDays(start, programLengthDays - 1)
  const lastProCalendarDay = addDays(lastProgramCalendarDay, continuationDays)
  const end = new Date(lastProCalendarDay)
  end.setHours(23, 59, 59, 999)
  return end.toISOString()
}

function computeCompact(enrollmentStartDateKey, programLengthDays, continuationDays) {
  const start = parseLocalDateKey(enrollmentStartDateKey)
  const lastDay = addDays(start, programLengthDays + continuationDays - 1)
  const end = new Date(lastDay)
  end.setHours(23, 59, 59, 999)
  return end.toISOString()
}

const CONT = 30
const cases = [
  ['2026-01-01', 30], // sprint_standard
  ['2026-03-10', 21], // sprint_monk
  ['2025-11-01', 56], // transform
  ['2024-02-29', 30], // leap nearby
]

let failed = false
for (const [startKey, L] of cases) {
  const a = computeTwoStep(startKey, L, CONT)
  const b = computeCompact(startKey, L, CONT)
  if (a !== b) {
    console.error('Mismatch:', { startKey, L, twoStep: a, compact: b })
    failed = true
  }
}

if (failed) {
  process.exit(1)
}

console.log(
  `verify-program-pro-formula: OK (${cases.length} cases; two-step === compact L+${CONT}-1 offset)`,
)
