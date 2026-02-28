<script lang="ts">
  import ResumeHeader from '$lib/components/ResumeHeader.svelte'
  import SkillSection from '$lib/components/SkillSection.svelte'
  import JobEntry from '$lib/components/JobEntry.svelte'
  import { RESUME_DATA } from '$lib/resume.data'
  import { ACTIVE_PROFILE } from '$lib/resume.profile'

  const { header, skills, education, interests } = RESUME_DATA
</script>

<svelte:head>
  <title>{header.name} — Resume</title>
  <meta name="description" content="Resume of {header.name}" />
</svelte:head>

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
      <section>
        {@render sectionTitle('Technical Skills')}
        <SkillSection {skills} skillGroups={ACTIVE_PROFILE.skillGroups} />
      </section>

      <section>
        {@render sectionTitle('Work Experience')}
        {#each ACTIVE_PROFILE.experience as selection}
          {@const job = RESUME_DATA.experience[selection.id]}
          <JobEntry {job} {selection} />
        {/each}
      </section>

      <section>
        {@render sectionTitle('Education')}
        <article class="entry">
          <div class="job-header">
            <span><strong>{education.school}</strong> — {education.degree}</span
            >
            <time class="date-loc-inline" datetime={education.date.datetime}
              >{education.date.display()}</time
            >
          </div>
        </article>
      </section>

      <section>
        {@render sectionTitle('Interests')}
        <p class="interests-text">{interests.join(', ')}</p>
      </section>
    </section>
  </div>
</div>

<style>
  .app-shell {
    min-height: 100vh;
    background-color: var(--white);
    padding: var(--space-xl) var(--space-lg);
  }

  .resume-card {
    color: var(--text-color);
    width: min(8.5in, calc(100vw - 40px));
    min-height: 11in;
    margin: 0 auto;
    background: var(--white);
    padding: var(--space-xl) var(--space-2xl);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    line-height: 1.25;
    box-sizing: border-box;
  }

  .section-title {
    border-bottom: 1px solid var(--line-color);
    text-transform: uppercase;
    font-size: var(--font-md);
    color: var(--primary-color);
    margin-top: var(--space-lg);
    margin-bottom: var(--space-sm);
    letter-spacing: 0.5px;
  }

  .entry {
    margin-bottom: var(--space-md);
  }

  .job-header {
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: var(--font-md);
  }

  .date-loc-inline {
    font-size: var(--font-sm);
    color: var(--secondary-color);
  }

  .interests-text {
    font-size: var(--font-base);
    margin-top: var(--space-xs);
  }

  @media (max-width: 600px) {
    .resume-card {
      width: 100%;
      min-height: auto;
      padding: var(--space-lg);
    }

    .job-header {
      flex-direction: column;
    }
  }

  @media print {
    .app-shell {
      background: none;
      padding: 0;
    }

    .resume-card {
      width: 8.5in;
      min-height: 11in;
      margin: 0;
      padding-top: 0;
      box-shadow: none;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
  }
</style>
