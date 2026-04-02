# Capability: site-code-tabs-playground

## Purpose

The `CodeTabs` component supports a `playground` prop that renders a run button in the tab bar, allowing users to open the active language's code in its canonical external playground. Playground URLs are pre-computed at build time and injected as props; a fetch-on-click fallback applies when pre-computed URLs are absent.

## Requirements

### Requirement: CodeTabs can show a run button

When the `playground` prop is set on a `CodeTabs` component, a run button SHALL appear right-aligned in the tab bar. The button SHALL open the active language's code in its canonical external playground in a new browser tab.

#### Scenario: playground prop absent

- **WHEN** a `CodeTabs` component renders without the `playground` prop
- **THEN** no run button SHALL appear

#### Scenario: playground prop present

- **WHEN** a `CodeTabs` component renders with `playground` set
- **THEN** a run button SHALL appear right-aligned inside the tab bar

### Requirement: Rust code opens in Rust Playground

When the active tab is `rust` and a pre-computed `rustUrl` prop is provided, the run control SHALL be an anchor element that navigates directly. When no `rustUrl` is provided, the existing fetch-on-click fallback SHALL apply.

#### Scenario: rustUrl prop provided — static link rendered

- **WHEN** a `CodeTabs` component renders with `playground` and a `rustUrl` prop
- **AND** the active tab is `rust`
- **THEN** the run control SHALL be an `<a>` element with `href={rustUrl}` and `target="_blank"`
- **AND** no JavaScript fetch SHALL occur on click

#### Scenario: rustUrl prop absent — fetch-on-click fallback

- **WHEN** a `CodeTabs` component renders with `playground` but no `rustUrl` prop
- **AND** the active tab is `rust` and the user clicks the run button
- **THEN** the component SHALL POST to `play.rust-lang.org/meta/gist/` and open the result (existing behaviour)

### Requirement: C++ code opens in Compiler Explorer

When the active tab is `cpp` and a pre-computed `cppUrl` prop is provided, the run control SHALL be an anchor element. When no `cppUrl` is provided, the existing fetch-on-click fallback SHALL apply.

#### Scenario: cppUrl prop provided — static link rendered

- **WHEN** a `CodeTabs` component renders with `playground` and a `cppUrl` prop
- **AND** the active tab is `cpp`
- **THEN** the run control SHALL be an `<a>` element with `href={cppUrl}` and `target="_blank"`
- **AND** no JavaScript fetch SHALL occur on click

#### Scenario: cppUrl prop absent — fetch-on-click fallback

- **WHEN** a `CodeTabs` component renders with `playground` but no `cppUrl` prop
- **AND** the active tab is `cpp` and the user clicks the run button
- **THEN** the component SHALL POST to `godbolt.org/api/shortener` and open the result (existing behaviour)

#### Scenario: User clicks run on cpp tab — API failure

- **WHEN** the active tab is `cpp`, the user clicks the run button, and the godbolt API call fails
- **THEN** the button SHALL display an error indicator ("⚠ Try again")
- **AND** the button SHALL be re-clickable

### Requirement: Python tab opens Wandbox with code pre-loaded

When the active tab is `python` and a pre-computed `pythonUrl` prop is provided, the run control SHALL be an anchor element navigating to the Wandbox permlink. The "coming soon" tooltip SHALL be removed.

#### Scenario: pythonUrl prop provided — static link rendered

- **WHEN** a `CodeTabs` component renders with `playground` and a `pythonUrl` prop
- **AND** the active tab is `python`
- **THEN** the run control SHALL be an `<a>` element with `href={pythonUrl}` and `target="_blank"`
- **AND** no tooltip indicating "coming soon" SHALL appear

#### Scenario: pythonUrl prop absent — open playground without code

- **WHEN** a `CodeTabs` component renders with `playground` but no `pythonUrl` prop
- **AND** the active tab is `python` and the user clicks the run button
- **THEN** a new browser tab SHALL open at `https://www.online-python.com/`
- **AND** a tooltip SHALL indicate that Python playground integration is not available
