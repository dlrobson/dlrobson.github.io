---
title: 'Test Doubles: Dummies, Stubs, Fakes, Spies, and Mocks'
date: '2026-03-20'
description: 'A practical guide to the five Meszaros test double types, with examples in Python, Rust, and C++.'
---

<script>
  import CodeTabs from '$lib/components/CodeTabs.svelte'
</script>

When people say "I'll just mock it out", they usually mean something much more specific than they realise. The umbrella term is **test double** — any object that stands in for a real dependency in a test. Gerard Meszaros catalogued five distinct types in _xUnit Test Patterns_, and Martin Fowler clarified the distinctions in his essay [Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html). Each type makes a different trade-off between simplicity, control, and what it can verify.

Using the wrong type doesn't break tests, but it does create confusion: a spy masquerading as a mock, or a fake called a stub, muddles what the test is actually checking. Getting the vocabulary right makes tests easier to read and easier to reason about.

## The Shared Domain

All five examples use the same system under test: `UserRegistrationService`. It depends on two collaborators — an `EmailService` that sends a welcome email, and a `UserRepository` that persists users.

<CodeTabs langs="python,rust,cpp">

```python
from typing import Protocol

class User:
    def __init__(self, id: str, email: str) -> None:
        self.id = id
        self.email = email

class EmailService(Protocol):
    def send(self, to: str, subject: str, body: str) -> None: ...

class UserRepository(Protocol):
    def find_by_email(self, email: str) -> User | None: ...
    def save(self, user: User) -> None: ...

class UserRegistrationService:
    def __init__(self, repo: UserRepository, email: EmailService) -> None:
        self._repo = repo
        self._email = email

    def register(self, email: str, password: str) -> User:
        if "@" not in email:
            raise ValueError(f"Invalid email: {email}")
        if self._repo.find_by_email(email) is not None:
            raise ValueError(f"{email} is already registered")
        user = User(id=email, email=email)
        self._repo.save(user)
        self._email.send(email, "Welcome!", f"Thanks for joining, {email}.")
        return user
```

```rust
#[derive(Clone, Debug)]
pub struct User {
    pub id: String,
    pub email: String,
}

pub trait EmailService {
    fn send(&mut self, to: &str, subject: &str, body: &str);
}

pub trait UserRepository {
    fn find_by_email(&self, email: &str) -> Option<User>;
    fn save(&mut self, user: &User);
}

pub struct UserRegistrationService<R: UserRepository, E: EmailService> {
    pub repo: R,
    pub email: E,
}

impl<R: UserRepository, E: EmailService> UserRegistrationService<R, E> {
    pub fn new(repo: R, email: E) -> Self {
        Self { repo, email }
    }

    pub fn register(&mut self, email: &str, _password: &str) -> Result<User, String> {
        if !email.contains('@') {
            return Err(format!("Invalid email: {email}"));
        }
        if self.repo.find_by_email(email).is_some() {
            return Err(format!("{email} is already registered"));
        }
        let user = User { id: email.into(), email: email.into() };
        self.repo.save(&user);
        self.email.send(email, "Welcome!", &format!("Thanks for joining, {email}."));
        Ok(user)
    }
}
```

```cpp
#include <optional>
#include <stdexcept>
#include <string>

struct User {
    std::string id;
    std::string email;
};

struct EmailService {
    virtual void send(const std::string& to,
                      const std::string& subject,
                      const std::string& body) = 0;
    virtual ~EmailService() = default;
};

struct UserRepository {
    virtual std::optional<User> find_by_email(const std::string& email) const = 0;
    virtual void save(const User& user) = 0;
    virtual ~UserRepository() = default;
};

class UserRegistrationService {
    UserRepository& repo_;
    EmailService& email_;
public:
    UserRegistrationService(UserRepository& repo, EmailService& email)
        : repo_(repo), email_(email) {}

    User register_user(const std::string& email, const std::string& /*password*/) {
        if (email.find('@') == std::string::npos)
            throw std::invalid_argument("Invalid email: " + email);
        if (repo_.find_by_email(email))
            throw std::runtime_error(email + " is already registered");
        User user{email, email};
        repo_.save(user);
        email_.send(email, "Welcome!", "Thanks for joining, " + email + ".");
        return user;
    }
};
```

