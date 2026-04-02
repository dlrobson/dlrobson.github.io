# Capability: site-remark-playground-cache

## Purpose

A remark plugin (`remark-playground-links`) that processes `<CodeTabs playground>` blocks at build time and injects pre-computed playground URLs as props, backed by a content-hash cache to avoid redundant API calls.

## Requirements

### Requirement: Remark plugin resolves playground URLs at build time

A remark plugin (`remark-playground-links`) SHALL process `<CodeTabs playground>` blocks during the build and inject pre-computed playground URLs as props on the opening tag. The plugin SHALL support Rust, C++, and Python.

#### Scenario: CodeTabs block with playground prop is processed

- **WHEN** the remark plugin encounters an `html` node whose value contains `<CodeTabs` and `playground`
- **THEN** the plugin SHALL collect all sibling `code` nodes until the closing `</CodeTabs>` tag
- **AND** SHALL resolve a playground URL for each language found
- **AND** SHALL rewrite the opening `<CodeTabs>` tag to include `rustUrl`, `cppUrl`, and/or `pythonUrl` props with the resolved URLs

#### Scenario: CodeTabs block without playground prop is skipped

- **WHEN** the remark plugin encounters a `<CodeTabs>` block without the `playground` attribute
- **THEN** the plugin SHALL leave the AST node unchanged

### Requirement: Plugin resolves URLs via a content-hash cache

The plugin SHALL maintain a cache file (`scripts/playground-urls.json`) keyed by SHA-256 content hash of each code block. A URL SHALL only be fetched from an external API when no cache entry exists for the current hash.

#### Scenario: Cache hit — URL already stored

- **WHEN** the plugin computes the hash of a code block
- **AND** an entry for that hash exists in `playground-urls.json`
- **THEN** the plugin SHALL use the cached URL without making any network request

#### Scenario: Cache miss — URL must be fetched

- **WHEN** the plugin computes the hash of a code block
- **AND** no entry for that hash exists in `playground-urls.json`
- **THEN** the plugin SHALL call the appropriate external API to obtain a URL
- **AND** SHALL write the new entry to `playground-urls.json` before the build completes

#### Scenario: Cache file updated after new URL is fetched

- **WHEN** at least one cache miss occurs during a build
- **THEN** `playground-urls.json` SHALL be written with all entries (existing plus new) after the build step completes

### Requirement: Plugin resolves Rust URLs via Rust Playground gist API

For code blocks with `lang: rust`, the plugin SHALL POST to `https://play.rust-lang.org/meta/gist/` to obtain a gist-based permalink.

#### Scenario: Rust gist API succeeds

- **WHEN** the plugin POSTs Rust source to `play.rust-lang.org/meta/gist/`
- **AND** the API returns a gist ID
- **THEN** the resolved URL SHALL be `https://play.rust-lang.org/?gist=<id>&version=stable&mode=debug&edition=2021`

#### Scenario: Rust gist API fails

- **WHEN** the Rust Playground API returns a non-2xx response
- **THEN** the plugin SHALL log a warning and skip injecting a `rustUrl` prop
- **AND** the build SHALL continue (non-fatal)

### Requirement: Plugin resolves C++ URLs via Godbolt shortener API

For code blocks with `lang: cpp`, the plugin SHALL wrap test functions in a `main()` entrypoint and POST to `https://godbolt.org/api/shortener` with GCC 13 / `-std=c++17` configuration.

#### Scenario: Godbolt API succeeds

- **WHEN** the plugin POSTs the wrapped C++ source to `godbolt.org/api/shortener`
- **AND** the API returns a short URL
- **THEN** the resolved URL SHALL be the short URL returned by the API

#### Scenario: Godbolt API fails

- **WHEN** the Godbolt API returns a non-2xx response
- **THEN** the plugin SHALL log a warning and skip injecting a `cppUrl` prop
- **AND** the build SHALL continue (non-fatal)

### Requirement: Plugin resolves Python URLs via Wandbox permlink API

For code blocks with `lang: python`, the plugin SHALL POST to `https://wandbox.org/api/permlink` with CPython configuration to obtain a permanent short URL. The Python code SHALL be submitted as-is (no transformation).

#### Scenario: Wandbox API succeeds

- **WHEN** the plugin POSTs Python source to `wandbox.org/api/permlink`
- **AND** the API returns a permlink
- **THEN** the resolved URL SHALL be the permlink URL returned by the API

#### Scenario: Wandbox API fails

- **WHEN** the Wandbox API returns a non-2xx response
- **THEN** the plugin SHALL log a warning and skip injecting a `pythonUrl` prop
- **AND** the build SHALL continue (non-fatal)
