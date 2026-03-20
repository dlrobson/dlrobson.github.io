import { describe, it, expect } from 'vitest'
import { detectZones } from './detectZones'
import type { Zone } from './detectZones'

// Helper: given zones, collect all (row, col) pairs they cover
function coveredCells(zones: Zone[], rows: number, cols: number): boolean[][] {
  const covered: boolean[][] = Array.from({ length: rows }, () =>
    new Array(cols).fill(false),
  )
  for (const z of zones) {
    for (let r = z.row; r < z.row + z.rowSpan; r++) {
      for (let c = z.col; c < z.col + z.colSpan; c++) {
        covered[r][c] = true
      }
    }
  }
  return covered
}

function allCellsCovered(zones: Zone[], rows: number, cols: number): boolean {
  const covered = coveredCells(zones, rows, cols)
  return covered.every((row) => row.every((cell) => cell))
}

function noOverlap(zones: Zone[]): boolean {
  const seen = new Set<string>()
  for (const z of zones) {
    for (let r = z.row; r < z.row + z.rowSpan; r++) {
      for (let c = z.col; c < z.col + z.colSpan; c++) {
        const key = `${r},${c}`
        if (seen.has(key)) return false
        seen.add(key)
      }
    }
  }
  return true
}

describe('detectZones', () => {
  describe('single cell grid returns one zone', () => {
    it('returns one zone with rowSpan=1 colSpan=1', () => {
      const zones = detectZones([['Kale']])
      expect(zones).toHaveLength(1)
      expect(zones[0]).toEqual({
        plant: 'Kale',
        row: 0,
        col: 0,
        rowSpan: 1,
        colSpan: 1,
      })
    })
  })

  describe('horizontal strip is detected as one zone', () => {
    it('returns one zone spanning all four columns', () => {
      const zones = detectZones([['Peas', 'Peas', 'Peas', 'Peas']])
      expect(zones).toHaveLength(1)
      expect(zones[0]).toEqual({
        plant: 'Peas',
        row: 0,
        col: 0,
        rowSpan: 1,
        colSpan: 4,
      })
    })
  })

  describe('vertical strip is detected as one zone', () => {
    it('returns one zone spanning all four rows', () => {
      const zones = detectZones([
        ['Nasturtiums'],
        ['Nasturtiums'],
        ['Nasturtiums'],
        ['Nasturtiums'],
      ])
      expect(zones).toHaveLength(1)
      expect(zones[0]).toEqual({
        plant: 'Nasturtiums',
        row: 0,
        col: 0,
        rowSpan: 4,
        colSpan: 1,
      })
    })
  })

  describe('filled rectangle is detected as one zone', () => {
    it('returns one zone for a 3x4 block', () => {
      const grid = [
        ['Garlic', 'Garlic', 'Garlic'],
        ['Garlic', 'Garlic', 'Garlic'],
        ['Garlic', 'Garlic', 'Garlic'],
        ['Garlic', 'Garlic', 'Garlic'],
      ]
      const zones = detectZones(grid)
      expect(zones).toHaveLength(1)
      expect(zones[0]).toEqual({
        plant: 'Garlic',
        row: 0,
        col: 0,
        rowSpan: 4,
        colSpan: 3,
      })
    })
  })

  describe('multiple distinct rectangular zones', () => {
    it('returns the correct zone for each region', () => {
      const grid = [
        ['Peas', 'Peas', 'Garlic'],
        ['Kale', 'Kale', 'Garlic'],
        ['Kale', 'Kale', 'Garlic'],
      ]
      const zones = detectZones(grid)
      expect(zones).toHaveLength(3)

      const peas = zones.find((z) => z.plant === 'Peas')
      expect(peas).toEqual({
        plant: 'Peas',
        row: 0,
        col: 0,
        rowSpan: 1,
        colSpan: 2,
      })

      const garlic = zones.find((z) => z.plant === 'Garlic')
      expect(garlic).toEqual({
        plant: 'Garlic',
        row: 0,
        col: 2,
        rowSpan: 3,
        colSpan: 1,
      })

      const kale = zones.find((z) => z.plant === 'Kale')
      expect(kale).toEqual({
        plant: 'Kale',
        row: 1,
        col: 0,
        rowSpan: 2,
        colSpan: 2,
      })
    })
  })

  describe('L-shaped region is split into rectangles', () => {
    it('covers all L-shaped cells across multiple zones without overlap', () => {
      //   A A B
      //   A C C
      const grid = [
        ['A', 'A', 'B'],
        ['A', 'C', 'C'],
      ]
      const zones = detectZones(grid)
      expect(allCellsCovered(zones, 2, 3)).toBe(true)
      expect(noOverlap(zones)).toBe(true)

      // A appears in (0,0),(0,1),(1,0) — L-shape, so must be split
      const aZones = zones.filter((z) => z.plant === 'A')
      expect(aZones.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('full coverage invariant', () => {
    it('all zones together cover every cell exactly once for a uniform grid', () => {
      const grid = [
        ['X', 'X', 'Y'],
        ['Z', 'Y', 'Y'],
        ['Z', 'Z', 'Y'],
      ]
      const zones = detectZones(grid)
      expect(allCellsCovered(zones, 3, 3)).toBe(true)
      expect(noOverlap(zones)).toBe(true)
    })
  })

  describe('empty grid', () => {
    it('returns empty array for empty rows', () => {
      expect(detectZones([])).toEqual([])
    })

    it('returns empty array for empty columns', () => {
      expect(detectZones([[]])).toEqual([])
    })
  })

  describe('initial planting 8x4 garden grid snapshot', () => {
    const INITIAL_GRID = [
      [
        'Trellis Peas',
        'Trellis Peas',
        'Trellis Peas',
        'Trellis Peas',
        'Nasturtiums',
        'Garlic',
        'Garlic',
        'Garlic',
      ],
      [
        'Kale + Dill',
        'Kale + Dill',
        'Zucchini + Radish',
        'Zucchini + Radish',
        'Nasturtiums',
        'Garlic',
        'Garlic',
        'Garlic',
      ],
      [
        'Kale + Dill',
        'Kale + Dill',
        'Zucchini + Radish',
        'Zucchini + Radish',
        'Nasturtiums',
        'Garlic',
        'Garlic',
        'Garlic',
      ],
      [
        'Kale + Dill',
        'Kale + Dill',
        'Chives',
        'Chives',
        'Nasturtiums',
        'Garlic',
        'Garlic',
        'Garlic',
      ],
    ]

    it('covers all 32 cells exactly once', () => {
      const zones = detectZones(INITIAL_GRID)
      expect(allCellsCovered(zones, 4, 8)).toBe(true)
      expect(noOverlap(zones)).toBe(true)
    })

    it('detects Trellis Peas as a 4x1 zone', () => {
      const zones = detectZones(INITIAL_GRID)
      const peas = zones.find((z) => z.plant === 'Trellis Peas')
      expect(peas).toEqual({
        plant: 'Trellis Peas',
        row: 0,
        col: 0,
        rowSpan: 1,
        colSpan: 4,
      })
    })

    it('detects Nasturtiums as a 1x4 zone', () => {
      const zones = detectZones(INITIAL_GRID)
      const nast = zones.find((z) => z.plant === 'Nasturtiums')
      expect(nast).toEqual({
        plant: 'Nasturtiums',
        row: 0,
        col: 4,
        rowSpan: 4,
        colSpan: 1,
      })
    })

    it('detects Garlic as a 3x4 zone', () => {
      const zones = detectZones(INITIAL_GRID)
      const garlic = zones.find((z) => z.plant === 'Garlic')
      expect(garlic).toEqual({
        plant: 'Garlic',
        row: 0,
        col: 5,
        rowSpan: 4,
        colSpan: 3,
      })
    })

    it('detects Kale + Dill as a 2x3 zone', () => {
      const zones = detectZones(INITIAL_GRID)
      const kale = zones.find((z) => z.plant === 'Kale + Dill')
      expect(kale).toEqual({
        plant: 'Kale + Dill',
        row: 1,
        col: 0,
        rowSpan: 3,
        colSpan: 2,
      })
    })

    it('detects Zucchini + Radish as a 2x2 zone', () => {
      const zones = detectZones(INITIAL_GRID)
      const zuc = zones.find((z) => z.plant === 'Zucchini + Radish')
      expect(zuc).toEqual({
        plant: 'Zucchini + Radish',
        row: 1,
        col: 2,
        rowSpan: 2,
        colSpan: 2,
      })
    })

    it('detects Chives as a 2x1 zone', () => {
      const zones = detectZones(INITIAL_GRID)
      const chives = zones.find((z) => z.plant === 'Chives')
      expect(chives).toEqual({
        plant: 'Chives',
        row: 3,
        col: 2,
        rowSpan: 1,
        colSpan: 2,
      })
    })
  })

  describe('post-garlic 8x4 garden grid snapshot', () => {
    const POST_GARLIC_GRID = [
      [
        'Trellis Peas',
        'Trellis Peas',
        'Trellis Peas',
        'Trellis Peas',
        'Nasturtiums',
        'Bush Peas',
        'Bush Peas',
        'Bush Peas',
      ],
      [
        'Kale + Dill',
        'Kale + Dill',
        'Zucchini + Radish',
        'Zucchini + Radish',
        'Nasturtiums',
        'Bok Choy',
        'Bok Choy',
        'Bok Choy',
      ],
      [
        'Kale + Dill',
        'Kale + Dill',
        'Zucchini + Radish',
        'Zucchini + Radish',
        'Nasturtiums',
        'Carrots',
        'Carrots',
        'Carrots',
      ],
      [
        'Kale + Dill',
        'Kale + Dill',
        'Chives',
        'Chives',
        'Nasturtiums',
        'Carrots',
        'Carrots',
        'Carrots',
      ],
    ]

    it('covers all 32 cells exactly once', () => {
      const zones = detectZones(POST_GARLIC_GRID)
      expect(allCellsCovered(zones, 4, 8)).toBe(true)
      expect(noOverlap(zones)).toBe(true)
    })

    it('detects Carrots as a 3x2 zone', () => {
      const zones = detectZones(POST_GARLIC_GRID)
      const carrots = zones.find((z) => z.plant === 'Carrots')
      expect(carrots).toEqual({
        plant: 'Carrots',
        row: 2,
        col: 5,
        rowSpan: 2,
        colSpan: 3,
      })
    })
  })
})