</CodeTabs>

## Dummy

A dummy is passed to satisfy an interface requirement but is **never actually invoked**. If the code accidentally calls it, the dummy makes the test fail loudly — that is the point.

The key is identifying what the test is _really_ exercising. Here we are testing email format validation, which is the first thing `register` does. The format check raises immediately if `@` is absent, before the service ever consults the repository or sends an email. Neither collaborator is ever reached, so both are dummies: anything that panics on any call proves the test path never touches them.

<CodeTabs langs="python,rust,cpp">

```python
import pytest

class DummyUserRepository:
    def find_by_email(self, email: str) -> None:
        raise AssertionError("find_by_email should not be called")
    def save(self, user) -> None:
        raise AssertionError("save should not be called")

class DummyEmailService:
    def send(self, to: str, subject: str, body: str) -> None:
        raise AssertionError("send should not be called")

def test_register_raises_for_invalid_email():
    service = UserRegistrationService(DummyUserRepository(), DummyEmailService())

    with pytest.raises(ValueError, match="Invalid email"):
        service.register("not-an-email", "secret")
```

```rust
struct DummyUserRepository;

impl UserRepository for DummyUserRepository {
    fn find_by_email(&self, _email: &str) -> Option<User> {
        panic!("find_by_email should not be called")
    }
    fn save(&mut self, _user: &User) {
        panic!("save should not be called")
    }
}

struct DummyEmailService;

impl EmailService for DummyEmailService {
    fn send(&mut self, _to: &str, _subject: &str, _body: &str) {
        panic!("send should not be called")
    }
}

#[test]
fn register_raises_for_invalid_email() {
    let mut service = UserRegistrationService::new(DummyUserRepository, DummyEmailService);

    let result = service.register("not-an-email", "secret");

    assert!(result.unwrap_err().contains("Invalid email"));
}
```

```cpp
struct DummyUserRepository : UserRepository {
    std::optional<User> find_by_email(const std::string&) const override {
        throw std::logic_error("find_by_email should not be called");
    }
    void save(const User&) override {
        throw std::logic_error("save should not be called");
    }
};

struct DummyEmailService : EmailService {
    void send(const std::string&, const std::string&, const std::string&) override {
        throw std::logic_error("send should not be called");
    }
};

void test_register_raises_for_invalid_email() {
    DummyUserRepository repo;
    DummyEmailService email;
    UserRegistrationService service{repo, email};

    try {
        service.register_user("not-an-email", "secret");
        assert(false && "expected exception");
    } catch (const std::invalid_argument&) {
        // pass — format check fired before reaching either collaborator
    }
}
```

</CodeTabs>

## Stub

A stub returns **canned responses** to specific calls. It does not care how many times it is called or with what arguments — it simply returns a predetermined value. Stubs are used to put the system under test into a particular state.

Here we want to verify the "duplicate email" path. The stub always reports that an email is already taken, regardless of what email is passed.

<CodeTabs langs="python,rust,cpp">

```python
import pytest

class StubUserRepository:
    def find_by_email(self, email: str) -> User:
        return User(id="existing", email=email)  # always occupied

    def save(self, user: User) -> None:
        pass  # irrelevant

def test_register_raises_when_email_already_registered():
    service = UserRegistrationService(StubUserRepository(), DummyEmailService())

    with pytest.raises(ValueError, match="already registered"):
        service.register("alice@example.com", "secret")
```

```rust
struct StubUserRepository;

impl UserRepository for StubUserRepository {
    fn find_by_email(&self, email: &str) -> Option<User> {
        Some(User { id: "existing".into(), email: email.into() }) // always occupied
    }
    fn save(&mut self, _user: &User) {}
}

#[test]
fn register_raises_when_email_already_registered() {
    let mut service = UserRegistrationService::new(StubUserRepository, DummyEmailService);

    let result = service.register("alice@example.com", "secret");

    assert!(result.unwrap_err().contains("already registered"));
}
```

