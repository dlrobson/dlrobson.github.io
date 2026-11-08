<script lang="ts">
  interface Row {
    readonly age: number
    readonly total: number
    /** 2 for the reader's start age, 1 for a labelled anchor, 0 for the rest. */
    readonly emphasis: number
  }

  interface Crossing {
    readonly age: number
    readonly total: number
  }

  let {
    heading,
    title,
    description,
    caption,
    rows,
    labelRows,
    crossings,
    start,
    end,
    ageTicks,
    max,
  }: {
    heading: string
    title: string
    description: string
    caption: string
    rows: readonly Row[]
    labelRows: readonly Row[]
    crossings: readonly Crossing[]
    start: number
    end: number
    ageTicks: readonly number[]
    max: number
  } = $props()

  const WIDTH = 300
  const HEIGHT = 230
  const LEFT = 52
  const RIGHT = 272
  const TOP = 18
  const BOTTOM = 200

  const uid = $props.id()

  const compactMoney = new Intl.NumberFormat('en-CA', {
    notation: 'compact',
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 1,
  })

  function plotX(age: number): number {
    return LEFT + ((age - start) / (end - start)) * (RIGHT - LEFT)
  }

  function plotY(value: number): number {
    if (!(max > 0)) return BOTTOM
    return BOTTOM - (value / max) * (BOTTOM - TOP)
  }

  function niceStep(value: number): number {
    if (!(value > 0) || !Number.isFinite(value)) return 1
    const power = 10 ** Math.floor(Math.log10(value))
    const scaled = value / power
    const steps = [1, 2, 2.5, 5, 10]
    return (steps.find((step) => scaled <= step) ?? 10) * power
  }

  const yTicks = $derived.by(() => {
    if (!(max > 0)) return [0]
    const step = niceStep(max / 4)
    return Array.from(
      { length: Math.floor(max / step) + 1 },
      (_, index) => index * step,
    )
  })
</script>

<details class="totals">
  <summary>{heading}</summary>
  <figure>
    <svg
      class="totals-svg"
      viewBox="0 0 {WIDTH} {HEIGHT}"
      role="img"
      aria-labelledby="{uid}-title {uid}-desc"
    >
      <title id="{uid}-title">{title}</title>
      <desc id="{uid}-desc">{description}</desc>

      {#each yTicks as tick (tick)}
        {#if tick > 0}
          <line
            class="grid"
            x1={LEFT}
            x2={RIGHT}
            y1={plotY(tick)}
            y2={plotY(tick)}
          />
        {/if}
        <text class="tick" x={LEFT - 6} y={plotY(tick) + 4} text-anchor="end"
          >{compactMoney.format(tick)}</text
        >
      {/each}

      <line class="axis" x1={LEFT} x2={RIGHT} y1={BOTTOM} y2={BOTTOM} />
      <line class="axis" x1={LEFT} x2={LEFT} y1={TOP} y2={BOTTOM} />

      {#each ageTicks as age (age)}
        <text class="tick" x={plotX(age)} y={BOTTOM + 16} text-anchor="middle"
          >{age}</text
        >
      {/each}

      {#if max > 0}
        {#each rows as row (row.age)}
          <line
            class="line"
            class:prominent={row.emphasis === 1}
            class:selected={row.emphasis === 2}
            x1={plotX(row.age)}
            y1={BOTTOM}
            x2={plotX(end)}
            y2={plotY(row.total)}
          />
        {/each}

        {#each labelRows as row (row.age)}
          <text
            class="line-label"
            class:selected={row.emphasis === 2}
            x={RIGHT + 4}
            y={plotY(row.total) + 4}>{row.age}</text
          >
        {/each}

        {#each crossings as point (point.age)}
          {@const x = plotX(point.age)}
          {@const y = plotY(point.total)}
          <circle class="break-even-dot" cx={x} cy={y} r="3.5" />
          <text
            class="break-even-label"
            {x}
            y={Math.max(y - 7, TOP + 4)}
            text-anchor="middle">{Math.round(point.age)}</text
          >
        {/each}
      {/if}
    </svg>
    <figcaption>{caption}</figcaption>
  </figure>
</details>

<style>
  .totals {
    margin: var(--space-lg) 0 0;
  }

  summary {
    color: var(--primary-color);
    cursor: pointer;
    font-size: var(--font-sm);
  }

  .totals-svg {
    display: block;
    width: 100%;
    max-width: 440px;
    height: auto;
    margin: var(--space-md) auto 0;
  }

  .totals-svg text {
    fill: var(--secondary-color);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  .totals-svg .line-label {
    fill: var(--text-color);
    font-weight: 600;
  }

  .totals-svg .line-label.selected {
    fill: var(--primary-color);
  }

  .totals-svg .grid {
    stroke: var(--line-color);
    stroke-width: 1;
    stroke-opacity: 0.6;
  }

  .totals-svg .axis {
    stroke: var(--line-color);
    stroke-width: 1;
  }

  .totals-svg .line {
    stroke: var(--secondary-color);
    stroke-width: 1;
    stroke-opacity: 0.35;
    stroke-linecap: round;
  }

  .totals-svg .line.prominent {
    stroke-width: 2;
    stroke-opacity: 1;
  }

  .totals-svg .line.selected {
    stroke: var(--primary-color);
    stroke-width: 2.5;
    stroke-opacity: 1;
  }

  .totals-svg .break-even-dot {
    fill: var(--bg-surface);
    stroke: var(--primary-color);
    stroke-width: 2;
  }

  .totals-svg .break-even-label {
    fill: var(--primary-color);
    font-weight: 600;
    paint-order: stroke;
    stroke: var(--bg-surface);
    stroke-width: 3px;
    stroke-linejoin: round;
  }

  figcaption {
    margin-top: var(--space-sm);
    color: var(--secondary-color);
    font-size: var(--font-sm);
    line-height: 1.45;
  }
</style>
