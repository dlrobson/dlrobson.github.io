<script lang="ts">
    import Fa from "svelte-fa";
    import { faLinkedin, faGithub } from "@fortawesome/free-brands-svg-icons";
    import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
    import type { AppStore } from "$lib/resume.store";

    interface Props {
        header: AppStore["header"];
    }

    let { header }: Props = $props();
</script>

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

<style>
    .resume-header {
        text-align: center;
        border-bottom: 2px solid var(--primary-color);
        padding-bottom: 12px;
        margin-bottom: 12px;
    }

    .resume-header h1 {
        margin: 0;
        font-size: 2.2em;
        letter-spacing: 1px;
        text-transform: uppercase;
    }

    .contact-info {
        margin-top: 8px;
        font-size: 0.9em;
        display: flex;
        gap: 20px;
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