```cpp
struct StubUserRepository : UserRepository {
    std::optional<User> find_by_email(const std::string& email) const override {
        return User{"existing", email}; // always occupied
    }
    void save(const User&) override {}
};

void test_register_raises_when_email_already_registered() {
    StubUserRepository repo;
    DummyEmailService email;
    UserRegistrationService service{repo, email};

    try {
        service.register_user("alice@example.com", "secret");
        assert(false && "expected exception");
    } catch (const std::runtime_error&) {
        // pass
    }
}
```

</CodeTabs>

## Fake

A fake has **real, working logic** — just a simplified version not suitable for production. The canonical example is an in-memory repository in place of a database. It correctly stores and retrieves data, but only lives in process memory.

Fakes are heavier to write than stubs, but they enable more realistic multi-step scenarios. Here, we register the same address twice and verify the second attempt fails — a test that requires the repository to actually remember the first registration.

<CodeTabs langs="python,rust,cpp">

```python
import pytest

class FakeUserRepository:
    def __init__(self) -> None:
        self._store: dict[str, User] = {}

    def find_by_email(self, email: str) -> User | None:
        return self._store.get(email)

    def save(self, user: User) -> None:
        self._store[user.email] = user

class NullEmailService:
    def send(self, to: str, subject: str, body: str) -> None:
        pass

def test_cannot_register_same_email_twice():
    repo = FakeUserRepository()
    service = UserRegistrationService(repo, NullEmailService())
    service.register("alice@example.com", "first_secret")

    with pytest.raises(ValueError, match="already registered"):
        service.register("alice@example.com", "second_secret")
```

```rust
use std::collections::HashMap;

struct FakeUserRepository {
    store: HashMap<String, User>,
}

impl FakeUserRepository {
    fn new() -> Self {
        Self { store: HashMap::new() }
    }
}

impl UserRepository for FakeUserRepository {
    fn find_by_email(&self, email: &str) -> Option<User> {
        self.store.get(email).cloned()
    }
    fn save(&mut self, user: &User) {
        self.store.insert(user.email.clone(), user.clone());
    }
}

struct NullEmailService;

impl EmailService for NullEmailService {
    fn send(&mut self, _to: &str, _subject: &str, _body: &str) {}
}

#[test]
fn cannot_register_same_email_twice() {
    let mut service = UserRegistrationService::new(FakeUserRepository::new(), NullEmailService);
    service.register("alice@example.com", "first_secret").unwrap();

    let result = service.register("alice@example.com", "second_secret");

    assert!(result.unwrap_err().contains("already registered"));
}
```

```cpp
#include <unordered_map>

struct FakeUserRepository : UserRepository {
    std::unordered_map<std::string, User> store;

    std::optional<User> find_by_email(const std::string& email) const override {
        auto it = store.find(email);
        return it != store.end() ? std::optional{it->second} : std::nullopt;
    }
    void save(const User& user) override {
        store[user.email] = user;
    }
};

struct NullEmailService : EmailService {
    void send(const std::string&, const std::string&, const std::string&) override {}
};

void test_cannot_register_same_email_twice() {
    FakeUserRepository repo;
    NullEmailService email;
    UserRegistrationService service{repo, email};
    service.register_user("alice@example.com", "first_secret");

    try {
        service.register_user("alice@example.com", "second_secret");
        assert(false && "expected exception");
    } catch (const std::runtime_error&) {
        // pass
    }
}
```

</CodeTabs>

## Spy

A spy is a test double that **records what happens to it**. It delegates normally (or does nothing), but keeps a log of every call — arguments, call count, order. After the system under test has run, you inspect the spy to verify the interaction occurred.

Spies are used when you care about _side effects_: did the email get sent? Was the right recipient used? Notice the structure: arrange the spy, act on the service, then assert against the spy's recorded calls.

<CodeTabs langs="python,rust,cpp">

```python
class SpyEmailService:
    def __init__(self) -> None:
        self.calls: list[dict[str, str]] = []

    def send(self, to: str, subject: str, body: str) -> None:
        self.calls.append({"to": to, "subject": subject, "body": body})


def test_welcome_email_is_sent_on_registration():
    repo = FakeUserRepository()
    spy = SpyEmailService()
    service = UserRegistrationService(repo, spy)

    service.register("alice@example.com", "secret")

    assert len(spy.calls) == 1
    assert spy.calls[0]["to"] == "alice@example.com"
```

