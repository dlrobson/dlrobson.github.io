import { totalReceived } from './break-even'

/** One bar of the start-age chart. */
export interface StartAgeRow {
  readonly age: number
  readonly monthly: number
  readonly annual: number
  /** Share of the largest monthly amount, so the bars fill the track. */
  readonly width: number
}

/** One line of the totals chart. */
export interface TotalsRow {
  readonly age: number
  readonly total: number
  /** 2 for the reader's start age, 1 for a labelled age, 0 for the rest. */
  readonly emphasis: number
}

/** A start age with its monthly and annual amount already worked out. */
export interface MonthlyAtAge {
  readonly age: number
  readonly monthly: number
  readonly annual: number
}

/** Two start ages and the age at which the later one overtakes. */
export interface Crossing {
  readonly a: number
  readonly b: number
  readonly age: number
  readonly inRange: boolean
}

/**
 * The bar chart's rows: every start age's monthly amount, and its width as a
 * share of the largest so the longest bar fills the track.
 */
export function startAgeRows(
  rows: readonly MonthlyAtAge[],
): readonly StartAgeRow[] {
  const max = Math.max(0, ...rows.map((row) => row.monthly))
  return rows.map((row) => ({
    ...row,
    width: max > 0 ? (row.monthly / max) * 100 : 0,
  }))
}

/**
 * The totals chart's rows: what each start age has paid out by `endAge`, with
 * the reader's choice emphasised and drawn last so it sits on top. `labelAges`
 * names the ages worth a label; the rest still get a line.
 */
export function totalsRows(
  rows: readonly { readonly age: number; readonly monthly: number }[],
  endAge: number,
  labelAges: readonly number[],
  startAge: number,
): readonly TotalsRow[] {
  return rows
    .map((row) => ({
      age: row.age,
      total: totalReceived(row.monthly, row.age, endAge),
      emphasis: row.age === startAge ? 2 : labelAges.includes(row.age) ? 1 : 0,
    }))
    .sort((a, b) => a.emphasis - b.emphasis)
}

/** The sentence under a totals chart comparing several start ages. */
export function crossingText(
  crossings: readonly Crossing[],
  endAge: number,
): string {
  const shown = crossings.filter((crossing) => crossing.inRange)
  if (shown.length === 0) {
    return `With these inputs the later start does not pull ahead before age ${endAge}.`
  }
  const parts = shown.map(
    (crossing) =>
      `${crossing.b} pulls ahead of ${crossing.a} at about ${Math.round(crossing.age)}`,
  )
  const list =
    parts.length === 1
      ? parts[0]
      : parts.length === 2
        ? `${parts[0]} and ${parts[1]}`
        : `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`
  return `With these inputs, ${list}.`
}
