<script lang="ts">
  import { onMount } from 'svelte'
  import CppSurface from '$lib/components/CppSurface.svelte'
  import { CEILINGS, LAST_PUBLISHED_YEAR } from '$lib/cpp/params'
  import { breakEvenAge, totalReceived } from '$lib/cpp/break-even'
  import {
    OAS_FULL_RESIDENCE_YEARS,
    OAS_MAX_START_AGE,
    OAS_MIN_START_AGE,
    OAS_START_AGES,
    oasMonthly,
  } from '$lib/cpp/oas'
  import {
    CHILD_REARING_DEFAULT_START_AGE,
    CHILD_REARING_DEFAULT_YEARS,
    DEFAULT_CPI,
    DEFAULT_WAGE_GROWTH,
    MAX_CLAIM_AGE,
    MIN_CLAIM_AGE,
    applyChildRearing,
    childRearingWindows,
    defaultChildRearingPeriod,
    earningPeriodsEarnings,
    estimate,
    project,
  } from '$lib/cpp/estimator'
  import {
    DEFAULT_EARNING_PERIOD,
    MAX_BIRTH_YEAR,
    MAX_CARE_YEAR,
    MAX_WORK_AGE,
    MIN_BIRTH_YEAR,
    MIN_CARE_YEAR,
    MIN_WORK_AGE,
    PERIOD_PROBLEM,
    clamp,
    formatPercent,
    nextEarningPeriod,
    parseStoredState,
    parseWhole,
    readInputs,
    restoreEarningPeriods,
    storedNumber,
    type EarningPeriodFields,
    type StoredResult,
    type StoredState,
  } from '$lib/cpp/inputs'

  const BASE_YEAR = LAST_PUBLISHED_YEAR
  const CLAIM_AGES = Array.from(
    { length: MAX_CLAIM_AGE - MIN_CLAIM_AGE + 1 },
    (_, index) => MIN_CLAIM_AGE + index,
  )
  const money = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  })
  const compactMoney = new Intl.NumberFormat('en-CA', {
    notation: 'compact',
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 1,
  })

  const TOTALS_START = 60
  const TOTALS_END = 95
  const TOTALS_WIDTH = 300
  const TOTALS_HEIGHT = 230
  const PLOT_LEFT = 52
  const PLOT_RIGHT = 272
  const PLOT_TOP = 18
  const PLOT_BOTTOM = 200
  const AGE_TICKS = [60, 65, 70, 75, 80, 85, 90, 95]
  const EMPHASIS_AGES = [60, 65, 70]

  const OAS_TOTALS_START = OAS_MIN_START_AGE
  const OAS_TOTALS_END = 95
  const OAS_AGE_TICKS = [65, 70, 75, 80, 85, 90, 95]
  const OAS_EMPHASIS_AGES = [OAS_MIN_START_AGE, OAS_MAX_START_AGE]

  const DEFAULTS = {
    birthYear: 1990,
    claimAge: 65,
    oasYears: OAS_FULL_RESIDENCE_YEARS,
    oasStartAge: OAS_MIN_START_AGE,
    inflationText: (DEFAULT_CPI * 100).toFixed(2),
    wageGrowthText: (DEFAULT_WAGE_GROWTH * 100).toFixed(2),
  }

  const STORAGE_KEY = 'cpp-calculator:v1'

  interface PeriodRow {
    id: number
    from: number | undefined
    to: number | undefined
  }

  interface EarningRow extends EarningPeriodFields {
    id: number
  }

  let nextEarningId = 1
  let nextPeriodId = 1

  let birthYear = $state<number | undefined>(DEFAULTS.birthYear)
  let claimAge = $state<number | undefined>(DEFAULTS.claimAge)
  let oasYears = $state<number | undefined>(DEFAULTS.oasYears)
  let oasStartAge = $state<number | undefined>(DEFAULTS.oasStartAge)
  let inflationText = $state(DEFAULTS.inflationText)
  let wageGrowthText = $state(DEFAULTS.wageGrowthText)
  let earningPeriods = $state<EarningRow[]>([
    { id: nextEarningId++, ...DEFAULT_EARNING_PERIOD },
  ])
  let periods = $state<PeriodRow[]>([])
  let hydrated = $state(false)
  let surfaceOpen = $state(false)
  let storageNote = $state<string | null>(null)
  let skipNextSave = false

  function readStored(): StoredResult {
    try {
      return parseStoredState(localStorage.getItem(STORAGE_KEY))
    } catch {
      return { ok: false }
    }
  }

  function restore(saved: StoredState | null) {
    if (!saved) return
    birthYear =
      storedNumber(saved.birthYear, MIN_BIRTH_YEAR, MAX_BIRTH_YEAR) ?? birthYear
    claimAge =
      storedNumber(saved.claimAge, MIN_CLAIM_AGE, MAX_CLAIM_AGE) ?? claimAge
    oasYears =
      storedNumber(saved.oasYears, 0, OAS_FULL_RESIDENCE_YEARS) ?? oasYears
    oasStartAge =
      storedNumber(saved.oasStartAge, OAS_MIN_START_AGE, OAS_MAX_START_AGE) ??
      oasStartAge
    if (typeof saved.inflationText === 'string') {
      inflationText = saved.inflationText
    }
    if (typeof saved.wageGrowthText === 'string') {
      wageGrowthText = saved.wageGrowthText
    }
    const restoredEarningPeriods = restoreEarningPeriods(saved)
    if (restoredEarningPeriods) {
      earningPeriods = restoredEarningPeriods.map((period) => ({
        id: nextEarningId++,
        ...period,
      }))
    }
    if (Array.isArray(saved.periods)) {
      periods = saved.periods.map((period) => ({
        id: nextPeriodId++,
        from: storedNumber(period?.from, MIN_CARE_YEAR, MAX_CARE_YEAR),
        to: storedNumber(period?.to, MIN_CARE_YEAR, MAX_CARE_YEAR),
      }))
    }
  }

  onMount(() => {
    const stored = readStored()
    if (stored.ok) {
      restore(stored.saved)
    } else {
      // An unreadable value stays on the device: overwriting it with the
      // defaults would destroy inputs the reader might still recover.
      skipNextSave = true
      storageNote =
        'Your saved inputs could not be read, so this starts from the defaults. They are left on this device untouched until you change something.'
    }
    hydrated = true
  })

  $effect(() => {
    if (!hydrated) return
    const saved: StoredState = {
      birthYear,
      claimAge,
      oasYears,
      oasStartAge,
      inflationText,
      wageGrowthText,
      earningPeriods: earningPeriods.map(({ fromAge, toAge, salary }) => ({
        fromAge,
        toAge,
        salary,
      })),
      periods: periods.map(({ from, to }) => ({ from, to })),
    }
    if (skipNextSave) {
      skipNextSave = false
      return
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
      if (storageNote !== null) storageNote = null
    } catch {
      storageNote =
        'This browser will not store the inputs, so they are not remembered on this device.'
    }
  })

  function stepClaim(delta: number) {
    claimAge = clamp(
      (parseWhole(claimAge) ?? 65) + delta,
      MIN_CLAIM_AGE,
      MAX_CLAIM_AGE,
    )
  }

  function addEarningPeriod() {
    earningPeriods = [
      ...earningPeriods,
      {
        id: nextEarningId++,
        ...nextEarningPeriod(earningPeriods, model.claim),
      },
    ]
  }

  function removeEarningPeriod(id: number) {
    earningPeriods = earningPeriods.filter((period) => period.id !== id)
  }

  function stepOasStart(delta: number) {
    oasStartAge = clamp(
      (parseWhole(oasStartAge) ?? OAS_MIN_START_AGE) + delta,
      OAS_MIN_START_AGE,
      OAS_MAX_START_AGE,
    )
  }

  function addPeriod() {
    const birth = clamp(
      parseWhole(birthYear) ?? DEFAULTS.birthYear,
      MIN_BIRTH_YEAR,
      MAX_BIRTH_YEAR,
    )
    periods = [
      ...periods,
      { id: nextPeriodId++, ...defaultChildRearingPeriod(birth) },
    ]
  }

  function removePeriod(id: number) {
    periods = periods.filter((period) => period.id !== id)
  }

  const inputs = $derived(
    readInputs({
      birthYear,
      earningPeriods,
      claimAge,
      inflationText,
      wageGrowthText,
      periods,
    }),
  )

  const model = $derived.by(() => {
    const birth = clamp(
      inputs.birthYear ?? DEFAULTS.birthYear,
      MIN_BIRTH_YEAR,
      MAX_BIRTH_YEAR,
    )
    const claim = clamp(
      inputs.claimAge ?? DEFAULTS.claimAge,
      MIN_CLAIM_AGE,
      MAX_CLAIM_AGE,
    )
    const cpi = inputs.inflation ?? DEFAULT_CPI
    const growth = inputs.wageGrowth ?? DEFAULT_WAGE_GROWTH

    // The ceilings grow at the wage rate; the salaries and the result deflator
    // use inflation, so each salary stays level in real terms.
    const ceilings = project(CEILINGS, birth + 71, growth)
    const windows = childRearingWindows(inputs.carePeriods)

    const earnings = applyChildRearing(
      earningPeriodsEarnings(inputs.earningPeriods, birth, BASE_YEAR, cpi),
      inputs.carePeriods,
    )
    const results = CLAIM_AGES.map((age) =>
      estimate(birth, age, earnings, ceilings, windows),
    )

    return {
      results,
      selected: results[claim - MIN_CLAIM_AGE],
      claim,
      birth,
      earningPeriods: inputs.earningPeriods,
      cpi,
      growth,
      cpiPercent: (cpi * 100).toFixed(2),
      growthPercent: (growth * 100).toFixed(2),
      periods: windows,
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

  const totals = $derived.by(() => {
    const rows = model.results.map((result) => {
      const monthly = result.monthlyIn(BASE_YEAR, model.cpi)
      return {
        age: result.claimAge,
        total: totalReceived(monthly, result.claimAge, TOTALS_END),
      }
    })
    const max = Math.max(0, ...rows.map((row) => row.total))
    return { rows, max }
  })

  const totalsRows = $derived.by(() =>
    totals.rows
      .map((row) => ({
        ...row,
        emphasis:
          row.age === model.claim ? 2 : EMPHASIS_AGES.includes(row.age) ? 1 : 0,
      }))
      .sort((a, b) => a.emphasis - b.emphasis),
  )

  function totalsX(age: number): number {
    return (
      PLOT_LEFT +
      ((age - TOTALS_START) / (TOTALS_END - TOTALS_START)) *
        (PLOT_RIGHT - PLOT_LEFT)
    )
  }

  function totalsY(value: number): number {
    if (!(totals.max > 0)) return PLOT_BOTTOM
    return PLOT_BOTTOM - (value / totals.max) * (PLOT_BOTTOM - PLOT_TOP)
  }

  function niceStep(value: number): number {
    if (!(value > 0) || !Number.isFinite(value)) return 1
    const power = 10 ** Math.floor(Math.log10(value))
    const scaled = value / power
    const steps = [1, 2, 2.5, 5, 10]
    return (steps.find((step) => scaled <= step) ?? 10) * power
  }

  const yTicks = $derived.by(() => {
    if (!(totals.max > 0)) return [0]
    const step = niceStep(totals.max / 4)
    return Array.from(
      { length: Math.floor(totals.max / step) + 1 },
      (_, index) => index * step,
    )
  })

  const ANCHOR_PAIRS: readonly (readonly [number, number])[] = [
    [60, 65],
    [60, 70],
    [65, 70],
  ]

  const anchorCrossings = $derived.by(() =>
    ANCHOR_PAIRS.map(([a, b]) => {
      const monthlyA = model.results[a - MIN_CLAIM_AGE].monthlyIn(
        BASE_YEAR,
        model.cpi,
      )
      const monthlyB = model.results[b - MIN_CLAIM_AGE].monthlyIn(
        BASE_YEAR,
        model.cpi,
      )
      const age = breakEvenAge(a, b, monthlyA, monthlyB)
      const inRange =
        Number.isFinite(age) && age >= TOTALS_START && age <= TOTALS_END
      return {
        key: `${a}-${b}`,
        a,
        b,
        age,
        inRange,
        total: inRange ? totalReceived(monthlyA, a, age) : 0,
      }
    }),
  )

  const crossingText = $derived.by(() => {
    const shown = anchorCrossings.filter((point) => point.inRange)
    if (shown.length === 0) {
      return 'With these inputs the later start does not pull ahead before age 95.'
    }
    const parts = shown.map(
      (point) =>
        `${point.b} pulls ahead of ${point.a} at about ${Math.round(point.age)}`,
    )
    const list =
      parts.length === 1
        ? parts[0]
        : parts.length === 2
          ? `${parts[0]} and ${parts[1]}`
          : `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`
    return `With these inputs, ${list}.`
  })

  const oasModel = $derived.by(() => {
    const rawYears =
      typeof oasYears === 'number' && Number.isFinite(oasYears) ? oasYears : 0
    const years = clamp(Math.floor(rawYears), 0, OAS_FULL_RESIDENCE_YEARS)
    const start = clamp(
      parseWhole(oasStartAge) ?? OAS_MIN_START_AGE,
      OAS_MIN_START_AGE,
      OAS_MAX_START_AGE,
    )
    const monthly = oasMonthly(years, start)
    const rows = OAS_START_AGES.map((age) => {
      const rowMonthly = oasMonthly(years, age)
      return {
        age,
        monthly: rowMonthly,
        annual: rowMonthly * 12,
      }
    })
    const max = Math.max(0, ...rows.map((row) => row.monthly))
    return {
      years,
      start,
      monthly,
      annual: monthly * 12,
      rows: rows.map((row) => ({
        ...row,
        width: max > 0 ? (row.monthly / max) * 100 : 0,
      })),
    }
  })

  const oasTotals = $derived.by(() => {
    const rows = oasModel.rows.map((row) => ({
      age: row.age,
      total: totalReceived(row.monthly, row.age, OAS_TOTALS_END),
    }))
    const max = Math.max(0, ...rows.map((row) => row.total))
    return { rows, max }
  })

  const oasTotalsRows = $derived.by(() =>
    oasTotals.rows
      .filter((row) => OAS_EMPHASIS_AGES.includes(row.age))
      .map((row) => ({
        ...row,
        emphasis: row.age === oasModel.start ? 2 : 1,
      }))
      .sort((a, b) => a.emphasis - b.emphasis),
  )

  function oasTotalsX(age: number): number {
    return (
      PLOT_LEFT +
      ((age - OAS_TOTALS_START) / (OAS_TOTALS_END - OAS_TOTALS_START)) *
        (PLOT_RIGHT - PLOT_LEFT)
    )
  }

  function oasTotalsY(value: number): number {
    if (!(oasTotals.max > 0)) return PLOT_BOTTOM
    return PLOT_BOTTOM - (value / oasTotals.max) * (PLOT_BOTTOM - PLOT_TOP)
  }

  const oasYTicks = $derived.by(() => {
    if (!(oasTotals.max > 0)) return [0]
    const step = niceStep(oasTotals.max / 4)
    return Array.from(
      { length: Math.floor(oasTotals.max / step) + 1 },
      (_, index) => index * step,
    )
  })

  const oasCrossing = $derived.by(() => {
    const monthly65 = oasMonthly(oasModel.years, OAS_MIN_START_AGE)
    const monthly70 = oasMonthly(oasModel.years, OAS_MAX_START_AGE)
    const age = breakEvenAge(
      OAS_MIN_START_AGE,
      OAS_MAX_START_AGE,
      monthly65,
      monthly70,
    )
    const inRange =
      Number.isFinite(age) && age >= OAS_TOTALS_START && age <= OAS_TOTALS_END
    return {
      age,
      inRange,
      total: inRange ? totalReceived(monthly65, OAS_MIN_START_AGE, age) : 0,
    }
  })

  const oasCrossingText = $derived.by(() => {
    if (!(oasModel.monthly > 0)) {
      return 'Enter years in Canada after 18 to see an OAS estimate.'
    }
    if (!oasCrossing.inRange) {
      return 'With these inputs, starting at 70 does not pull ahead before age 95.'
    }
    return `Starting at 70 pays 36% more each month but gives up five years of payments. It pulls ahead of 65 at about ${Math.round(oasCrossing.age)}.`
  })

  const combined = $derived.by(() => {
    const cpp =
      inputs.problems.length === 0
        ? model.selected.monthlyIn(BASE_YEAR, model.cpi)
        : 0
    const oas = oasModel.monthly
    const monthly = cpp + oas
    return {
      cpp,
      oas,
      monthly,
      annual: monthly * 12,
      bothAge: Math.max(model.claim, oasModel.start),
      cppShare: monthly > 0 ? (cpp / monthly) * 100 : 0,
      oasShare: monthly > 0 ? (oas / monthly) * 100 : 0,
      hasCpp: inputs.problems.length === 0,
    }
  })
</script>

<div class="retirement-calculator">
  <div class="content" class:ready={hydrated}>
    <h2 class="part-title">Canada Pension Plan</h2>

    <div class="fields">
      <label>
        <span>Year you were born</span>
        <input
          type="number"
          min={MIN_BIRTH_YEAR}
          max={MAX_BIRTH_YEAR}
          step="1"
          bind:value={birthYear}
        />
      </label>
    </div>

    <div class="earning">
      <p class="section-label">Earning periods</p>
      {#each earningPeriods as period (period.id)}
        <div class="earning-row">
          <label>
            <span>From age</span>
            <input
              type="number"
              min={MIN_WORK_AGE}
              max={MAX_WORK_AGE}
              step="1"
              bind:value={period.fromAge}
            />
          </label>
          <label>
            <span>To age</span>
            <input
              type="number"
              min={MIN_WORK_AGE}
              max={MAX_WORK_AGE}
              step="1"
              bind:value={period.toAge}
            />
          </label>
          <label>
            <span>Annual salary (today's dollars)</span>
            <input
              type="number"
              min="0"
              step="1000"
              bind:value={period.salary}
            />
          </label>
          <button
            type="button"
            class="remove"
            onclick={() => removeEarningPeriod(period.id)}
            aria-label="Remove earning period"
          >
            Remove
          </button>
        </div>
      {/each}
      <button type="button" class="add" onclick={addEarningPeriod}>
        + Add earning period
      </button>
      <p class="hint">
        Each row covers the calendar years in which you turn the start through
        end ages. Leave a gap for years without earnings. New rows start after
        your latest period, or with the ages blank when the pension no longer
        counts those years; adjust the ages to place them.
      </p>
      {#if inputs.earningProblems.length > 0}
        <ul class="problems">
          {#each inputs.earningProblems as problem (problem)}
            <li>{problem}</li>
          {/each}
        </ul>
      {/if}
    </div>

    <div class="claim-age">
      <div class="claim-row">
        <label for="claim-age">Age you start CPP</label>
        <div class="stepper">
          <button
            type="button"
            onclick={() => stepClaim(-1)}
            disabled={model.claim <= MIN_CLAIM_AGE}
            aria-label="One year earlier">&minus;</button
          >
          <output for="claim-age">{model.claim}</output>
          <button
            type="button"
            onclick={() => stepClaim(1)}
            disabled={model.claim >= MAX_CLAIM_AGE}
            aria-label="One year later">+</button
          >
        </div>
      </div>
      <input
        id="claim-age"
        type="range"
        min={MIN_CLAIM_AGE}
        max={MAX_CLAIM_AGE}
        step="1"
        bind:value={claimAge}
      />
    </div>

    <details class="assumptions">
      <summary>
        Assumptions and time off
        <span class="summary-value">
          {model.cpiPercent}% inflation &middot; {model.growthPercent}% wage
          growth
          {#if model.periods.length === 1}
            &middot; {model.periods[0][0]}&ndash;{model.periods[0][1]}
          {:else if model.periods.length > 1}
            &middot; {model.periods.length} periods
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
              onblur={() => (inflationText = formatPercent(inflationText))}
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
              onblur={() => (wageGrowthText = formatPercent(wageGrowthText))}
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
                  min={MIN_CARE_YEAR}
                  max={MAX_CARE_YEAR}
                  step="1"
                  bind:value={period.from}
                />
              </label>
              <label>
                <span>To year</span>
                <input
                  type="number"
                  min={MIN_CARE_YEAR}
                  max={MAX_CARE_YEAR}
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
          {#if inputs.careProblem}
            <p class="hint error">{PERIOD_PROBLEM}</p>
          {/if}
        </div>
      </div>
    </details>

    {#if storageNote}
      <p class="hint error">{storageNote}</p>
    {/if}

    {#if inputs.problems.length > 0}
      <div class="result" aria-live="polite">
        <p class="label">No estimate yet</p>
        <ul class="problems">
          {#each inputs.problems as problem (problem)}
            <li>{problem}</li>
          {/each}
        </ul>
      </div>
    {:else}
      <div class="result" aria-live="polite">
        <p class="label">Estimated CPP pension at {model.claim}</p>
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
        <summary>Every CPP start age</summary>
        <figure class="chart">
          <figcaption>
            Monthly CPP by start age; each row also shows the annual amount.
          </figcaption>
          {#each chart as row (row.age)}
            <button
              type="button"
              class="bar-row"
              class:selected={row.age === model.claim}
              aria-pressed={row.age === model.claim}
              aria-label="Start CPP at {row.age}: {format(
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

      <details class="totals">
        <summary>Total CPP received by age</summary>
        <figure>
          <svg
            class="totals-svg"
            viewBox="0 0 {TOTALS_WIDTH} {TOTALS_HEIGHT}"
            role="img"
            aria-labelledby="totals-title totals-desc"
          >
            <title id="totals-title">Total CPP received by age</title>
            <desc id="totals-desc">
              A later start pays more each month but for fewer years. {crossingText}
            </desc>

            {#each yTicks as tick (tick)}
              {#if tick > 0}
                <line
                  class="grid"
                  x1={PLOT_LEFT}
                  x2={PLOT_RIGHT}
                  y1={totalsY(tick)}
                  y2={totalsY(tick)}
                />
              {/if}
              <text
                class="tick"
                x={PLOT_LEFT - 6}
                y={totalsY(tick) + 4}
                text-anchor="end">{compactMoney.format(tick)}</text
              >
            {/each}

            <line
              class="axis"
              x1={PLOT_LEFT}
              x2={PLOT_RIGHT}
              y1={PLOT_BOTTOM}
              y2={PLOT_BOTTOM}
            />
            <line
              class="axis"
              x1={PLOT_LEFT}
              x2={PLOT_LEFT}
              y1={PLOT_TOP}
              y2={PLOT_BOTTOM}
            />

            {#each AGE_TICKS as age (age)}
              <text
                class="tick"
                x={totalsX(age)}
                y={PLOT_BOTTOM + 16}
                text-anchor="middle">{age}</text
              >
            {/each}

            {#if totals.max > 0}
              {#each totalsRows as row (row.age)}
                <line
                  class="line"
                  class:prominent={row.emphasis === 1}
                  class:selected={row.emphasis === 2}
                  x1={totalsX(row.age)}
                  y1={PLOT_BOTTOM}
                  x2={totalsX(TOTALS_END)}
                  y2={totalsY(row.total)}
                />
              {/each}

              {#each totalsRows.filter( (row) => EMPHASIS_AGES.includes(row.age), ) as row (row.age)}
                <text
                  class="line-label"
                  class:selected={row.emphasis === 2}
                  x={PLOT_RIGHT + 4}
                  y={totalsY(row.total) + 4}>{row.age}</text
                >
              {/each}

              {#each anchorCrossings.filter((point) => point.inRange) as point (point.key)}
                {@const x = totalsX(point.age)}
                {@const y = totalsY(point.total)}
                <circle class="break-even-dot" cx={x} cy={y} r="3.5" />
                <text
                  class="break-even-label"
                  {x}
                  y={Math.max(y - 7, PLOT_TOP + 4)}
                  text-anchor="middle">{Math.round(point.age)}</text
                >
              {/each}
            {/if}
          </svg>
          <figcaption>{crossingText}</figcaption>
        </figure>
      </details>

      <details
        ontoggle={(event) =>
          (surfaceOpen = (event.currentTarget as HTMLDetailsElement).open)}
      >
        <summary>CPP final salary and working years</summary>
        {#if surfaceOpen}
          <CppSurface
            birthYear={model.birth}
            claimAge={model.claim}
            cpi={model.cpi}
            wageGrowth={model.growth}
            baseYear={BASE_YEAR}
            earningPeriods={model.earningPeriods}
            childRearing={inputs.carePeriods}
          />
        {/if}
      </details>
    {/if}

    <h2 class="part-title">Old Age Security</h2>

    <div class="fields oas-fields">
      <label>
        <span>Years in Canada after 18</span>
        <input
          type="number"
          min="0"
          max={OAS_FULL_RESIDENCE_YEARS}
          step="1"
          bind:value={oasYears}
        />
      </label>
    </div>
    <p class="hint">
      Scales the full monthly pension at 1/40 per year of residence, up to
      {OAS_FULL_RESIDENCE_YEARS} years. No eligibility check; a partial year is rounded
      down.
    </p>

    <div class="claim-age">
      <div class="claim-row">
        <label for="oas-start-age">Age you start OAS</label>
        <div class="stepper">
          <button
            type="button"
            onclick={() => stepOasStart(-1)}
            disabled={oasModel.start <= OAS_MIN_START_AGE}
            aria-label="One year earlier">&minus;</button
          >
          <output for="oas-start-age">{oasModel.start}</output>
          <button
            type="button"
            onclick={() => stepOasStart(1)}
            disabled={oasModel.start >= OAS_MAX_START_AGE}
            aria-label="One year later">+</button
          >
        </div>
      </div>
      <input
        id="oas-start-age"
        type="range"
        min={OAS_MIN_START_AGE}
        max={OAS_MAX_START_AGE}
        step="1"
        bind:value={oasStartAge}
      />
    </div>
    <p class="hint">
      Each year after 65 adds 7.2%. The 10% increase at 75 is not modelled.
    </p>

    <div class="result" aria-live="polite">
      <p class="label">Estimated OAS at {oasModel.start}</p>
      <p class="amount">
        {format(oasModel.monthly)}<span>/month</span>
      </p>
      <p class="annual">
        {format(oasModel.annual)} a year, in today's dollars, before tax and recovery
        tax
      </p>
    </div>

    <details>
      <summary>Every OAS start age</summary>
      <figure class="chart">
        <figcaption>
          Monthly OAS by start age; each row also shows the annual amount.
        </figcaption>
        {#each oasModel.rows as row (row.age)}
          <button
            type="button"
            class="bar-row"
            class:selected={row.age === oasModel.start}
            aria-pressed={row.age === oasModel.start}
            aria-label="Start OAS at {row.age}: {format(
              row.monthly,
            )} per month, {format(row.annual)} per year"
            onclick={() => (oasStartAge = row.age)}
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

    <details class="totals">
      <summary>Total OAS received by age: 65 vs 70</summary>
      <figure>
        <svg
          class="totals-svg"
          viewBox="0 0 {TOTALS_WIDTH} {TOTALS_HEIGHT}"
          role="img"
          aria-labelledby="oas-totals-title oas-totals-desc"
        >
          <title id="oas-totals-title">Total OAS received by age</title>
          <desc id="oas-totals-desc">{oasCrossingText}</desc>

          {#each oasYTicks as tick (tick)}
            {#if tick > 0}
              <line
                class="grid"
                x1={PLOT_LEFT}
                x2={PLOT_RIGHT}
                y1={oasTotalsY(tick)}
                y2={oasTotalsY(tick)}
              />
            {/if}
            <text
              class="tick"
              x={PLOT_LEFT - 6}
              y={oasTotalsY(tick) + 4}
              text-anchor="end">{compactMoney.format(tick)}</text
            >
          {/each}

          <line
            class="axis"
            x1={PLOT_LEFT}
            x2={PLOT_RIGHT}
            y1={PLOT_BOTTOM}
            y2={PLOT_BOTTOM}
          />
          <line
            class="axis"
            x1={PLOT_LEFT}
            x2={PLOT_LEFT}
            y1={PLOT_TOP}
            y2={PLOT_BOTTOM}
          />

          {#each OAS_AGE_TICKS as age (age)}
            <text
              class="tick"
              x={oasTotalsX(age)}
              y={PLOT_BOTTOM + 16}
              text-anchor="middle">{age}</text
            >
          {/each}

          {#if oasTotals.max > 0}
            {#each oasTotalsRows as row (row.age)}
              <line
                class="line"
                class:prominent={row.emphasis === 1}
                class:selected={row.emphasis === 2}
                x1={oasTotalsX(row.age)}
                y1={PLOT_BOTTOM}
                x2={oasTotalsX(OAS_TOTALS_END)}
                y2={oasTotalsY(row.total)}
              />
            {/each}

            {#each oasTotalsRows as row (row.age)}
              <text
                class="line-label"
                class:selected={row.emphasis === 2}
                x={PLOT_RIGHT + 4}
                y={oasTotalsY(row.total) + 4}>{row.age}</text
              >
            {/each}

            {#if oasCrossing.inRange}
              {@const x = oasTotalsX(oasCrossing.age)}
              {@const y = oasTotalsY(oasCrossing.total)}
              <circle class="break-even-dot" cx={x} cy={y} r="3.5" />
              <text
                class="break-even-label"
                {x}
                y={Math.max(y - 7, PLOT_TOP + 4)}
                text-anchor="middle">{Math.round(oasCrossing.age)}</text
              >
            {/if}
          {/if}
        </svg>
        <figcaption>{oasCrossingText}</figcaption>
      </figure>
    </details>

    {#if combined.hasCpp}
      <section class="total">
        <p class="label">From age {combined.bothAge}, once both are paying</p>
        <p class="amount">
          {format(combined.monthly)}<span>/month</span>
        </p>
        <p class="annual">
          {format(combined.annual)} a year, in today's dollars, before tax and recovery
          tax
        </p>
        <div class="split" aria-hidden="true">
          {#if combined.monthly > 0}
            <span class="split-cpp" style:width="{combined.cppShare}%"></span>
            <span class="split-oas" style:width="{combined.oasShare}%"></span>
          {/if}
        </div>
        <p class="breakdown">
          CPP at {model.claim}
          {format(combined.cpp)} + OAS at {oasModel.start}
          {format(combined.oas)}
        </p>
      </section>
    {:else}
      <section class="total">
        <p class="label">Total unavailable</p>
        <p class="hint">Fix the CPP inputs above to see the combined total.</p>
      </section>
    {/if}
  </div>
</div>

<style>
  .retirement-calculator {
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

  .part-title {
    margin: var(--space-xl) 0 var(--space-md);
    padding-top: var(--space-lg);
    border-top: 1px solid var(--line-color);
    color: var(--primary-color);
    font-size: 1.15em;
    font-weight: 600;
  }

  .part-title:first-child {
    margin-top: 0;
    padding-top: 0;
    border-top: 0;
  }

  .fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-md);
  }

  .oas-fields {
    grid-template-columns: minmax(0, 1fr);
    max-width: 18em;
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

  .earning {
    margin-top: var(--space-md);
  }

  .earning-row {
    display: grid;
    grid-template-columns:
      minmax(0, 0.7fr) minmax(0, 0.7fr)
      minmax(0, 1.6fr) auto;
    align-items: end;
    gap: var(--space-md);
    margin-bottom: var(--space-md);
  }

  @media (max-width: 640px) {
    .earning-row {
      grid-template-columns: 1fr 1fr;
    }

    .earning-row label:nth-child(3),
    .earning-row .remove {
      grid-column: 1 / -1;
    }

    .earning-row .remove {
      justify-self: start;
    }
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
    line-height: inherit;
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

  .totals {
    margin: var(--space-lg) 0 0;
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

  .totals figcaption {
    margin-top: var(--space-sm);
    color: var(--secondary-color);
    font-size: var(--font-sm);
    line-height: 1.45;
  }

  .problems {
    margin: 6px 0 0;
    padding-left: 18px;
    color: #c0392b;
    font-size: var(--font-sm);
    line-height: 1.45;
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

  .total {
    margin-top: var(--space-xl);
    padding-top: var(--space-lg);
    border-top: 1px solid var(--line-color);
  }

  .split {
    display: flex;
    height: 12px;
    margin-top: var(--space-md);
    overflow: hidden;
    border-radius: 3px;
    background: var(--line-color);
  }

  .split-cpp {
    background: var(--primary-color);
  }

  .split-oas {
    background: color-mix(in srgb, var(--primary-color) 40%, var(--bg-surface));
  }

  .breakdown {
    margin: var(--space-sm) 0 0;
    color: var(--secondary-color);
    font-size: var(--font-sm);
    font-variant-numeric: tabular-nums;
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
