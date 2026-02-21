<script lang="ts">
    import type { AppStore, SkillKey } from "$lib/resume.store";

    interface Props {
        skills: AppStore["skills"];
        skillGroups: readonly SkillKey[];
    }

    let { skills, skillGroups }: Props = $props();
</script>

<div class="skills-list">
    {#each skillGroups as key}
        <div class="skill-group">
            <strong>{skills[key].label}:</strong>
            {skills[key].items.join(", ")}
        </div>
    {/each}
</div>
