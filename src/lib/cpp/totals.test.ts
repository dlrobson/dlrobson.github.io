import { describe, expect, it } from 'vitest'
import { crossingText, startAgeRows, totalsRows } from './totals'

const MONTHLY = [
  { age: 60, monthly: 800, annual: 9600 },
  { age: 65, monthly: 1116.4, annual: 13396.8 },
  { age: 70, monthly: 1562.96, annual: 18755.52 },
]

describe('startAgeRows', () => {
  it('fills the track with the largest amount', () => {
    const rows = startAgeRows(MONTHLY)
    expect(rows.at(-1)?.width).toBe(100)
    expect(rows[0].width).toBeCloseTo((800 / 1562.96) * 100, 9)
  })

  it('leaves the amounts and the annual figures alone', () => {
    const [row] = startAgeRows(MONTHLY)
    expect(row).toMatchObject(MONTHLY[0])
  })

  it('leaves every bar empty when nothing pays', () => {
    const rows = startAgeRows(MONTHLY.map((row) => ({ ...row, monthly: 0 })))
    expect(rows.every((row) => row.width === 0)).toBe(true)
  })
})

describe('totalsRows', () => {
  const ROWS = MONTHLY.map(({ age, monthly }) => ({ age, monthly }))

  it('totals each start age to the end age', () => {
    const rows = totalsRows(ROWS, 95, [60, 65, 70], 65)
    const at70 = rows.find((row) => row.age === 70)
    expect(at70?.total).toBeCloseTo(12 * 1562.96 * (95 - 70), 6)
  })

  it('marks the reader start age heaviest and draws it last', () => {
    const rows = totalsRows(ROWS, 95, [60, 65, 70], 65)
    expect(rows.map((row) => row.emphasis)).toEqual([1, 1, 2])
    expect(rows.at(-1)?.age).toBe(65)
  })

  it('gives an age that is neither labelled nor chosen no emphasis', () => {
    const [row] = totalsRows([{ age: 62, monthly: 900 }], 95, [60, 70], 65)
    expect(row.emphasis).toBe(0)
  })

  it('keeps a line for an age that gets no label', () => {
    const rows = totalsRows(ROWS, 95, [60, 70], 65)
    expect(rows.map((row) => row.age).sort()).toEqual([60, 65, 70])
  })
})

describe('crossingText', () => {
  it('names the two start ages and the age one overtakes', () => {
    expect(crossingText([{ a: 60, b: 65, age: 73.4, inRange: true }], 95)).toBe(
      'With these inputs, 65 pulls ahead of 60 at about 73.',
    )
  })

  it('joins two crossings with and', () => {
    expect(
      crossingText(
        [
          { a: 60, b: 65, age: 73.4, inRange: true },
          { a: 60, b: 70, age: 77.2, inRange: true },
        ],
        95,
      ),
    ).toBe(
      'With these inputs, 65 pulls ahead of 60 at about 73 and 70 pulls ahead of 60 at about 77.',
    )
  })

  it('puts a comma before the last of three', () => {
    expect(
      crossingText(
        [
          { a: 60, b: 65, age: 73.4, inRange: true },
          { a: 60, b: 70, age: 77.2, inRange: true },
          { a: 65, b: 70, age: 81.9, inRange: true },
        ],
        95,
      ),
    ).toBe(
      'With these inputs, 65 pulls ahead of 60 at about 73, 70 pulls ahead of 60 at about 77, and 70 pulls ahead of 65 at about 82.',
    )
  })

  it('drops a crossing that lands past the chart', () => {
    expect(crossingText([{ a: 60, b: 70, age: 120, inRange: false }], 95)).toBe(
      'With these inputs the later start does not pull ahead before age 95.',
    )
  })
})
