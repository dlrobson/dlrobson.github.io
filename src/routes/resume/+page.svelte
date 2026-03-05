<script lang="ts">
  import { resolve } from '$app/paths'
  import Breadcrumb from '$lib/components/Breadcrumb.svelte'
  import { RESUME_DATA } from '$lib/resume.data'
  import { SvelteSet } from 'svelte/reactivity'

  const jobs = Object.values(RESUME_DATA.experience)

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
    <a class="alt-view" href={resolve('/resume/static')}>Traditional Resume →</a>
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
    {#each jobs as job (job.company + '|' + job.title + '|' + job.start.datetime)}
      {@const points = visiblePoints(job.points)}
      {#if points.length > 0}
        <article class="job">
          <div class="job-header">
            <h2 class="job-title">{job.title}</h2>
            <span class="company">{job.company}</span>
          </div>
          <div class="date-loc">
            <time datetime={job.start.datetime}>{job.start.display()}</time>
            —
            <time datetime={job.end.datetime}>{job.end.display()}</time>
            | {job.location}
          </div>
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
    padding: 2rem 1.5rem;
    color: var(--text-color, #333);
    line-height: 1.5;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .page-header h1 {
    margin: 0 0 0.25rem;
    font-size: 1.75rem;
    color: var(--primary-color, #2c3e50);
  }

  .alt-view {
    font-size: var(--font-sm, 0.85rem);
    color: var(--secondary-color, #666);
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .alt-view:hover {
    color: var(--primary-color, #2c3e50);
  }

  /* ── Filter strip ────────────────────────────────── */
  .filter-strip {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--white, #fff);
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--line-color, #ddd);
    margin-bottom: 1.5rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  .filter-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--secondary-color, #666);
    white-space: nowrap;
  }

  .tag-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .chip {
    padding: 0.25rem 0.6rem;
    border: 1px solid var(--line-color, #ccc);
    border-radius: 999px;
    background: transparent;
    font-size: 0.78rem;
    cursor: pointer;
    color: var(--text-color, #555);
    transition:
      background 0.15s,
      color 0.15s,
      border-color 0.15s;
  }

  .chip:hover {
    border-color: var(--primary-color, #2c3e50);
    color: var(--primary-color, #2c3e50);
  }

  .chip.active {
    background: var(--primary-color, #2c3e50);
    color: #fff;
    border-color: var(--primary-color, #2c3e50);
  }

  .clear-btn {
    padding: 0.25rem 0.6rem;
    border: none;
    background: none;
    font-size: 0.78rem;
    color: var(--primary-color, #2c3e50);
    cursor: pointer;
    text-decoration: underline;
  }

  /* ── Job entries ─────────────────────────────────── */
  .job {
    margin-bottom: 1.75rem;
  }

  .job-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-weight: bold;
  }

  .job-title {
    font-size: 1rem;
    text-transform: uppercase;
    color: var(--primary-color, #2c3e50);
    margin: 0;
    font-weight: inherit;
  }

  .company {
    font-style: italic;
    color: var(--primary-color, #2c3e50);
    text-transform: uppercase;
    font-size: 0.95rem;
  }

  .date-loc {
    font-size: 0.85rem;
    color: var(--secondary-color, #666);
    margin-bottom: 0.35rem;
  }

  ul {
    padding-left: 1.25rem;
    margin: 0.25rem 0 0;
  }

  li {
    margin-bottom: 0.5rem;
    font-size: 0.92rem;
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
    background: #f0f0f0;
    color: #777;
    white-space: nowrap;
    line-height: 1.4;
  }

  .point-tag.highlight {
    background: var(--primary-color, #2c3e50);
    color: #fff;
  }

  /* ── Responsive ──────────────────────────────────── */
  @media (max-width: 600px) {
    .interactive-resume {
      padding: 1rem;
    }

    .job-header {
      flex-direction: column;
    }

    .filter-strip {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
