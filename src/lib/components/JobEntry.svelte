<script lang="ts">
  import type { Job } from '$lib/resume.types'
  import type { ExperienceSelection } from '$lib/resume.profile'
  import JobHeader from './JobHeader.svelte'

  interface Props {
    job: Job
    selection: ExperienceSelection
  }

  let { job, selection }: Props = $props()
</script>

<article class="entry">
  <JobHeader {job} />
  <ul>
    {#each selection.points as pointKey (pointKey)}
      {@const point = job.points[pointKey]}
      <li>{point.text}</li>
    {/each}
  </ul>
</article>

<style>
  .entry {
    margin-bottom: var(--space-md);
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
</style>
