<script lang="ts">
  import type { ChildRearingPeriod, EarningPeriod } from '$lib/cpp/estimator'
  import {
    SURFACE_SHARE_MAX,
    SURFACE_STOP_FIRST,
    SURFACE_STOP_LAST,
    SURFACE_STOP_STEP,
    pensionSurface,
  } from '$lib/cpp/surface'

  interface Props {
    birthYear: number
    claimAge: number
    cpi: number
    wageGrowth: number
    baseYear: number
    earningPeriods: readonly EarningPeriod[]
    childRearing: readonly ChildRearingPeriod[]
  }

  let {
    birthYear,
    claimAge,
    cpi,
    wageGrowth,
    baseYear,
    earningPeriods,
    childRearing,
  }: Props = $props()

  const WIDTH = 340
  const HEIGHT = 250
  const LEFT = 40
  const RIGHT = 330
  const TOP = 12
  const BOTTOM = 190
  const LEGEND_BASELINE = 240
  const MIN_SHADE = 8

  const X_TICKS = [0, 0.5, 1]
  const Y_TICKS = [18, 30, 42, 54, 66]
  const Y_LAST = SURFACE_STOP_LAST

  const money = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  })
  const percent = new Intl.NumberFormat('en-CA', {
    style: 'percent',
    maximumFractionDigits: 0,
  })

  const format = (value: number) => money.format(value)

  const lastPeriod = $derived.by(() => {
    let last: EarningPeriod | undefined
    for (const period of earningPeriods) {
      if (
        !last ||
        period.toAge > last.toAge ||
        (period.toAge === last.toAge && period.fromAge > last.fromAge)
      ) {
        last = period
      }
    }
    return last
  })

  const salary = $derived(lastPeriod?.salary ?? 0)
  const stoppedAge = $derived(lastPeriod?.toAge ?? SURFACE_STOP_LAST)

  const grid = $derived(
    pensionSurface({
      birthYear,
      claimAge,
      cpi,
      wageGrowth,
      baseYear,
      earningPeriods,
      childRearing,
    }),
  )

  const xFor = (share: number) =>
    LEFT + (share / SURFACE_SHARE_MAX) * (RIGHT - LEFT)

  const yFor = (age: number) =>
    TOP +
    ((age - SURFACE_STOP_FIRST) / (SURFACE_STOP_LAST - SURFACE_STOP_FIRST)) *
      (BOTTOM - TOP)

  /** Share of the primary colour a value earns, as a percentage. */
  const shade = (value: number) =>
    MIN_SHADE +
    Math.round(
      (100 - MIN_SHADE) * (grid.max > 0 ? Math.min(1, value / grid.max) : 0),
    )

  const paint = (value: number) =>
    `fill: color-mix(in srgb, var(--primary-color) ${shade(value)}%, var(--bg-surface))`

  const cells = $derived.by(() => {
    const columns = grid.shares.length - 1
    const edges = Array.from({ length: columns + 1 }, (_, index) =>
      Math.round(LEFT + (index / columns) * (RIGHT - LEFT)),
    )
    const rows = grid.stopAges.map((stopAge) =>
      Math.round(
        yFor(Math.max(SURFACE_STOP_FIRST, stopAge - SURFACE_STOP_STEP / 2)),
      ),
    )
    rows.push(Math.round(BOTTOM))

    const result = []
    for (let row = 0; row < grid.stopAges.length; row++) {
      for (let column = 0; column < columns; column++) {
        result.push({
          key: `${grid.stopAges[row]}-${grid.shares[column]}`,
          row,
          column,
          x: edges[column],
          y: rows[row],
          width: edges[column + 1] - edges[column],
          height: rows[row + 1] - rows[row],
          value: grid.values[row][column],
        })
      }
    }
    return result
  })

  let hover = $state<{ row: number; column: number } | null>(null)

  const hovered = $derived.by(() => {
    if (!hover) return null
    const cell = cells.find(
      (entry) => entry.row === hover?.row && entry.column === hover?.column,
    )
    if (!cell) return null
    return {
      ...cell,
      salary: grid.shares[cell.column] * grid.ceiling,
      stopAge: grid.stopAges[cell.row],
    }
  })

  const TIP_WIDTH = 100
  const TIP_HEIGHT = 44

  const tip = $derived.by(() => {
    if (!hovered) return null
    const width = Math.min(TIP_WIDTH, RIGHT - LEFT)
    const x = Math.min(
      Math.max(hovered.x + hovered.width / 2 - width / 2, LEFT + 2),
      RIGHT - width - 2,
    )
    const above = hovered.y - TIP_HEIGHT - 5
    const y = above >= TOP + 2 ? above : hovered.y + hovered.height + 5
    return { x, y, width }
  })

  function onmove(event: MouseEvent) {
    const bounds = (
      event.currentTarget as SVGSVGElement
    ).getBoundingClientRect()
    if (!(bounds.width > 0)) return
    const x = ((event.clientX - bounds.left) / bounds.width) * WIDTH
    const y = ((event.clientY - bounds.top) / bounds.height) * HEIGHT
    if (x < LEFT || x > RIGHT || y < TOP || y > BOTTOM) {
      hover = null
      return
    }
    const columns = grid.shares.length - 1
    const column = Math.min(
      columns - 1,
      Math.max(0, Math.floor(((x - LEFT) / (RIGHT - LEFT)) * columns)),
    )
    const age =
      SURFACE_STOP_FIRST +
      ((y - TOP) / (BOTTOM - TOP)) * (SURFACE_STOP_LAST - SURFACE_STOP_FIRST)
    const row = Math.min(
      grid.stopAges.length - 1,
      Math.max(0, Math.round((age - SURFACE_STOP_FIRST) / SURFACE_STOP_STEP)),
    )
    hover = { row, column }
  }

  const legendSteps = $derived.by(() => {
    const steps = 20
    return Array.from({ length: steps }, (_, index) => ({
      key: index,
      value: (index / (steps - 1)) * grid.max,
    }))
  })

  const markerX = $derived(
    xFor(
      grid.ceiling > 0
        ? Math.min(SURFACE_SHARE_MAX, Math.max(0, salary / grid.ceiling))
        : 0,
    ),
  )

  const markerY = $derived(
    yFor(Math.min(SURFACE_STOP_LAST, Math.max(SURFACE_STOP_FIRST, stoppedAge))),
  )

  /** Salary past which extra earnings stop adding to the pension. */
  const saturation = $derived.by(() => {
    const row = Math.round(
      (stoppedAge - SURFACE_STOP_FIRST) / SURFACE_STOP_STEP,
    )
    const values =
      grid.values[Math.min(grid.values.length - 1, Math.max(0, row))]
    if (!values) return undefined
    const highest = Math.max(...values)
    if (!(highest > 0)) return undefined
    const index = values.findIndex((value) => value >= highest - 0.5)
    return index > 0 && index < values.length - 1
      ? grid.shares[index] * grid.ceiling
      : undefined
  })

  const caption = $derived.by(() => {
    const flat = `Working past ${claimAge} does not change the estimate, because the pension counts earnings only up to the year you start.`
    const periodNote =
      earningPeriods.length > 1
        ? " The chart varies only the final earning period's salary."
        : ''
    if (saturation === undefined) return `${flat}${periodNote}`
    return `Extra salary adds nothing above about ${format(
      Math.round(saturation / 1000) * 1000,
    )} a year, and ${flat.charAt(0).toLowerCase()}${flat.slice(1)}${periodNote}`
  })
