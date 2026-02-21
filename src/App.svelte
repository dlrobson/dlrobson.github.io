<script lang="ts">
    import "./App.css";
    import Fa from "svelte-fa";
    import { faLinkedin, faGithub } from "@fortawesome/free-brands-svg-icons";
    import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
    import { RESUME_STORE } from "./resume.store";
    import { ACTIVE_PROFILE, getPoint } from "./resume.profile";

    const { header, skills, education, interests } = RESUME_STORE;
</script>

<div class="app-shell">
    <div class="resume-card">
        <header class="resume-header">
            <h1>{header.name}</h1>
            <address class="contact-info">
                <a href="mailto:{header.email}">
                    <Fa icon={faEnvelope} />
                    {header.email}
                </a>
                <a href="https://{header.linkedin}">
                    <Fa icon={faLinkedin} />
                    {header.linkedin}
                </a>
                <a href="https://{header.github}">
                    <Fa icon={faGithub} />
                    {header.github}
                </a>
            </address>
        </header>

        <section>
            <h2 class="section-title">Technical Skills</h2>
            <div class="skills-list">
                {#each ACTIVE_PROFILE.skillGroups as key}
                    <div class="skill-group">
                        <strong>{skills[key].label}:</strong>
                        {skills[key].items.join(", ")}
                    </div>
                {/each}
            </div>
        </section>

        <section>
            <h2 class="section-title">Work Experience</h2>
            {#each ACTIVE_PROFILE.experience as selection}
                {@const job = RESUME_STORE.experience[selection.id]}
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
                                {#if point.category}<strong
                                        >{point.category}:
                                    </strong>{/if}
                                {point.text}
                            </li>
                        {/each}
                    </ul>
                </article>
            {/each}
        </section>

        <section>
            <h2 class="section-title">Education</h2>
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
            <h2 class="section-title">Interests</h2>
            <p class="interests-text">{interests}</p>
        </section>
    </div>
</div>
