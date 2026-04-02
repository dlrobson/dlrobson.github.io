# site-post-test-doubles

## Purpose

TBD

## Requirements

### Requirement: Test doubles post exists and is published

The site SHALL contain a blog post at `src/posts/test-doubles.md` that is accessible at `/posts/test-doubles` and listed on the posts index page.

#### Scenario: Post is accessible

- **WHEN** a visitor navigates to `/posts/test-doubles`
- **THEN** the post SHALL render without errors with a title, date, and body content

### Requirement: Post covers all five Meszaros test double types aligned with Fowler's framing

The post SHALL explain and distinguish all five test double types from the Meszaros taxonomy: Dummy, Stub, Fake, Spy, and Mock. Definitions SHALL be consistent with Martin Fowler's "Mocks Aren't Stubs" article. The post SHALL acknowledge the common misuse of "mock" as a catch-all term, and clarify that Mocks are a specific type that verify behaviour via pre-set expectations. Each type SHALL have its own section with a definition, explanation of when to use it, and at least one code example.

#### Scenario: Post contains all five types

- **WHEN** the post is rendered
- **THEN** it SHALL contain dedicated sections for Dummy, Stub, Fake, Spy, and Mock

#### Scenario: Reader looks up what a mock is

- **WHEN** a reader reads the Mock section
- **THEN** the post SHALL clarify that "mock" is often used loosely to mean any test double, but its precise meaning is a double that verifies interactions via pre-set expectations (as per Fowler/Meszaros)

### Requirement: Code examples follow Arrange-Act-Assert structure

All code examples in the post SHALL follow the Arrange-Act-Assert (AAA) pattern as described by Martin Fowler. The three phases SHALL be structurally clear within each example — setup of the double and SUT (Arrange), the action being tested (Act), and the assertion (Assert) — without inline comment labels.

#### Scenario: Reader studies a code example

- **WHEN** a reader reads any code example in the post
- **THEN** the example SHALL have a clear Arrange phase (constructing doubles and SUT), an Act phase (calling the method under test), and an Assert phase (verifying the outcome)
- **AND** the three phases SHALL NOT be labelled with `# Arrange`, `# Act`, `# Assert` comments

### Requirement: Post references Martin Fowler's canonical article

The post SHALL include a reference to Martin Fowler's "Mocks Aren't Stubs" article as the canonical further reading on the topic.

#### Scenario: Reader wants to go deeper

- **WHEN** a reader finishes the post
- **THEN** a link or citation to Fowler's "Mocks Aren't Stubs" SHALL be present

### Requirement: Code examples use a single consistent domain

All code examples in the post SHALL use the same domain: a `UserRegistrationService` that depends on an `EmailService` (for sending welcome emails) and a `UserRepository` (for persisting users). This consistency SHALL make the differences between double types clear without introducing new domain concepts per section.

#### Scenario: Reader progresses through the post

- **WHEN** a reader reads from Dummy through to Mock
- **THEN** each example SHALL reference the same `UserRegistrationService`, `EmailService`, and `UserRepository` concepts

### Requirement: Code examples are shown in Python, Rust, and C++ via CodeTabs

Each code example in the post SHALL be wrapped in a `CodeTabs` component showing Python, Rust, and C++ implementations. Python SHALL be the first tab (and therefore the default).

#### Scenario: Reader views a code example

- **WHEN** a reader views any code example in the post
- **THEN** the Python tab SHALL be active by default
- **AND** the reader SHALL be able to switch to Rust or C++ tabs

### Requirement: Post includes a comparison summary table

The post SHALL include a table summarising all five double types with columns for: name, does it verify behaviour, has working logic, and typical use case.

#### Scenario: Reader wants a quick reference

- **WHEN** a reader scans the post for a summary
- **THEN** a comparison table SHALL be present and readable