```rust
struct SpyEmailService {
    calls: Vec<(String, String, String)>,
}

impl SpyEmailService {
    fn new() -> Self {
        Self { calls: Vec::new() }
    }
}

impl EmailService for SpyEmailService {
    fn send(&mut self, to: &str, subject: &str, body: &str) {
        self.calls.push((to.into(), subject.into(), body.into()));
    }
}

#[test]
fn welcome_email_is_sent_on_registration() {
    let mut service = UserRegistrationService::new(FakeUserRepository::new(), SpyEmailService::new());

    service.register("alice@example.com", "secret").unwrap();

    assert_eq!(service.email.calls.len(), 1);
    assert_eq!(service.email.calls[0].0, "alice@example.com");
}
```

```cpp
#include <vector>
#include <tuple>

struct SpyEmailService : EmailService {
    std::vector<std::tuple<std::string, std::string, std::string>> calls;

    void send(const std::string& to,
              const std::string& subject,
              const std::string& body) override {
        calls.emplace_back(to, subject, body);
    }
};

void test_welcome_email_is_sent_on_registration() {
    FakeUserRepository repo;
    SpyEmailService spy;
    UserRegistrationService service{repo, spy};

    service.register_user("alice@example.com", "secret");

    assert(spy.calls.size() == 1);
    assert(std::get<0>(spy.calls[0]) == "alice@example.com");
}
```

</CodeTabs>

## Mock

A mock looks similar to a spy, but the order of operations is reversed. With a mock, you **declare your expectations before the call**, then verify them after. If the expectation is not met — wrong arguments, called too few or too many times — the test fails at the verification step.

This is the distinction Fowler draws most sharply: a spy is used for _after-the-fact_ assertions; a mock asserts _what should happen_ before it happens.

<CodeTabs langs="python,rust,cpp">

```python
class MockEmailService:
    def __init__(self, expected_to: str, expected_subject: str) -> None:
        self._expected_to = expected_to
        self._expected_subject = expected_subject
        self._was_called = False

    def send(self, to: str, subject: str, body: str) -> None:
        assert to == self._expected_to, f"unexpected recipient: {to!r}"
        assert subject == self._expected_subject, f"unexpected subject: {subject!r}"
        self._was_called = True

    def verify(self) -> None:
        assert self._was_called, "send was never called"


def test_welcome_email_sent_with_correct_subject():
    repo = FakeUserRepository()
    mock_email = MockEmailService("alice@example.com", "Welcome!")
    service = UserRegistrationService(repo, mock_email)

    service.register("alice@example.com", "secret")

    mock_email.verify()
```

```rust
struct MockEmailService {
    expected_to: String,
    expected_subject: String,
    was_called: bool,
}

impl MockEmailService {
    fn expecting(to: &str, subject: &str) -> Self {
        Self {
            expected_to: to.into(),
            expected_subject: subject.into(),
            was_called: false,
        }
    }

    fn verify(&self) {
        assert!(self.was_called, "send was never called");
    }
}

impl EmailService for MockEmailService {
    fn send(&mut self, to: &str, subject: &str, _body: &str) {
        assert_eq!(to, self.expected_to, "unexpected recipient");
        assert_eq!(subject, self.expected_subject, "unexpected subject");
        self.was_called = true;
    }
}

#[test]
fn welcome_email_sent_with_correct_subject() {
    let mock = MockEmailService::expecting("alice@example.com", "Welcome!");
    let mut service = UserRegistrationService::new(FakeUserRepository::new(), mock);

    service.register("alice@example.com", "secret").unwrap();

    service.email.verify();
}
```

