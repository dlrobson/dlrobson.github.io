<script lang="ts">
    import type { AppData, SkillKey } from '$lib/resume.data'

    interface Props {
        skills: AppData['skills']
        skillGroups: readonly SkillKey[]
    }

    let { skills, skillGroups }: Props = $props()
</script>

<div class="skills-list">
    {#each skillGroups as key}
        <div class="skill-group">
            <strong>{skills[key].label}:</strong>
            {skills[key].items.join(', ')}
        </div>
    {/each}
</div>

<style>
    .skills-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
        font-size: var(--font-base);
    }

    .skill-group strong {
        font-size: var(--font-sm);
        text-transform: uppercase;
        margin-right: var(--space-xs);
        color: var(--secondary-color);
    }
</style>