</script>

<figure class="surface">
  <svg
    class="surface-svg"
    viewBox="0 0 {WIDTH} {HEIGHT}"
    role="img"
    aria-labelledby="surface-title surface-desc"
    onmousemove={onmove}
    onmouseleave={() => (hover = null)}
  >
    <title id="surface-title"
      >Pension by final salary and the age work stops</title
    >
    <desc id="surface-desc">
      Monthly pension at {claimAge}, in today's dollars. {caption}
    </desc>

    {#each cells as cell (cell.key)}
      <rect
        class="cell"
        x={cell.x}
        y={cell.y}
        width={cell.width}
        height={cell.height}
        style={paint(cell.value)}
      />
    {/each}

    {#if hovered}
      <rect
        class="picked"
        x={hovered.x}
        y={hovered.y}
        width={hovered.width}
        height={hovered.height}
      />
    {/if}

    <line class="ceiling" x1={xFor(1)} x2={xFor(1)} y1={TOP} y2={BOTTOM} />

    <line class="axis" x1={LEFT} x2={RIGHT} y1={BOTTOM} y2={BOTTOM} />
    <line class="axis" x1={LEFT} x2={LEFT} y1={TOP} y2={BOTTOM} />

    {#each Y_TICKS as age (age)}
      <text class="tick" x={LEFT - 6} y={yFor(age) + 4} text-anchor="end">
        {age}
      </text>
    {/each}
    <text class="tick" x={LEFT - 6} y={BOTTOM + 4} text-anchor="end">
      {Y_LAST}
    </text>

    {#each X_TICKS as share (share)}
      <text
        class="tick"
        class:emphasis={share === 1}
        x={xFor(share)}
        y={BOTTOM + 15}
        text-anchor={share === 0 ? 'start' : 'middle'}
        >{percent.format(share)}</text
      >
      <text
        class="sub"
        class:emphasis={share === 1}
        x={xFor(share)}
        y={BOTTOM + 28}
        text-anchor={share === 0 ? 'start' : 'middle'}
        >{format(share * grid.ceiling)}</text
      >
    {/each}

    <circle class="marker-halo" cx={markerX} cy={markerY} r="5.5" />
    <circle class="marker" cx={markerX} cy={markerY} r="5.5" />

    {#if hovered && tip}
      <g class="tip">
        <rect
          x={tip.x}
          y={tip.y}
          width={tip.width}
          height={TIP_HEIGHT}
          rx="4"
        />
        <text x={tip.x + 7} y={tip.y + 14}>Stop at {hovered.stopAge}</text>
        <text x={tip.x + 7} y={tip.y + 26}>{format(hovered.salary)} salary</text
        >
        <text class="tip-value" x={tip.x + 7} y={tip.y + 38}
          >{format(hovered.value)} a month</text
        >
      </g>
    {/if}

    <text class="sub" x={LEFT + 20} y={LEGEND_BASELINE} text-anchor="end"
      >$0</text
    >
    {#each legendSteps as step (step.key)}
      <rect
        x={LEFT + 26 + step.key * 6.2}
        y={LEGEND_BASELINE - 7}
        width={6.6}
        height="7"
        style={paint(step.value)}
      />
    {/each}
    <text class="sub" x={LEFT + 158} y={LEGEND_BASELINE}>
      {format(grid.max)} a month
    </text>
  </svg>

  <figcaption>{caption}</figcaption>
</figure>

<style>
  .surface {
    margin: var(--space-md) 0 0;
  }

  .surface-svg {
    display: block;
    width: 100%;
    max-width: 440px;
    height: auto;
    margin: var(--space-sm) auto 0;
  }

  .surface-svg text {
    fill: var(--secondary-color);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  .surface-svg .sub {
    font-size: 10px;
  }

  .surface-svg .emphasis {
    fill: var(--text-color);
    font-weight: 600;
  }

  .surface-svg .picked {
    fill: none;
    pointer-events: none;
    stroke: var(--text-color);
    stroke-width: 1.5;
  }

  .surface-svg .tip {
    pointer-events: none;
  }

  .surface-svg .tip rect {
    fill: var(--bg-surface);
    stroke: var(--line-color);
    stroke-width: 1;
  }

  .surface-svg .tip text {
    fill: var(--secondary-color);
    font-size: 9px;
  }

  .surface-svg .tip .tip-value {
    fill: var(--text-color);
    font-weight: 600;
  }

  .surface-svg .axis {
    stroke: var(--line-color);
    stroke-width: 1;
  }

  .surface-svg .ceiling {
    stroke: var(--text-color);
    stroke-dasharray: 3 3;
    stroke-opacity: 0.3;
    stroke-width: 1;
  }

  .surface-svg .marker-halo {
    fill: none;
    stroke: var(--bg-surface);
    stroke-width: 4;
  }

  .surface-svg .marker {
    fill: none;
    stroke: var(--text-color);
    stroke-width: 2;
  }

  .surface-svg text,
  .surface-svg .axis,
  .surface-svg .ceiling,
  .surface-svg .marker,
  .surface-svg .marker-halo {
    pointer-events: none;
  }

  figcaption {
    margin-top: var(--space-sm);
    color: var(--secondary-color);
    font-size: var(--font-sm);
    line-height: 1.45;
  }
</style>
