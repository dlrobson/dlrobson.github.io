<script lang="ts">
  import type { Job } from '$lib/resume.types'

  interface Props {
    job: Job
  }

  let { job }: Props = $props()
</script>

<div class="company-row">
  <span class="company">{job.company}</span>
  <span class="location">{job.location}</span>
</div>
{#each job.periods as period, i (period.title + period.start.datetime + period.end.datetime)}
  <div class="role-row">
    <div class="title-container">
      {#if i === 0 || period.title !== job.periods[i - 1].title}
        <h3 class="job-title">{period.title}</h3>
      {/if}
    </div>
    <span class="date-range">
      <time datetime={period.start.datetime}>{period.start.display()}</time>
      —
      <time datetime={period.end.datetime}>{period.end.display()}</time>
    </span>
  </div>
{/each}

<style>
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
    font-style: normal;
  }

  .role-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-top: 1px;
  }

  .title-container {
    flex: 1;
  }

  .job-title {
    text-transform: uppercase;
    font-size: var(--font-base);
    font-weight: normal;
    color: var(--text-color);
    margin: 0;
  }

  .date-range {
    font-size: var(--font-sm);
    color: var(--secondary-color);
    white-space: nowrap;
  }

  time {
    font-size: var(--font-sm);
    color: var(--secondary-color);
  }

  @media (max-width: 600px) {
    .company-row,
    .role-row {
      flex-direction: column;
    }
  }
</style>
