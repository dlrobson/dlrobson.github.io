<script lang="ts">
  import { onMount } from 'svelte'
  import { CEILINGS, LAST_PUBLISHED_YEAR } from '$lib/cpp/params'
  import {
    CHILD_REARING_DEFAULT_START_AGE,
    CHILD_REARING_DEFAULT_YEARS,
    DEFAULT_CPI,
    DEFAULT_WAGE_GROWTH,
    applyChildRearing,
    childRearingWindows,
    defaultChildRearingPeriod,
    estimate,
    project,
    steadySalaryEarnings,
  } from '$lib/cpp/estimator'

  const BASE_YEAR = LAST_PUBLISHED_YEAR
  const CLAIM_AGES = Array.from({ length: 11 }, (_, index) => 60 + index)
  const money = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  })

  const DEFAULTS = {
    birthYear: 1990,
    salary: 70000,
    startedAge: 22,
    stoppedAge: 65,
    claimAge: 65,
    inflationText: (DEFAULT_CPI * 100).toFixed(2),
    wageGrowthText: (DEFAULT_WAGE_GROWTH * 100).toFixed(2),
  }

  const STORAGE_KEY = 'cpp-calculator:v1'

  interface SavedPeriod {
    from?: number
    to?: number
  }

  interface SavedState {
    birthYear?: number
    salary?: number
    startedAge?: number
    stoppedAge?: number
    claimAge?: number
    inflationText?: string
    wageGrowthText?: string
    periods?: SavedPeriod[]
  }

  interface PeriodRow {
    id: number
    from: number | undefined
    to: number | undefined
  }

  let nextPeriodId = 1

  let birthYear = $state<number | undefined>(DEFAULTS.birthYear)
  let salary = $state<number | undefined>(DEFAULTS.salary)
  let startedAge = $state<number | undefined>(DEFAULTS.startedAge)
  let stoppedAge = $state<number | undefined>(DEFAULTS.stoppedAge)
  let claimAge = $state<number | undefined>(DEFAULTS.claimAge)
  let inflationText = $state(DEFAULTS.inflationText)
  let wageGrowthText = $state(DEFAULTS.wageGrowthText)
  let periods = $state<PeriodRow[]>([])
  let hydrated = $state(false)

  onMount(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as Partial<SavedState>
        if (typeof saved.birthYear === 'number') birthYear = saved.birthYear
        if (typeof saved.salary === 'number') salary = saved.salary
        if (typeof saved.startedAge === 'number') startedAge = saved.startedAge
        if (typeof saved.stoppedAge === 'number') stoppedAge = saved.stoppedAge
        if (typeof saved.claimAge === 'number') claimAge = saved.claimAge
        if (typeof saved.inflationText === 'string') {
          inflationText = saved.inflationText
        }
        if (typeof saved.wageGrowthText === 'string') {
          wageGrowthText = saved.wageGrowthText
        }
        if (Array.isArray(saved.periods)) {
          periods = saved.periods.map((period) => ({
            id: nextPeriodId++,
            from: typeof period?.from === 'number' ? period.from : undefined,
            to: typeof period?.to === 'number' ? period.to : undefined,
          }))
        }
      }
    } catch {
      // Unreadable or unavailable storage: keep the defaults.
    }
    hydrated = true
  })

  $effect(() => {
    if (!hydrated) return
    const saved: SavedState = {
      birthYear,
      salary,
      startedAge,
      stoppedAge,
      claimAge,
      inflationText: normalizePercent(inflationText, DEFAULT_CPI * 100),
      wageGrowthText: normalizePercent(
        wageGrowthText,
        DEFAULT_WAGE_GROWTH * 100,
      ),
      periods: periods.map(({ from, to }) => ({ from, to })),
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    } catch {
      // Storage can be unavailable; the calculator still works without it.
    }
  })

  function whole(value: number | undefined, fallback: number): number {
    return value === undefined || !Number.isFinite(value)
      ? fallback
      : Math.round(value)
  }

  function clampRate(value: number): number {
    return Math.min(0.15, Math.max(-0.05, value))
  }

  function percentValue(text: string | undefined, fallback: number): number {
    const parsed = Number.parseFloat(
      (text ?? '').replace('%', '').replace(',', '.').trim(),
    )
    return Number.isFinite(parsed) ? parsed : fallback
  }

  function normalizePercent(
    text: string | undefined,
    fallback: number,
  ): string {
    return (clampRate(percentValue(text, fallback) / 100) * 100).toFixed(2)
  }

  function optionalYear(value: number | undefined): number | undefined {
    return value === undefined || !Number.isFinite(value)
      ? undefined
      : Math.round(value)
  }

  function stepClaim(delta: number) {
    claimAge = Math.min(70, Math.max(60, whole(claimAge, 65) + delta))
  }

  function addPeriod() {
    const birth = Math.min(
      2010,
      Math.max(1930, whole(birthYear, DEFAULTS.birthYear)),
    )
    periods = [
      ...periods,
      { id: nextPeriodId++, ...defaultChildRearingPeriod(birth) },
    ]
  }

  function removePeriod(id: number) {
    periods = periods.filter((period) => period.id !== id)
  }

  const model = $derived.by(() => {
    const birth = Math.min(2010, Math.max(1930, whole(birthYear, 1990)))
    const started = Math.min(70, Math.max(18, whole(startedAge, 22)))
    const stopped = Math.min(70, Math.max(started, whole(stoppedAge, 65)))
    const pay = Math.max(0, salary ?? 0)
    const claim = Math.min(70, Math.max(60, whole(claimAge, 65)))
    const cpi = clampRate(percentValue(inflationText, DEFAULT_CPI * 100) / 100)
    const growth = clampRate(
      percentValue(wageGrowthText, DEFAULT_WAGE_GROWTH * 100) / 100,
    )

    // The ceilings grow at the wage rate; the salary and the result deflator
    // use inflation, so the salary stays level in real terms.
    const ceilings = project(CEILINGS, birth + 71, growth)
    const carePeriods = periods
      .map((period) => ({
        from: optionalYear(period.from),
        to: optionalYear(period.to),
      }))
      .filter(
        (period): period is { from: number; to: number } =>
          period.from !== undefined && period.to !== undefined,
      )
    const windows = childRearingWindows(carePeriods)
    const periodError = carePeriods.some((period) => period.to < period.from)

    const salaryEarnings = steadySalaryEarnings(
      pay,
      started,
      stopped,
      birth,
      BASE_YEAR,
      cpi,
    )
    const earnings = applyChildRearing(salaryEarnings, carePeriods)
    const results = CLAIM_AGES.map((age) =>
      estimate(birth, age, earnings, ceilings, windows),
    )

    return {
      results,
      selected: results[claim - 60],
      claim,
      cpi,
      cpiPercent: (cpi * 100).toFixed(2),
      growthPercent: (growth * 100).toFixed(2),
      periods: windows,
      periodError,
    }
  })

  const chart = $derived.by(() => {
    const rows = model.results.map((result) => ({
      age: result.claimAge,
      monthly: result.monthlyIn(BASE_YEAR, model.cpi),
      annual: result.annualIn(BASE_YEAR, model.cpi),
    }))
    const max = Math.max(...rows.map((row) => row.monthly), 0)
    return rows.map((row) => ({
      ...row,
      width: max > 0 ? (row.monthly / max) * 100 : 0,
    }))
  })

  const format = (amount: number) => money.format(amount)
