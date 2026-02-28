---
title: 'Writing Posts'
date: '2026-02-28'
description: 'A reference guide for authoring blog posts on this site.'
---

This is a reference for writing posts. Keep it around — the steps below are all
you need to publish new content.

## Creating a Post

Add a `.md` file to `src/posts/`. The filename becomes the URL slug:

```
src/posts/my-post-title.md  →  /posts/my-post-title
```

Slugs should be lowercase with hyphens. No spaces or special characters.

## Frontmatter

Every post starts with a YAML frontmatter block:

```markdown
---
title: 'Your Post Title'
date: '2026-03-15'
description: 'A one-sentence summary shown on the listing page.'
---
```

| Field         | Required | Notes                                                 |
| ------------- | -------- | ----------------------------------------------------- |
| `title`       | Yes      | Displayed as the `<h1>` on the post page              |
| `date`        | Yes      | Must be `YYYY-MM-DD`. Controls sort order on `/posts` |
| `description` | No       | Shown as a subtitle on the listing page               |

## Markdown Syntax

Standard Markdown works as expected.

### Headings

```markdown
## Section heading

### Sub-section
```

Use `##` and `###` inside posts — `#` is reserved for the post title rendered by the layout.

### Emphasis

```markdown
**bold**, _italic_, ~~strikethrough~~, `inline code`
```

### Lists

```markdown
- Unordered item
- Another item

1. Ordered item
2. Another item
```

### Links

```markdown
[link text](https://example.com)
```

### Blockquotes

```markdown
> This is a blockquote.
```

### Horizontal rule

```markdown
---
```

### Tables

```markdown
| Column A | Column B |
| -------- | -------- |
| value    | value    |
```

## Code Blocks

Fenced code blocks with a language tag get syntax highlighting via PrismJS:

````markdown
```bash
git rebase --onto main --update-refs
```
````

Supported language tags include: `bash`, `typescript`, `javascript`, `python`,
`json`, `css`, `html`, `svelte`, `sql`, `yaml`, and [many more](https://prismjs.com/#supported-languages).

## Mermaid Diagrams

Use a fenced `mermaid` code block. Diagrams are rendered to SVG at build time
— no JavaScript is loaded in the browser.

````markdown
```mermaid
gitGraph
  commit id: "A"
  branch feature
  commit id: "B"
  checkout main
  merge feature
```
````

```mermaid
gitGraph
  commit id: "A"
  branch feature
  commit id: "B"
  checkout main
  merge feature
```

Mermaid supports many diagram types beyond git graphs:

````markdown
```mermaid
flowchart LR
  A[Start] --> B{Decision}
  B -- Yes --> C[Do thing]
  B -- No --> D[Skip]
```
````

```mermaid
flowchart LR
  A[Start] --> B{Decision}
  B -- Yes --> C[Do thing]
  B -- No --> D[Skip]
```

See the [Mermaid docs](https://mermaid.js.org/intro/) for the full syntax reference.

## Publishing

The site is statically built. After adding or editing a post:

```bash
npm run build
```

The post will appear at `/posts/<slug>` and on the `/posts` listing page, sorted
by `date` descending.

To preview locally before building:

```bash
npm run dev
```
