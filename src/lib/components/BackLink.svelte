<script lang="ts">
  interface Props {
    href: string
    label: string
  }

  let { href, label }: Props = $props()
</script>

<a {href} class="back">&larr; {label}</a>

<style>
  .back {
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
    color: var(--secondary-color);
    text-decoration: none;
    font-size: var(--font-sm);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .back:hover {
    color: var(--primary-color);
  }
</style>