```cpp
#include <cassert>

class MockEmailService : public EmailService {
    std::string expected_to_;
    std::string expected_subject_;
    mutable bool was_called_ = false;

public:
    MockEmailService(std::string expected_to, std::string expected_subject)
        : expected_to_(std::move(expected_to))
        , expected_subject_(std::move(expected_subject)) {}

    void send(const std::string& to,
              const std::string& subject,
              const std::string& /*body*/) override {
        assert(to == expected_to_);
        assert(subject == expected_subject_);
        was_called_ = true;
    }

    void verify() const {
        assert(was_called_ && "send was never called");
    }
};

void test_welcome_email_sent_with_correct_subject() {
    FakeUserRepository repo;
    MockEmailService mock{"alice@example.com", "Welcome!"};
    UserRegistrationService service{repo, mock};

    service.register_user("alice@example.com", "secret");

    mock.verify();
}
```

</CodeTabs>

## Summary

| Type      | Returns a value? | Has working logic? | Verifies behaviour?       |
| --------- | ---------------- | ------------------ | ------------------------- |
| **Dummy** | No               | No                 | No — fails if called      |
| **Stub**  | Yes (canned)     | No                 | No                        |
| **Fake**  | Yes              | Yes (simplified)   | No                        |
| **Spy**   | Yes              | Optional           | After the call            |
| **Mock**  | Yes              | Optional           | Before the call (pre-set) |

The most common confusion is between **spy** and **mock**: both record or verify interactions with a collaborator, but a spy records calls and lets you assert afterwards, while a mock states upfront what it expects and fails immediately if those expectations are not met. Neither is better — they suit different testing styles.

The other frequent mistake is using a **fake** when a **stub** would do. Fakes are valuable but they are real code that has to be maintained. If you only need to return a fixed value, a stub is simpler and its intent is clearer.

## Full Example

All five doubles together in one file, using the same domain.

<CodeTabs langs="python,rust,cpp">

```python
from __future__ import annotations
from typing import Protocol
import pytest


# ── Domain ────────────────────────────────────────────────────────────────────

class User:
    def __init__(self, id: str, email: str) -> None:
        self.id = id
        self.email = email

class EmailService(Protocol):
    def send(self, to: str, subject: str, body: str) -> None: ...

class UserRepository(Protocol):
    def find_by_email(self, email: str) -> User | None: ...
    def save(self, user: User) -> None: ...

class UserRegistrationService:
    def __init__(self, repo: UserRepository, email: EmailService) -> None:
        self._repo = repo
        self._email = email

    def register(self, email: str, password: str) -> User:
        if "@" not in email:
            raise ValueError(f"Invalid email: {email}")
        if self._repo.find_by_email(email) is not None:
            raise ValueError(f"{email} is already registered")
        user = User(id=email, email=email)
        self._repo.save(user)
        self._email.send(email, "Welcome!", f"Thanks for joining, {email}.")
        return user


# ── Dummy ─────────────────────────────────────────────────────────────────────

class DummyUserRepository:
    def find_by_email(self, email: str) -> None:
        raise AssertionError("find_by_email should not be called")
    def save(self, user: User) -> None:
        raise AssertionError("save should not be called")

class DummyEmailService:
    def send(self, to: str, subject: str, body: str) -> None:
        raise AssertionError("send should not be called")

def test_register_raises_for_invalid_email():
    service = UserRegistrationService(DummyUserRepository(), DummyEmailService())

    with pytest.raises(ValueError, match="Invalid email"):
        service.register("not-an-email", "secret")


# ── Stub ──────────────────────────────────────────────────────────────────────

class StubUserRepository:
    def find_by_email(self, email: str) -> User:
        return User(id="existing", email=email)
    def save(self, user: User) -> None:
        pass

def test_register_raises_when_email_already_registered():
    service = UserRegistrationService(StubUserRepository(), DummyEmailService())

    with pytest.raises(ValueError, match="already registered"):
        service.register("alice@example.com", "secret")


# ── Fake ──────────────────────────────────────────────────────────────────────

class NullEmailService:
    def send(self, to: str, subject: str, body: str) -> None:
        pass

class FakeUserRepository:
    def __init__(self) -> None:
        self._store: dict[str, User] = {}

    def find_by_email(self, email: str) -> User | None:
        return self._store.get(email)

    def save(self, user: User) -> None:
        self._store[user.email] = user

def test_cannot_register_same_email_twice():
    repo = FakeUserRepository()
    service = UserRegistrationService(repo, NullEmailService())
    service.register("alice@example.com", "first_secret")

    with pytest.raises(ValueError, match="already registered"):
        service.register("alice@example.com", "second_secret")


# ── Spy ───────────────────────────────────────────────────────────────────────

class SpyEmailService:
    def __init__(self) -> None:
        self.calls: list[dict[str, str]] = []

    def send(self, to: str, subject: str, body: str) -> None:
        self.calls.append({"to": to, "subject": subject, "body": body})

def test_welcome_email_is_sent_on_registration():
    repo = FakeUserRepository()
    spy = SpyEmailService()
    service = UserRegistrationService(repo, spy)

    service.register("alice@example.com", "secret")

    assert len(spy.calls) == 1
    assert spy.calls[0]["to"] == "alice@example.com"


# ── Mock ──────────────────────────────────────────────────────────────────────

class MockEmailService:
    def __init__(self, expected_to: str, expected_subject: str) -> None:
        self._expected_to = expected_to
        self._expected_subject = expected_subject
        self._was_called = False

    def send(self, to: str, subject: str, body: str) -> None:
        assert to == self._expected_to, f"unexpected recipient: {to!r}"
        assert subject == self._expected_subject, f"unexpected subject: {subject!r}"
        self._was_called = True

    def verify(self) -> None:
        assert self._was_called, "send was never called"


def test_welcome_email_sent_with_correct_subject():
    repo = FakeUserRepository()
    mock_email = MockEmailService("alice@example.com", "Welcome!")
    service = UserRegistrationService(repo, mock_email)

    service.register("alice@example.com", "secret")

    mock_email.verify()
```

