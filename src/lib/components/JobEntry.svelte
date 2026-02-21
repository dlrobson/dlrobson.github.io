<script lang="ts">
    import type { Job } from "$lib/resume.store";
    import type { ExperienceSelection } from "$lib/resume.profile";
    import { getPoint } from "$lib/resume.profile";

    interface Props {
        job: Job;
        selection: ExperienceSelection;
    }

    let { job, selection }: Props = $props();
</script>

<article class="entry">
    <div class="job-header">
        <h3 class="job-title-name">{job.title}</h3>
        <span class="company">{job.company}</span>
    </div>
    <div class="date-loc">
        <time>{job.start}</time> — <time>{job.end}</time> | {job.location}
    </div>
    <ul>
        {#each selection.points as pointKey}
            {@const point = getPoint(job, pointKey)}
            <li>
                {#if point.category}<strong>{point.category}: </strong>{/if}
                {point.text}
            </li>
        {/each}
    </ul>
</article>
