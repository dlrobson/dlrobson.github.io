# site-post-seams

## Purpose

Requirements for the seams blog post — covers all seam types, language coverage, code example structure, and the comparison table.

## Requirements

### Requirement: Post exists and is published

The site SHALL contain a blog post at `src/posts/seams.md` that is accessible at `/posts/seams` and listed on the posts index page.

#### Scenario: Post is accessible

- **WHEN** a visitor navigates to `/posts/seams`
- **THEN** the post SHALL render without errors with a title, date, and body content

### Requirement: Post covers all canonical seams from Feathers' WELC

The post SHALL explain and demonstrate four canonical seam types from Michael Feathers' "Working Effectively with Legacy Code": Constructor Injection, Property Injection, Method Parameter Injection, and Extract and Override. Each seam SHALL have its own section with a prose explanation, a code example, and a summary of when to use it.

#### Scenario: Reader looks up constructor injection

- **WHEN** a reader navigates to the Constructor Injection section
- **THEN** the section SHALL contain a prose explanation, a CodeTabs code example, and a summary sentence

#### Scenario: Reader looks up extract and override

- **WHEN** a reader navigates to the Extract and Override section
- **THEN** the section SHALL contain a warning about virtual method calls in constructors

### Requirement: Post covers closure and function injection as a fifth seam

The post SHALL include a Closure/Function Injection section demonstrating that a single-method interface is equivalent to a callable, with examples in Python, Rust, and C++.

#### Scenario: Reader views closure injection examples

- **WHEN** a reader views the Closure/Function Injection section
- **THEN** the section SHALL contain a CodeTabs block with Python, Rust, and C++ examples
- **AND** the examples SHALL show a dependency expressed as a function/closure rather than an interface implementation

### Requirement: Post covers the Python module seam

The post SHALL include a Python: Module Seam section explaining how Python resolves names at runtime and how `unittest.mock.patch` exploits this. The section SHALL call out the "patch where it's used, not where it's defined" gotcha.

#### Scenario: Reader views the Python module seam section

- **WHEN** a reader views the Python: Module Seam section
- **THEN** the section SHALL contain a Python-only code example showing module-level patching
- **AND** the section SHALL explain that the seam exists because Python resolves names lazily at runtime

#### Scenario: Reader encounters the patch-location gotcha

- **WHEN** a reader reads the Python module seam section
- **THEN** the section SHALL explicitly state that `mock.patch` must target the name as used in the module under test, not where it was originally defined

### Requirement: Post covers Rust static dispatch as a distinct seam

The post SHALL include a Rust: Static Dispatch section explaining the difference between `Box<dyn Trait>` (runtime polymorphism) and generic type parameters `T: Trait` (compile-time monomorphisation). The section SHALL state when each is appropriate.

#### Scenario: Reader views the Rust static dispatch section

- **WHEN** a reader views the Rust: Static Dispatch section
- **THEN** the section SHALL contain a Rust-only code example showing the generic type parameter form of OrderProcessor
- **AND** the section SHALL explain the trade-off between type simplicity (`Box<dyn>`) and zero-cost dispatch (generics)

### Requirement: Post covers additive use of #[cfg(test)] in Rust

The post SHALL include a Rust: Additive `#[cfg(test)]` section demonstrating how to expose test entry points (test constructors, derives, internal access) without replacing production behaviour. The section SHALL explicitly warn against the substitutive form (swapping entire `impl` blocks).

#### Scenario: Reader views the additive cfg(test) section

- **WHEN** a reader views the Rust: Additive `#[cfg(test)]` section
- **THEN** the section SHALL contain Rust code examples showing `#[cfg(test)]` used to add methods or derives, not to replace `impl` blocks

#### Scenario: Reader encounters the substitutive form warning

- **WHEN** a reader reads the Rust: Additive `#[cfg(test)]` section
- **THEN** a warning callout SHALL be present explaining that providing two different `impl Trait for Type` blocks under `#[cfg(test)]` is harmful due to silent drift risk

### Requirement: Post includes a complete seam comparison table

The post SHALL include a "Which Seam to Use" table covering all seam types (four canonical plus the new additions) with columns for the seam name, best-use condition, and language applicability.

#### Scenario: Reader scans for a quick reference

- **WHEN** a reader scans the post for a summary
- **THEN** a comparison table SHALL be present listing all seam types with their best-use condition and which languages they apply to

### Requirement: Code examples use a shared domain (PaymentGateway and Mailer)

All code examples in the post SHALL use the same shared domain: an `OrderProcessor` that depends on a `PaymentGateway` and a `Mailer`. This consistency SHALL allow the structural difference between seam types to be the only variable across sections.

#### Scenario: Reader progresses through the post

- **WHEN** a reader reads from Constructor Injection through to the language-specific sections
- **THEN** each example SHALL reference the same `OrderProcessor`, `PaymentGateway`, and `Mailer` concepts

### Requirement: Code examples use CodeTabs where multiple languages apply

All seam sections with multi-language examples SHALL wrap code in a `CodeTabs` component. Language-specific sections SHALL use `CodeTabs` with a single language. Python SHALL be the first (default) tab in multi-language blocks.

#### Scenario: Reader views a multi-language example

- **WHEN** a reader views a section with examples in multiple languages
- **THEN** the Python tab SHALL be active by default
- **AND** the reader SHALL be able to switch to Rust or C++ tabs

#### Scenario: Reader views a language-specific section

- **WHEN** a reader views the Python: Module Seam or Rust: Static Dispatch sections
- **THEN** the code example SHALL be wrapped in a single-language CodeTabs block

### Requirement: Full Solution block includes language-specific seams per language

The Full Solution playground block SHALL include the new seams for each language where they apply. Python SHALL include closure injection. Rust SHALL include closure injection, static dispatch, and additive `#[cfg(test)]`. C++ SHALL include closure injection. Each language tab only shows what applies to that language.

#### Scenario: Reader views the Python Full Solution tab

- **WHEN** a reader opens the Python tab in the Full Solution block
- **THEN** it SHALL include a closure injection variant in addition to the four canonical seams

#### Scenario: Reader views the Rust Full Solution tab

- **WHEN** a reader opens the Rust tab in the Full Solution block
- **THEN** it SHALL include closure injection, static dispatch, and additive `#[cfg(test)]` variants in addition to the four canonical seams

#### Scenario: Reader views the C++ Full Solution tab

- **WHEN** a reader opens the C++ tab in the Full Solution block
- **THEN** it SHALL include a closure injection variant in addition to the four canonical seams
