<script lang="ts">
  import type { Job } from '$lib/resume.types'
  import type { ExperienceSelection } from '$lib/resume.profile'

  interface Props {
    job: Job
    selection: ExperienceSelection
  }

  let { job, selection }: Props = $props()
</script>

<article class="entry">
  <div class="company-row">
    <span class="company">{job.company}</span>
    <span class="location">{job.location}</span>
  </div>
  {#each job.periods as period (period.title + period.start.datetime + period.end.datetime)}
    <div class="role-row">
      <h3 class="job-title-name">{period.title}</h3>
      <span class="date-range">
        <time datetime={period.start.datetime}>{period.start.display()}</time>
        —
        <time datetime={period.end.datetime}>{period.end.display()}</time>
      </span>
    </div>
  {/each}
  <ul>
    {#each selection.points as pointKey (pointKey)}
      {@const point = job.points[pointKey]}
      <li>
        {point.text}
      </li>
    {/each}
  </ul>
</article>

<style>
  .entry {
    margin-bottom: var(--space-md);
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

  .job-title-name {
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

  ul {
    padding-left: var(--space-lg);
    margin-top: var(--space-xs);
    margin-bottom: 0;
  }

  li {
    margin-bottom: var(--space-xs);
    font-size: var(--font-base);
  }

  @media (max-width: 600px) {
    .company-row,
    .role-row {
      flex-direction: column;
    }
  }
</style>
