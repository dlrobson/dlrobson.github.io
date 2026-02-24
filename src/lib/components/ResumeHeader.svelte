<script lang="ts">
    import Fa from 'svelte-fa'
    import { faLinkedin, faGithub } from '@fortawesome/free-brands-svg-icons'
    import { faEnvelope } from '@fortawesome/free-solid-svg-icons'
    import type { AppData } from '$lib/resume.data'

    interface Props {
        header: AppData['header']
    }

    let { header }: Props = $props()
</script>

<header class="resume-header">
    <h1>{header.name}</h1>
    <address class="contact-info">
        <a href="mailto:{header.email}">
            <Fa icon={faEnvelope} />
            {header.email}
        </a>
        <a href={header.linkedin}>
            <Fa icon={faLinkedin} />
            {header.linkedin.replace('https://', '')}
        </a>
        <a href={header.github}>
            <Fa icon={faGithub} />
            {header.github.replace('https://', '')}
        </a>
    </address>
</header>

<style>
    .resume-header {
        text-align: center;
        border-bottom: 2px solid var(--primary-color);
        padding-bottom: var(--space-sm);
        margin-bottom: var(--space-sm);
    }

    .resume-header h1 {
        margin: 0;
        font-size: 2.2em;
        letter-spacing: 1px;
        text-transform: uppercase;
    }

    .contact-info {
        margin-top: var(--space-sm);
        font-size: 0.9em;
        display: flex;
        gap: var(--space-lg);
        justify-content: center;
        flex-wrap: wrap;
        font-style: normal;
    }

    .contact-info a {
        color: var(--text-color);
        text-decoration: none;
    }

    .contact-info a:hover {
        text-decoration: underline;
    }
</style>
