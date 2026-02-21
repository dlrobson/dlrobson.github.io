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
