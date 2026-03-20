<script lang="ts">
  import { detectZones } from '$lib/garden/detectZones'
  import { getPlantColor } from '$lib/garden/plantColors'

  interface Props {
    grid: string[][]
    border?: string[]
    rowLabels?: string[]
  }

  let { grid, border, rowLabels }: Props = $props()

  const cols = $derived(grid[0]?.length ?? 0)
  const zones = $derived(detectZones(grid))
  const uniquePlants = $derived([...new Set(zones.map((z) => z.plant))])

  // Column header labels: 1' through N'
  const colHeaders = $derived(
    Array.from({ length: cols }, (_, i) => `${i + 1}'`),
  )

  // Row labels default to 1' through N' if not provided
  const resolvedRowLabels = $derived(
    rowLabels ?? Array.from({ length: grid.length }, (_, i) => `${i + 1}'`),
  )

  // CSS grid template: first col is the row label column
  const gridTemplate = $derived(`repeat(${cols}, minmax(3.5rem, 1fr))`)
</script>

<div class="garden-grid-wrapper">
  <div class="garden-grid-scroll">
    <!-- Column headers -->
    <div
      class="garden-grid"
      style="display: grid; grid-template-columns: 4rem {gridTemplate};"
    >
      <!-- top-left corner spacer -->
      <div class="garden-cell header-corner"></div>
      {#each colHeaders as label (label)}
        <div class="garden-cell col-header">{label}</div>
      {/each}

      <!-- Border strip row -->
      {#if border}
        <div class="garden-cell row-header border-row-header">Border</div>
        {#each border as plant, i (i)}
          <div
            class="garden-cell border-cell"
            style="background-color: {getPlantColor(plant)};"
            title={plant}
          >
            <span class="cell-label">{plant}</span>
          </div>
        {/each}
      {/if}

      <!-- Zone cells — CSS grid-area positions each zone -->
      <!-- Row header column offset: zones are 1-indexed in CSS grid, +1 for the label column, +1 for border row if present -->
      <div
        class="zones-layer"
        style="grid-column: 2 / span {cols}; grid-row: {border
          ? 3
          : 2} / span {grid.length}; display: contents;"
      >
        {#each zones as zone (`${zone.row},${zone.col}`)}
          <div
            class="garden-cell zone-cell"
            style="
              grid-column: {zone.col + 2} / span {zone.colSpan};
              grid-row: {zone.row + (border ? 3 : 2)} / span {zone.rowSpan};
              background-color: {getPlantColor(zone.plant)};
            "
            title={zone.plant}
          >
            <span class="cell-label">{zone.plant}</span>
          </div>
        {/each}
      </div>

      <!-- Row header labels, one per row -->
      {#each resolvedRowLabels as label, i (i)}
        <div
          class="garden-cell row-header"
          style="grid-column: 1; grid-row: {i + (border ? 3 : 2)};"
        >
          {label}
        </div>
      {/each}
    </div>
  </div>

  <!-- Legend -->
  <div class="garden-legend">
    {#each uniquePlants as plant (plant)}
      <div class="legend-item">
        <span
          class="legend-swatch"
          style="background-color: {getPlantColor(plant)};"
        ></span>
        <span class="legend-label">{plant}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .garden-grid-wrapper {
    margin: var(--space-lg) 0;
    font-size: var(--font-sm);
  }

  .garden-grid-scroll {
    overflow-x: auto;
  }

  .garden-grid {
    border: 1px solid var(--line-color);
    border-radius: 4px;
    min-width: max-content;
  }

  .garden-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 0.25rem 0.3rem;
    border: 1px solid var(--line-color);
    min-height: 3.5rem;
  }

  .header-corner,
  .col-header {
    background: var(--bg-surface);
    color: var(--secondary-color);
    font-weight: 600;
    min-height: 1.75rem;
  }

  .row-header {
    background: var(--bg-surface);
    color: var(--secondary-color);
    font-weight: 600;
    font-size: 0.75em;
    min-height: 3.5rem;
  }

  .border-row-header {
    min-height: 1.5rem;
  }

  .border-cell {
    min-height: 1.5rem;
    opacity: 0.85;
  }

  .zone-cell {
    min-height: 3.5rem;
  }

  .cell-label {
    font-size: 0.7em;
    line-height: 1.2;
    word-break: break-word;
    hyphens: auto;
    color: #1a1a1a;
    font-weight: 500;
  }

  .garden-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem var(--space-lg);
    margin-top: var(--space-md);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .legend-swatch {
    display: inline-block;
    width: 0.85rem;
    height: 0.85rem;
    border-radius: 2px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    flex-shrink: 0;
  }

  .legend-label {
    color: var(--text-color);
    font-size: var(--font-sm);
  }
</style>