```rust
#![cfg(test)]

use std::collections::HashMap;

// ── Domain ────────────────────────────────────────────────────────────────────

#[derive(Clone, Debug)]
pub struct User {
    pub id: String,
    pub email: String,
}

pub trait EmailService {
    fn send(&mut self, to: &str, subject: &str, body: &str);
}

pub trait UserRepository {
    fn find_by_email(&self, email: &str) -> Option<User>;
    fn save(&mut self, user: &User);
}

pub struct UserRegistrationService<R: UserRepository, E: EmailService> {
    pub repo: R,
    pub email: E,
}

impl<R: UserRepository, E: EmailService> UserRegistrationService<R, E> {
    pub fn new(repo: R, email: E) -> Self {
        Self { repo, email }
    }

    pub fn register(&mut self, email: &str, _password: &str) -> Result<User, String> {
        if !email.contains('@') {
            return Err(format!("Invalid email: {email}"));
        }
        if self.repo.find_by_email(email).is_some() {
            return Err(format!("{email} is already registered"));
        }
        let user = User { id: email.into(), email: email.into() };
        self.repo.save(&user);
        self.email.send(email, "Welcome!", &format!("Thanks for joining, {email}."));
        Ok(user)
    }
}

// ── Dummy ─────────────────────────────────────────────────────────────────────

struct DummyUserRepository;

impl UserRepository for DummyUserRepository {
    fn find_by_email(&self, _email: &str) -> Option<User> {
        panic!("find_by_email should not be called")
    }
    fn save(&mut self, _user: &User) {
        panic!("save should not be called")
    }
}

struct DummyEmailService;

impl EmailService for DummyEmailService {
    fn send(&mut self, _to: &str, _subject: &str, _body: &str) {
        panic!("send should not be called")
    }
}

#[test]
fn register_raises_for_invalid_email() {
    let mut service = UserRegistrationService::new(DummyUserRepository, DummyEmailService);

    let result = service.register("not-an-email", "secret");

    assert!(result.unwrap_err().contains("Invalid email"));
}

// ── Stub ──────────────────────────────────────────────────────────────────────

struct StubUserRepository;

impl UserRepository for StubUserRepository {
    fn find_by_email(&self, email: &str) -> Option<User> {
        Some(User { id: "existing".into(), email: email.into() })
    }
    fn save(&mut self, _user: &User) {}
}

#[test]
fn register_raises_when_email_already_registered() {
    let mut service = UserRegistrationService::new(StubUserRepository, DummyEmailService);

    let result = service.register("alice@example.com", "secret");

    assert!(result.unwrap_err().contains("already registered"));
}

// ── Fake ──────────────────────────────────────────────────────────────────────

struct NullEmailService;

impl EmailService for NullEmailService {
    fn send(&mut self, _to: &str, _subject: &str, _body: &str) {}
}

struct FakeUserRepository {
    store: HashMap<String, User>,
}

impl FakeUserRepository {
    fn new() -> Self {
        Self { store: HashMap::new() }
    }
}

impl UserRepository for FakeUserRepository {
    fn find_by_email(&self, email: &str) -> Option<User> {
        self.store.get(email).cloned()
    }
    fn save(&mut self, user: &User) {
        self.store.insert(user.email.clone(), user.clone());
    }
}

#[test]
fn cannot_register_same_email_twice() {
    let mut service = UserRegistrationService::new(FakeUserRepository::new(), NullEmailService);
    service.register("alice@example.com", "first_secret").unwrap();

    let result = service.register("alice@example.com", "second_secret");

    assert!(result.unwrap_err().contains("already registered"));
}

// ── Spy ───────────────────────────────────────────────────────────────────────

struct SpyEmailService {
    calls: Vec<(String, String, String)>,
}

impl SpyEmailService {
    fn new() -> Self {
        Self { calls: Vec::new() }
    }
}

impl EmailService for SpyEmailService {
    fn send(&mut self, to: &str, subject: &str, body: &str) {
        self.calls.push((to.into(), subject.into(), body.into()));
    }
}

#[test]
fn welcome_email_is_sent_on_registration() {
    let mut service = UserRegistrationService::new(FakeUserRepository::new(), SpyEmailService::new());

    service.register("alice@example.com", "secret").unwrap();

    assert_eq!(service.email.calls.len(), 1);
    assert_eq!(service.email.calls[0].0, "alice@example.com");
}

// ── Mock ──────────────────────────────────────────────────────────────────────

struct MockEmailService {
    expected_to: String,
    expected_subject: String,
    was_called: bool,
}

impl MockEmailService {
    fn expecting(to: &str, subject: &str) -> Self {
        Self {
            expected_to: to.into(),
            expected_subject: subject.into(),
            was_called: false,
        }
    }

    fn verify(&self) {
        assert!(self.was_called, "send was never called");
    }
}

impl EmailService for MockEmailService {
    fn send(&mut self, to: &str, subject: &str, _body: &str) {
        assert_eq!(to, self.expected_to, "unexpected recipient");
        assert_eq!(subject, self.expected_subject, "unexpected subject");
        self.was_called = true;
    }
}

#[test]
fn welcome_email_sent_with_correct_subject() {
    let mock = MockEmailService::expecting("alice@example.com", "Welcome!");
    let mut service = UserRegistrationService::new(FakeUserRepository::new(), mock);

    service.register("alice@example.com", "secret").unwrap();

    service.email.verify();
}
```

