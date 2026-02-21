<script lang="ts">
    import ResumeHeader from "$lib/components/ResumeHeader.svelte";
    import SkillSection from "$lib/components/SkillSection.svelte";
    import JobEntry from "$lib/components/JobEntry.svelte";
    import { RESUME_STORE } from "$lib/resume.store";
    import { ACTIVE_PROFILE } from "$lib/resume.profile";

    const { header, skills, education, interests } = RESUME_STORE;
</script>

<!--
  {#snippet} defines a reusable template fragment local to this file.
  {@render} calls it — like calling a function that returns markup.
  Used here to keep section headings DRY without creating a full component.
-->
{#snippet sectionTitle(title: string)}
    <h2 class="section-title">{title}</h2>
{/snippet}

<div class="app-shell">
    <div class="resume-card">
        <ResumeHeader {header} />

        <section>
            {@render sectionTitle("Technical Skills")}
            <SkillSection {skills} skillGroups={ACTIVE_PROFILE.skillGroups} />
        </section>

        <section>
            {@render sectionTitle("Work Experience")}
            {#each ACTIVE_PROFILE.experience as selection}
                {@const job = RESUME_STORE.experience[selection.id]}
                <JobEntry {job} {selection} />
            {/each}
        </section>

        <section>
            {@render sectionTitle("Education")}
            <article class="entry">
                <div class="job-header">
                    <span
                        ><strong>{education.school}</strong> — {education.degree}</span
                    >
                    <time class="date-loc-inline">{education.date}</time>
                </div>
            </article>
        </section>

        <section>
            {@render sectionTitle("Interests")}
            <p class="interests-text">{interests}</p>
        </section>
    </div>
</div>