</script>

<div class="cpp-calculator">
  <div class="content" class:ready={hydrated}>
    <div class="fields">
      <label>
        <span>Year you were born</span>
        <input
          type="number"
          min="1930"
          max="2010"
          step="1"
          bind:value={birthYear}
        />
      </label>
      <label>
        <span>Annual salary (today's dollars)</span>
        <input type="number" min="0" step="1000" bind:value={salary} />
      </label>
      <label>
        <span>Age you started working</span>
        <input
          type="number"
          min="18"
          max="70"
          step="1"
          bind:value={startedAge}
        />
      </label>
      <label>
        <span>Age you stop working</span>
        <input
          type="number"
          min="18"
          max="70"
          step="1"
          bind:value={stoppedAge}
        />
      </label>
    </div>

    <div class="claim-age">
      <div class="claim-row">
        <label for="claim-age">Age you start CPP</label>
        <div class="stepper">
          <button
            type="button"
            onclick={() => stepClaim(-1)}
            disabled={model.claim <= 60}
            aria-label="One year earlier">−</button
          >
          <output for="claim-age">{model.claim}</output>
          <button
            type="button"
            onclick={() => stepClaim(1)}
            disabled={model.claim >= 70}
            aria-label="One year later">+</button
          >
        </div>
      </div>
      <input
        id="claim-age"
        type="range"
        min="60"
        max="70"
        step="1"
        bind:value={claimAge}
      />
    </div>

    <details class="assumptions">
      <summary>
        Assumptions and time off
        <span class="summary-value">
          {model.cpiPercent}% inflation · {model.growthPercent}% wage growth
          {#if model.periods.length === 1}
            · {model.periods[0][0]}–{model.periods[0][1]}
          {:else if model.periods.length > 1}
            · {model.periods.length} periods
          {/if}
        </span>
      </summary>

      <div class="assumptions-body">
        <div class="fields">
          <label>
            <span>Annual inflation (%)</span>
            <input
              type="text"
              inputmode="decimal"
              autocomplete="off"
              spellcheck="false"
              bind:value={inflationText}
              onblur={() =>
                (inflationText = normalizePercent(
                  inflationText,
                  DEFAULT_CPI * 100,
                ))}
            />
          </label>
          <label>
            <span>Annual wage growth (%)</span>
            <input
              type="text"
              inputmode="decimal"
              autocomplete="off"
              spellcheck="false"
              bind:value={wageGrowthText}
              onblur={() =>
                (wageGrowthText = normalizePercent(
                  wageGrowthText,
                  DEFAULT_WAGE_GROWTH * 100,
                ))}
            />
          </label>
        </div>

        <div class="child-care">
          <p class="section-label">Child-rearing years (optional)</p>
          {#each periods as period (period.id)}
            <div class="child-row">
              <label>
                <span>From year</span>
                <input
                  type="number"
                  min="1930"
                  max="2100"
                  step="1"
                  bind:value={period.from}
                />
              </label>
              <label>
                <span>To year</span>
                <input
                  type="number"
                  min="1930"
                  max="2100"
                  step="1"
                  bind:value={period.to}
                />
              </label>
              <button
                type="button"
                class="remove"
                onclick={() => removePeriod(period.id)}
                aria-label="Remove child-rearing period"
              >
                Remove
              </button>
            </div>
          {/each}
          <button type="button" class="add" onclick={addPeriod}>
            + Add child-rearing period
          </button>
          <p class="hint">
            New periods start at age {CHILD_REARING_DEFAULT_START_AGE} and last
            {CHILD_REARING_DEFAULT_YEARS} years. The estimate assumes no earnings
            during these years and applies the child-rearing provision.
          </p>
          {#if model.periodError}
            <p class="hint error">
              Each period's end year must be on or after its start year.
            </p>
          {/if}
        </div>
      </div>
    </details>

    <div class="result" aria-live="polite">
      <p class="label">Estimated pension at {model.claim}</p>
      <p class="amount">
        {format(model.selected.monthlyIn(BASE_YEAR, model.cpi))}<span
          >/month</span
        >
      </p>
      <p class="annual">
        {format(model.selected.annualIn(BASE_YEAR, model.cpi))} a year, in today's
        dollars
      </p>
    </div>

    <details>
      <summary>Every start age</summary>
      <figure class="chart">
        <figcaption>
          Monthly pension by start age; each row also shows the annual amount.
        </figcaption>
        {#each chart as row (row.age)}
          <button
            type="button"
            class="bar-row"
            class:selected={row.age === model.claim}
            aria-pressed={row.age === model.claim}
            aria-label="Start at {row.age}: {format(
              row.monthly,
            )} per month, {format(row.annual)} per year"
            onclick={() => (claimAge = row.age)}
          >
            <span class="bar-age">{row.age}</span>
            <span class="bar-track">
              <span class="bar" style:width="{row.width}%"></span>
            </span>
            <span class="bar-value">
              <span>{format(row.monthly)}/mo</span>
              <span class="bar-annual">{format(row.annual)}/yr</span>
            </span>
          </button>
        {/each}
      </figure>
    </details>
  </div>
</div>

<style>
  .cpp-calculator {
    margin: var(--space-xl) 0;
    padding: var(--space-lg);
    border: 1px solid var(--line-color);
    border-radius: 8px;
    background: var(--bg-surface);
  }

  .content {
    visibility: hidden;
  }

  .content.ready {
    visibility: visible;
  }

  .fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-md);
  }

  @media (max-width: 520px) {
    .fields {
      grid-template-columns: 1fr;
    }
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: var(--secondary-color);
    font-size: var(--font-sm);
  }

  input[type='number'],
  input[type='text'] {
    padding: 6px 8px;
    border: 1px solid var(--line-color);
    border-radius: 4px;
    background: var(--bg-body);
    color: var(--text-color);
    font: inherit;
  }

  input[type='range'] {
    width: 100%;
    margin-top: 6px;
    accent-color: var(--primary-color);
  }

  .claim-age {
    margin-top: var(--space-md);
  }

  .claim-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
  }

  .stepper {
    display: inline-flex;
    align-items: center;
    border: 1px solid var(--line-color);
    border-radius: 4px;
  }

  .stepper button {
    width: 30px;
    height: 28px;
    padding: 0;
    border: 0;
    background: var(--bg-body);
    color: var(--text-color);
    font-size: 1.1em;
    line-height: 1;
    cursor: pointer;
  }

  .stepper button:hover:not(:disabled) {
    background: var(--tag-bg);
  }

  .stepper button:disabled {
    color: var(--secondary-color);
    cursor: default;
    opacity: 0.4;
  }

  .stepper output {
    min-width: 2.2em;
    color: var(--text-color);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    text-align: center;
  }

  .assumptions {
    margin-top: var(--space-md);
  }

  .assumptions-body {
    margin-top: var(--space-md);
  }

  .summary-value {
    margin-left: var(--space-sm);
    color: var(--secondary-color);
    font-weight: 400;
  }

  .child-care {
    margin-top: var(--space-md);
  }

  .child-row {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    align-items: end;
    gap: var(--space-md);
    margin-bottom: var(--space-md);
  }

  .remove,
  .add {
    padding: 0;
    border: 0;
    background: none;
    color: var(--secondary-color);
    font: inherit;
    font-size: var(--font-sm);
    cursor: pointer;
  }

  .remove:hover,
  .add:hover {
    color: var(--primary-color);
  }

  .remove {
    padding: 6px 0;
    border: 1px solid transparent;
    line-height: normal;
  }

  .add {
    color: var(--primary-color);
  }

  @media (max-width: 520px) {
    .child-row {
      grid-template-columns: 1fr 1fr;
    }

    .child-row .remove {
      grid-column: 1 / -1;
      justify-self: start;
    }
  }

  .hint {
    margin: var(--space-sm) 0 0;
    color: var(--secondary-color);
    font-size: var(--font-sm);
    line-height: 1.4;
  }

  .hint.error {
    color: #c0392b;
  }

  .section-label {
    margin: 0 0 var(--space-sm);
    color: var(--secondary-color);
    font-size: var(--font-sm);
  }

  .result {
    margin-top: var(--space-lg);
    padding-top: var(--space-md);
    border-top: 1px solid var(--line-color);
  }

  .label {
    margin: 0;
    color: var(--secondary-color);
    font-size: var(--font-sm);
  }

  .amount {
    margin: 2px 0 0;
    color: var(--primary-color);
    font-size: 2.2em;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
  }

  .amount span {
    margin-left: 4px;
    color: var(--secondary-color);
    font-size: 0.4em;
    font-weight: 400;
  }

  .annual {
    margin: 4px 0 0;
    color: var(--secondary-color);
    font-size: var(--font-sm);
  }

  details {
    margin-top: var(--space-md);
  }

  summary {
    color: var(--primary-color);
    cursor: pointer;
    font-size: var(--font-sm);
  }

  .chart {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: var(--space-md) 0 0;
  }

  .chart figcaption {
    margin-bottom: var(--space-sm);
    color: var(--secondary-color);
    font-size: var(--font-sm);
  }

  .bar-row {
    display: grid;
    grid-template-columns: 2.2em 1fr auto;
    align-items: center;
    gap: var(--space-sm);
    padding: 4px 6px;
    border: 0;
    border-radius: 4px;
    background: none;
    color: var(--text-color);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .bar-row:hover {
    background: var(--tag-bg);
  }

  .bar-row.selected {
    background: color-mix(in srgb, var(--primary-color) 12%, transparent);
  }

  .bar-age {
    color: var(--secondary-color);
    font-variant-numeric: tabular-nums;
  }

  .bar-row.selected .bar-age {
    color: var(--text-color);
    font-weight: 600;
  }

  .bar-track {
    height: 14px;
    overflow: hidden;
    border-radius: 3px;
    background: var(--line-color);
  }

  .bar {
    display: block;
    height: 100%;
    border-radius: 3px;
    background: color-mix(in srgb, var(--primary-color) 45%, transparent);
  }

  .bar-row.selected .bar {
    background: var(--primary-color);
  }

  .bar-value {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1px;
    color: var(--text-color);
    font-size: var(--font-sm);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .bar-annual {
    color: var(--secondary-color);
    font-size: 0.85em;
  }
</style>
