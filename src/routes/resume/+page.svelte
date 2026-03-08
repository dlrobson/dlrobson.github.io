<script lang="ts">
  import { resolve } from '$app/paths'
  import Breadcrumb from '$lib/components/Breadcrumb.svelte'
  import { RESUME_DATA } from '$lib/resume.data'
  import type { Job } from '$lib/resume.types'
  import { SvelteSet } from 'svelte/reactivity'

  const jobs = Object.values(RESUME_DATA.experience) as Job[]

  const availableTags = [
    ...new Set(
      jobs.flatMap((job) =>
        Object.values(job.points).flatMap((p) => p.tags ?? []),
      ),
    ),
  ].sort()

  let selectedTags: Set<string> = $state(new Set())

  function toggleTag(tag: string) {
    const next = new SvelteSet(selectedTags)
    if (next.has(tag)) {
      next.delete(tag)
    } else {
      next.add(tag)
    }
    selectedTags = next
  }

  function clearTags() {
    selectedTags = new SvelteSet()
  }

  function isPointVisible(point: { tags?: readonly string[] }): boolean {
    if (selectedTags.size === 0) return true
    if (!point.tags) return false
    return point.tags.some((t) => selectedTags.has(t))
  }

  function visiblePoints(
    points: Record<string, { text: string; tags?: readonly string[] }>,
  ): [string, { text: string; tags?: readonly string[] }][] {
    return Object.entries(points).filter(([, p]) => isPointVisible(p))
  }
</script>

<svelte:head>
  <title>{RESUME_DATA.header.name} — Interactive Resume</title>
  <meta
    name="description"
    content="Interactive filterable resume of {RESUME_DATA.header.name}"
  />
</svelte:head>

<div class="interactive-resume">
  <header class="page-header">
    <Breadcrumb crumbs={[{ href: '/', label: 'Home' }, { label: 'Resume' }]} />
    <h1>{RESUME_DATA.header.name}</h1>
    <a class="alt-view" href={resolve('/resume/static')}>Traditional Resume →</a
    >
  </header>

  <section class="filter-strip">
    <span class="filter-label">Filter by tech:</span>
    <div class="tag-chips">
      {#each availableTags as tag (tag)}
        <button
          class="chip"
          class:active={selectedTags.has(tag)}
          onclick={() => toggleTag(tag)}
        >
          {tag}
        </button>
      {/each}
    </div>
    {#if selectedTags.size > 0}
      <button class="clear-btn" onclick={clearTags}>Clear all</button>
    {/if}
  </section>

  <section class="experience">
    {#each jobs as job (job.company)}
      {@const points = visiblePoints(job.points)}
      {#if points.length > 0}
        <article class="job">
          <div class="company-row">
            <span class="company">{job.company}</span>
            <span class="location">{job.location}</span>
          </div>
          {#each job.periods as period (period.title + period.start.datetime + period.end.datetime)}
            <div class="role-row">
              <h2 class="job-title">{period.title}</h2>
              <span class="date-range">
                <time datetime={period.start.datetime}
                  >{period.start.display()}</time
                >
                —
                <time datetime={period.end.datetime}
                  >{period.end.display()}</time
                >
              </span>
            </div>
          {/each}
          <ul>
            {#each points as [id, point] (id)}
              <li>
                <span class="point-text">{point.text}</span>
                {#if point.tags}
                  <span class="point-tags">
                    {#each point.tags as tag (tag)}
                      <span
                        class="point-tag"
                        class:highlight={selectedTags.has(tag)}>{tag}</span
                      >
                    {/each}
                  </span>
                {/if}
              </li>
            {/each}
          </ul>
        </article>
      {/if}
    {/each}
  </section>
</div>

<style>
  .interactive-resume {
    max-width: 52rem;
    margin: 0 auto;
    padding: var(--space-xl) var(--space-lg);
    color: var(--text-color);
    line-height: 1.5;
  }

  .page-header {
    margin-bottom: var(--space-lg);
  }

  .page-header h1 {
    margin: 0 0 var(--space-xs);
    font-size: 1.75rem;
    color: var(--primary-color);
  }

  .alt-view {
    font-size: var(--font-sm);
    color: var(--secondary-color);
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .alt-view:hover {
    color: var(--primary-color);
  }

  /* ── Filter strip ────────────────────────────────── */
  .filter-strip {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--bg-body);
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--line-color);
    margin-bottom: var(--space-lg);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  .filter-label {
    font-size: var(--font-sm);
    font-weight: 600;
    color: var(--secondary-color);
    white-space: nowrap;
  }

  .tag-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .chip {
    padding: 0.25rem 0.6rem;
    border: 1px solid var(--line-color);
    border-radius: 999px;
    background: transparent;
    font-size: 0.78rem;
    cursor: pointer;
    color: var(--text-color);
    transition:
      background 0.15s,
      color 0.15s,
      border-color 0.15s;
  }

  .chip:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  .chip.active {
    background: var(--primary-color);
    color: var(--on-primary);
    border-color: var(--primary-color);
  }

  .clear-btn {
    padding: 0.25rem 0.6rem;
    border: none;
    background: none;
    font-size: 0.78rem;
    color: var(--primary-color);
    cursor: pointer;
    text-decoration: underline;
  }

  /* ── Job entries ─────────────────────────────────── */
  .job {
    margin-bottom: 1.75rem;
  }

  .company-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-weight: bold;
    font-size: var(--font-md);
  }

  .company {
    font-style: italic;
    color: var(--primary-color);
    text-transform: uppercase;
    font-size: var(--font-base);
  }

  .location {
    font-size: var(--font-sm);
    color: var(--secondary-color);
    font-weight: normal;
  }

  .role-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-top: 1px;
  }

  .job-title {
    font-size: var(--font-base);
    text-transform: uppercase;
    color: var(--text-color);
    margin: 0;
    font-weight: normal;
  }

  .date-range {
    font-size: var(--font-sm);
    color: var(--secondary-color);
    white-space: nowrap;
  }

  ul {
    padding-left: 1.25rem;
    margin: 0.25rem 0 0;
  }

  li {
    margin-bottom: 0.5rem;
    font-size: var(--font-base);
  }

  .point-text {
    display: inline;
  }

  /* ── Per-bullet tag badges ───────────────────────── */
  .point-tags {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-left: 0.4rem;
    vertical-align: baseline;
  }

  .point-tag {
    font-size: 0.65rem;
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    background: var(--tag-bg);
    color: var(--tag-text);
    white-space: nowrap;
    line-height: 1.4;
  }

  .point-tag.highlight {
    background: var(--primary-color);
    color: var(--on-primary);
  }

  /* ── Responsive ──────────────────────────────────── */
  @media (max-width: 600px) {
    .interactive-resume {
      padding: 1rem;
    }

    .company-row,
    .role-row {
      flex-direction: column;
    }

    .filter-strip {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