```cpp
#include <cassert>
#include <optional>
#include <stdexcept>
#include <string>
#include <tuple>
#include <unordered_map>
#include <vector>

// ── Domain ────────────────────────────────────────────────────────────────────

struct User {
    std::string id;
    std::string email;
};

struct EmailService {
    virtual void send(const std::string& to,
                      const std::string& subject,
                      const std::string& body) = 0;
    virtual ~EmailService() = default;
};

struct UserRepository {
    virtual std::optional<User> find_by_email(const std::string& email) const = 0;
    virtual void save(const User& user) = 0;
    virtual ~UserRepository() = default;
};

class UserRegistrationService {
    UserRepository& repo_;
    EmailService& email_;
public:
    UserRegistrationService(UserRepository& repo, EmailService& email)
        : repo_(repo), email_(email) {}

    User register_user(const std::string& email, const std::string& /*password*/) {
        if (email.find('@') == std::string::npos)
            throw std::invalid_argument("Invalid email: " + email);
        if (repo_.find_by_email(email))
            throw std::runtime_error(email + " is already registered");
        User user{email, email};
        repo_.save(user);
        email_.send(email, "Welcome!", "Thanks for joining, " + email + ".");
        return user;
    }
};

// ── Dummy ─────────────────────────────────────────────────────────────────────

struct DummyUserRepository : UserRepository {
    std::optional<User> find_by_email(const std::string&) const override {
        throw std::logic_error("find_by_email should not be called");
    }
    void save(const User&) override {
        throw std::logic_error("save should not be called");
    }
};

struct DummyEmailService : EmailService {
    void send(const std::string&, const std::string&, const std::string&) override {
        throw std::logic_error("send should not be called");
    }
};

void test_register_raises_for_invalid_email() {
    DummyUserRepository repo;
    DummyEmailService email;
    UserRegistrationService service{repo, email};

    try {
        service.register_user("not-an-email", "secret");
        assert(false && "expected exception");
    } catch (const std::invalid_argument&) {}
}

// ── Stub ──────────────────────────────────────────────────────────────────────

struct StubUserRepository : UserRepository {
    std::optional<User> find_by_email(const std::string& email) const override {
        return User{"existing", email};
    }
    void save(const User&) override {}
};

void test_register_raises_when_email_already_registered() {
    StubUserRepository repo;
    DummyEmailService email;
    UserRegistrationService service{repo, email};

    try {
        service.register_user("alice@example.com", "secret");
        assert(false && "expected exception");
    } catch (const std::runtime_error&) {}
}

// ── Fake ──────────────────────────────────────────────────────────────────────

struct NullEmailService : EmailService {
    void send(const std::string&, const std::string&, const std::string&) override {}
};

struct FakeUserRepository : UserRepository {
    std::unordered_map<std::string, User> store;

    std::optional<User> find_by_email(const std::string& email) const override {
        auto it = store.find(email);
        return it != store.end() ? std::optional{it->second} : std::nullopt;
    }
    void save(const User& user) override {
        store[user.email] = user;
    }
};

void test_cannot_register_same_email_twice() {
    FakeUserRepository repo;
    NullEmailService email;
    UserRegistrationService service{repo, email};
    service.register_user("alice@example.com", "first_secret");

    try {
        service.register_user("alice@example.com", "second_secret");
        assert(false && "expected exception");
    } catch (const std::runtime_error&) {}
}

// ── Spy ───────────────────────────────────────────────────────────────────────

struct SpyEmailService : EmailService {
    std::vector<std::tuple<std::string, std::string, std::string>> calls;

    void send(const std::string& to,
              const std::string& subject,
              const std::string& body) override {
        calls.emplace_back(to, subject, body);
    }
};

void test_welcome_email_is_sent_on_registration() {
    FakeUserRepository repo;
    SpyEmailService spy;
    UserRegistrationService service{repo, spy};

    service.register_user("alice@example.com", "secret");

    assert(spy.calls.size() == 1);
    assert(std::get<0>(spy.calls[0]) == "alice@example.com");
}

// ── Mock ──────────────────────────────────────────────────────────────────────

class MockEmailService : public EmailService {
    std::string expected_to_;
    std::string expected_subject_;
    mutable bool was_called_ = false;
public:
    MockEmailService(std::string expected_to, std::string expected_subject)
        : expected_to_(std::move(expected_to))
        , expected_subject_(std::move(expected_subject)) {}

    void send(const std::string& to,
              const std::string& subject,
              const std::string& /*body*/) override {
        assert(to == expected_to_);
        assert(subject == expected_subject_);
        was_called_ = true;
    }

    void verify() const { assert(was_called_ && "send was never called"); }
};

void test_welcome_email_sent_with_correct_subject() {
    FakeUserRepository repo;
    MockEmailService mock{"alice@example.com", "Welcome!"};
    UserRegistrationService service{repo, mock};

    service.register_user("alice@example.com", "secret");

    mock.verify();
}
```

</CodeTabs>

## Further Reading

Martin Fowler's [Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html) is the canonical treatment of this topic and explains the classical vs. mockist testing philosophies in depth. The original taxonomy comes from Gerard Meszaros' _xUnit Test Patterns_ (2007).
