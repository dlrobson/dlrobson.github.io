export interface Zone {
  plant: string
  row: number
  col: number
  rowSpan: number
  colSpan: number
}

/**
 * Given a 2D grid of plant names, returns a flat list of rectangular zones.
 * Uses a greedy top-left scan: for each unvisited cell, extends right as far
 * as the same plant name continues, then extends down as many rows as that
 * full horizontal span holds.
 */
export function detectZones(grid: string[][]): Zone[] {
  if (grid.length === 0 || grid[0].length === 0) return []

  const rows = grid.length
  const cols = grid[0].length
  const visited: boolean[][] = Array.from({ length: rows }, () =>
    new Array(cols).fill(false),
  )
  const zones: Zone[] = []

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (visited[row][col]) continue

      const plant = grid[row][col]

      // Extend right — stop at already-visited cells
      let colSpan = 1
      while (
        col + colSpan < cols &&
        grid[row][col + colSpan] === plant &&
        !visited[row][col + colSpan]
      ) {
        colSpan++
      }

      // Extend down — only if the full horizontal span matches and is unvisited
      let rowSpan = 1
      outer: while (row + rowSpan < rows) {
        for (let c = col; c < col + colSpan; c++) {
          if (grid[row + rowSpan][c] !== plant || visited[row + rowSpan][c])
            break outer
        }
        rowSpan++
      }

      // Mark all covered cells visited
      for (let r = row; r < row + rowSpan; r++) {
        for (let c = col; c < col + colSpan; c++) {
          visited[r][c] = true
        }
      }

      zones.push({ plant, row, col, rowSpan, colSpan })
    }
  }

  return zones
}
