# site-code-tabs

## Purpose

TBD

## Requirements

### Requirement: CodeTabs component exists and is usable in posts

The site SHALL provide a `CodeTabs` Svelte 5 component at `src/lib/components/CodeTabs.svelte` that can be imported and used inside mdsvex `.md` post files to wrap multiple fenced code blocks into a tabbed display.

#### Scenario: Component is importable in a post

- **WHEN** a post includes `import CodeTabs from '$lib/components/CodeTabs.svelte'` in its script block
- **THEN** the component SHALL be available for use in that post's markup without build errors

### Requirement: Tabs are auto-detected from code block language classes

The `CodeTabs` component SHALL automatically detect the language of each child `<pre><code>` block by reading the `language-*` CSS class applied by PrismJS during mdsvex compilation. It SHALL derive a human-readable tab label from the language identifier (e.g., `language-python` → "Python", `language-rust` → "Rust", `language-cpp` → "C++").

#### Scenario: Three code blocks with different languages

- **WHEN** three fenced code blocks tagged `python`, `rust`, and `cpp` are placed inside `<CodeTabs>`
- **THEN** the component SHALL render three tab buttons labeled "Python", "Rust", and "C++"

#### Scenario: Code block with unknown language

- **WHEN** a code block has a `language-*` class not in the known label map
- **THEN** the component SHALL use the raw language identifier as the tab label (capitalised)

### Requirement: Default tab is the first detected language

The component SHALL display the first detected language tab as active on initial render, with no dependency on localStorage or any persisted state.

#### Scenario: Page loads for the first time

- **WHEN** a page containing `CodeTabs` is loaded
- **THEN** the first code block SHALL be visible and its corresponding tab button SHALL appear active
- **AND** all other code blocks SHALL be hidden

#### Scenario: Page is reloaded

- **WHEN** the same page is reloaded
- **THEN** the first code block SHALL again be the active tab (no persistence)

### Requirement: Clicking a tab shows the corresponding code block

The component SHALL respond to tab button clicks by hiding all code blocks and showing only the one corresponding to the clicked tab.

#### Scenario: User clicks a non-active tab

- **WHEN** the user clicks a tab button that is not currently active
- **THEN** the previously active code block SHALL be hidden
- **AND** the code block corresponding to the clicked tab SHALL become visible
- **AND** the clicked tab button SHALL receive the active visual state

### Requirement: No flash of unhydrated content

The component SHALL prevent all child code blocks from being visible simultaneously before JavaScript hydration. A CSS-based mechanism SHALL hide the raw stacked blocks until the component mounts and applies tab state.

#### Scenario: Page renders before JS hydration

- **WHEN** the static HTML is served before the Svelte client runtime loads
- **THEN** the code blocks SHALL NOT all be visible at once in a stacked layout

### Requirement: CodeTabs accepts a playground prop

The `CodeTabs` component SHALL accept an optional `playground` boolean prop. When absent or `false`, component behaviour SHALL be identical to the current implementation. When `true`, the run button capability described in `site-code-tabs-playground` SHALL be activated.

#### Scenario: playground prop absent — no behaviour change

- **WHEN** a `CodeTabs` is rendered without the `playground` prop
- **THEN** the component SHALL behave identically to the pre-change implementation
- **AND** no run button SHALL appear

#### Scenario: playground prop present — run button enabled

- **WHEN** a `CodeTabs` is rendered with `playground` set
- **THEN** the run button SHALL appear in the tab bar per the `site-code-tabs-playground` spec

### Requirement: Tab bar styles are defined in prose.css

All tab bar visual styles (buttons, active state, container) SHALL be defined in `src/lib/prose.css` under a `.code-tabs` class, consistent with the existing pattern for prose-context components (mermaid, tables).

#### Scenario: CodeTabs rendered inside a post

- **WHEN** a `CodeTabs` component is rendered inside the `.prose` div of a post
- **THEN** the tab bar and code blocks SHALL use styles from `.code-tabs` in `prose.css`
