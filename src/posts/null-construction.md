---
title: 'Null Construction: Taming Deep Object Graphs'
date: '2026-03-25'
description: 'How the new_null pattern and test builders keep fixture setup from becoming a maintenance problem as injected dependency graphs grow deeper.'
---

<script>
  import CodeTabs from '$lib/components/CodeTabs.svelte'
</script>

[Seams](seams) solve the substitution problem: how to make a dependency replaceable at all. This post addresses what comes next — once every type in a graph is injectable, assembling test fixtures starts to accumulate. Add a new dependency to `OrderProcessor` and every test that constructs one breaks. The null construction pattern is a response to that maintenance burden.

## The Shared Domain

This post builds on the domain from [Seams](seams) — the same `PaymentGateway`, `Mailer`, `Order`, and `OrderProcessor` types — but adds a third dependency: `AuditLog`. The growing dependency count is the point. Two dependencies are manageable; three starts to hurt; the pattern becomes essential before you reach five.

<CodeTabs langs="python,rust,cpp">

```python
from typing import Protocol
from dataclasses import dataclass

class PaymentGateway(Protocol):
    def charge(self, amount_cents: int, card_token: str) -> None: ...

class Mailer(Protocol):
    def send(self, to: str, subject: str, body: str) -> None: ...

class AuditLog(Protocol):
    def record(self, event: str) -> None: ...

@dataclass
class Order:
    id: str
    amount_cents: int
    card_token: str
    email: str

class OrderProcessor:
    def __init__(self,
                 gateway:   PaymentGateway,
                 mailer:    Mailer,
                 audit_log: AuditLog) -> None:
        self._gateway   = gateway
        self._mailer    = mailer
        self._audit_log = audit_log

    def process(self, order: Order) -> None:
        self._gateway.charge(order.amount_cents, order.card_token)
        self._mailer.send(order.email, "Order confirmed",
                          f"Order {order.id} received.")
        self._audit_log.record(f"processed:{order.id}")
```

```rust
pub trait PaymentGateway {
    fn charge(&self, amount_cents: u32, card_token: &str);
}

pub trait Mailer {
    fn send(&self, to: &str, subject: &str, body: &str);
}

pub trait AuditLog {
    fn record(&self, event: &str);
}

pub struct Order {
    pub id: String,
    pub amount_cents: u32,
    pub card_token: String,
    pub email: String,
}

pub struct OrderProcessor {
    gateway:   Box<dyn PaymentGateway>,
    mailer:    Box<dyn Mailer>,
    audit_log: Box<dyn AuditLog>,
}

impl OrderProcessor {
    pub fn new(
        gateway:   Box<dyn PaymentGateway>,
        mailer:    Box<dyn Mailer>,
        audit_log: Box<dyn AuditLog>,
    ) -> Self {
        Self { gateway, mailer, audit_log }
    }

    pub fn process(&self, order: &Order) {
        self.gateway.charge(order.amount_cents, &order.card_token);
        self.mailer.send(&order.email, "Order confirmed",
                         &format!("Order {} received.", order.id));
        self.audit_log.record(&format!("processed:{}", order.id));
    }
}
```

```cpp
struct IPaymentGateway {
    virtual void charge(int amount_cents, const std::string& token) = 0;
    virtual ~IPaymentGateway() = default;
};

struct IMailer {
    virtual void send(const std::string& to, const std::string& subject,
                      const std::string& body) = 0;
    virtual ~IMailer() = default;
};

struct IAuditLog {
    virtual void record(const std::string& event) = 0;
    virtual ~IAuditLog() = default;
};

struct Order {
    std::string id;
    int         amount_cents;
    std::string card_token;
    std::string email;
};

class OrderProcessor {
    std::unique_ptr<IPaymentGateway> gateway_;
    std::unique_ptr<IMailer>         mailer_;
    std::unique_ptr<IAuditLog>       audit_log_;

public:
    OrderProcessor(std::unique_ptr<IPaymentGateway> g,
                   std::unique_ptr<IMailer> m,
                   std::unique_ptr<IAuditLog> a)
        : gateway_(std::move(g))
        , mailer_(std::move(m))
        , audit_log_(std::move(a)) {}

    void process(const Order& order) {
        gateway_->charge(order.amount_cents, order.card_token);
        mailer_->send(order.email, "Order confirmed",
                      "Order " + order.id + " received.");
        audit_log_->record("processed:" + order.id);
    }
};
```

</CodeTabs>

## The Fixture Problem

Say `OrderProcessor` has grown a third dependency — an `AuditLog`. Every test that creates an `OrderProcessor` now needs to supply one, even tests that have nothing to do with auditing.

```
Before:  OrderProcessor(gateway, mailer)
After:   OrderProcessor(gateway, mailer, audit_log)  ← every fixture breaks
```

With five tests, this is annoying. With fifty, it becomes a real cost. The null construction pattern solves it by making each type responsible for assembling its own inert version.

## Null Objects

The foundation is a set of null implementations — types that satisfy the interface and do nothing. No network calls, no file I/O, no panics.

<CodeTabs langs="python,rust,cpp">

```python
class NullGateway:
    def charge(self, amount_cents: int, card_token: str) -> None:
        pass  # does nothing

class NullMailer:
    def send(self, to: str, subject: str, body: str) -> None:
        pass  # does nothing

class NullAuditLog:
    def record(self, event: str) -> None:
        pass  # does nothing
```

```rust
pub struct NullGateway;
impl PaymentGateway for NullGateway {
    fn charge(&self, _: u32, _: &str) {}
}

pub struct NullMailer;
impl Mailer for NullMailer {
    fn send(&self, _: &str, _: &str, _: &str) {}
}

pub struct NullAuditLog;
impl AuditLog for NullAuditLog {
    fn record(&self, _: &str) {}
}
```

```cpp
struct NullGateway : IPaymentGateway {
    void charge(int, const std::string&) override {}
};

struct NullMailer : IMailer {
    void send(const std::string&, const std::string&,
              const std::string&) override {}
};

struct NullAuditLog : IAuditLog {
    void record(const std::string&) override {}
};
```

</CodeTabs>

Null objects are different from dummies and fakes. A dummy panics if called — it guards against unexpected interactions. A fake has real logic (an in-memory store, a state machine) that must be maintained alongside the production type. A null object sits between them: it absorbs calls silently, with zero logic to keep in sync. This lack of logic is what makes the pattern composable — when a graph is several layers deep, each layer can wire itself with nulls and the entire tree assembles in one call.

## `new_null`

Each type that has injectable dependencies gets a `new_null` factory alongside its regular constructor. It wires itself with null objects, requiring no arguments from the caller.

<CodeTabs langs="python,rust,cpp">

```python
class OrderProcessor:
    def __init__(self,
                 gateway:   PaymentGateway,
                 mailer:    Mailer,
                 audit_log: AuditLog) -> None:
        self._gateway   = gateway
        self._mailer    = mailer
        self._audit_log = audit_log

    @classmethod
    def new_null(cls) -> 'OrderProcessor':
        return cls(NullGateway(), NullMailer(), NullAuditLog())

    def process(self, order: Order) -> None:
        self._gateway.charge(order.amount_cents, order.card_token)
        self._mailer.send(order.email, "Order confirmed",
                          f"Order {order.id} received.")
        self._audit_log.record(f"processed:{order.id}")

# In a test that does not care about any of the deps:
sut = OrderProcessor.new_null()
sut.process(test_order)  # no fixture assembly needed
```

```rust
pub struct OrderProcessor {
    gateway:   Box<dyn PaymentGateway>,
    mailer:    Box<dyn Mailer>,
    audit_log: Box<dyn AuditLog>,
}

impl OrderProcessor {
    pub fn new(
        gateway:   Box<dyn PaymentGateway>,
        mailer:    Box<dyn Mailer>,
        audit_log: Box<dyn AuditLog>,
    ) -> Self {
        Self { gateway, mailer, audit_log }
    }

    pub fn new_null() -> Self {
        Self::new(
            Box::new(NullGateway),
            Box::new(NullMailer),
            Box::new(NullAuditLog),
        )
    }

    pub fn process(&self, order: &Order) {
        self.gateway.charge(order.amount_cents, &order.card_token);
        self.mailer.send(&order.email, "Order confirmed",
                         &format!("Order {} received.", order.id));
        self.audit_log.record(&format!("processed:{}", order.id));
    }
}

// In a test that does not care about any of the deps:
let sut = OrderProcessor::new_null();
sut.process(&test_order);
```

```cpp
class OrderProcessor {
    std::unique_ptr<IPaymentGateway> gateway_;
    std::unique_ptr<IMailer>         mailer_;
    std::unique_ptr<IAuditLog>       audit_log_;

public:
    OrderProcessor(std::unique_ptr<IPaymentGateway> g,
                   std::unique_ptr<IMailer> m,
                   std::unique_ptr<IAuditLog> a)
        : gateway_(std::move(g))
        , mailer_(std::move(m))
        , audit_log_(std::move(a)) {}

    static OrderProcessor new_null() {
        return OrderProcessor(
            std::make_unique<NullGateway>(),
            std::make_unique<NullMailer>(),
            std::make_unique<NullAuditLog>()
        );
    }

    void process(const Order& order) {
        gateway_->charge(order.amount_cents, order.card_token);
        mailer_->send(order.email, "Order confirmed",
                      "Order " + order.id + " received.");
        audit_log_->record("processed:" + order.id);
    }
};

// In a test that does not care about any of the deps:
auto sut = OrderProcessor::new_null();
sut.process(test_order);
```

</CodeTabs>

When a new dependency is added to `OrderProcessor`, only `new_null` needs updating — not every test that constructs one.

## Bubbling Up

The pattern composes. A higher-level service that depends on `OrderProcessor` can implement `new_null` by calling `OrderProcessor::new_null()` internally.

<CodeTabs langs="python,rust,cpp">

```python
class InventoryService:
    def __init__(self, repository: StockRepository) -> None:
        self._repository = repository

    @classmethod
    def new_null(cls) -> 'InventoryService':
        return cls(NullStockRepository())

class OrderService:
    def __init__(self,
                 processor: OrderProcessor,
                 inventory: InventoryService) -> None:
        self._processor = processor
        self._inventory = inventory

    @classmethod
    def new_null(cls) -> 'OrderService':
        # Each layer assembles itself — this call reaches all the way down.
        return cls(OrderProcessor.new_null(), InventoryService.new_null())

    def place_order(self, order: Order) -> None:
        self._inventory.reserve(order)
        self._processor.process(order)

# In a test for OrderService — the whole graph is wired with one call:
sut = OrderService.new_null()
sut.place_order(test_order)
```

```rust
pub struct InventoryService {
    repository: Box<dyn StockRepository>,
}

impl InventoryService {
    pub fn new(repository: Box<dyn StockRepository>) -> Self {
        Self { repository }
    }
    pub fn new_null() -> Self {
        Self::new(Box::new(NullStockRepository))
    }
}

pub struct OrderService {
    processor: OrderProcessor,
    inventory: InventoryService,
}

impl OrderService {
    pub fn new(processor: OrderProcessor, inventory: InventoryService) -> Self {
        Self { processor, inventory }
    }

    pub fn new_null() -> Self {
        // Each layer assembles itself — this call reaches all the way down.
        Self::new(OrderProcessor::new_null(), InventoryService::new_null())
    }

    pub fn place_order(&self, order: &Order) {
        self.inventory.reserve(order);
        self.processor.process(order);
    }
}

// In a test for OrderService — the whole graph is wired with one call:
let sut = OrderService::new_null();
sut.place_order(&test_order);
```

```cpp
class InventoryService {
    std::unique_ptr<IStockRepository> repository_;
public:
    explicit InventoryService(std::unique_ptr<IStockRepository> r)
        : repository_(std::move(r)) {}

    static InventoryService new_null() {
        return InventoryService(std::make_unique<NullStockRepository>());
    }
};

class OrderService {
    OrderProcessor  processor_;
    InventoryService inventory_;
public:
    OrderService(OrderProcessor p, InventoryService i)
        : processor_(std::move(p)), inventory_(std::move(i)) {}

    static OrderService new_null() {
        // Each layer assembles itself — this call reaches all the way down.
        return OrderService(OrderProcessor::new_null(), InventoryService::new_null());
    }

    void place_order(const Order& order) {
        inventory_.reserve(order);
        processor_.process(order);
    }
};

// In a test for OrderService — the whole graph is wired with one call:
auto sut = OrderService::new_null();
sut.place_order(test_order);
```

</CodeTabs>

Adding a new service to `OrderService` means updating `OrderService::new_null()`, and nothing else. Tests for `OrderService` are unaffected.

## Selective Override

Most tests do care about _one_ dependency. The pattern handles this by combining `new_null` with the regular constructor: use null objects for everything uninteresting and supply a real double only for the thing being observed.

<CodeTabs langs="python,rust,cpp">

```python
def test_sends_confirmation_email():
    spy = SpyMailer()
    sut = OrderProcessor(
        gateway=NullGateway(),
        mailer=spy,
        audit_log=NullAuditLog(),
    )

    sut.process(test_order)

    assert spy.last_recipient == test_order.email
```

```rust
#[test]
fn sends_confirmation_email() {
    let spy = SpyMailer::new();
    let sut = OrderProcessor::new(
        Box::new(NullGateway),
        Box::new(spy.clone()),
        Box::new(NullAuditLog),
    );

    sut.process(&test_order);

    assert_eq!(spy.last_recipient(), test_order.email);
}
```

```cpp
TEST(OrderProcessorTest, SendsConfirmationEmail) {
    auto spy = std::make_shared<SpyMailer>();
    OrderProcessor sut{
        std::make_unique<NullGateway>(),
        spy,
        std::make_unique<NullAuditLog>(),
    };

    sut.process(test_order);

    EXPECT_EQ(spy->last_recipient(), test_order.email);
}
```

</CodeTabs>

The test is explicit about what it observes and silent about everything else. When a new dependency is added to `OrderProcessor`, this test still compiles — the null default absorbs the change inside `new_null`, and this test does not use `new_null` at all, so it continues to state exactly which dependencies it uses.

## Builder

When a type has many dependencies and a test only cares about one, the explicit constructor call in the selective override example becomes noisy. A builder keeps the intent clear: name the dependency you care about, let everything else default to null.

<CodeTabs langs="python,rust,cpp">

```python
class OrderProcessorBuilder:
    def __init__(self) -> None:
        self._gateway   = NullGateway()
        self._mailer    = NullMailer()
        self._audit_log = NullAuditLog()

    def with_gateway(self, g: PaymentGateway) -> 'OrderProcessorBuilder':
        self._gateway = g
        return self

    def with_mailer(self, m: Mailer) -> 'OrderProcessorBuilder':
        self._mailer = m
        return self

    def with_audit_log(self, a: AuditLog) -> 'OrderProcessorBuilder':
        self._audit_log = a
        return self

    def build(self) -> OrderProcessor:
        return OrderProcessor(self._gateway, self._mailer, self._audit_log)

# In a test — state only what the test cares about:
sut = (OrderProcessorBuilder()
       .with_mailer(SpyMailer())
       .build())
```

```rust
#[derive(Default)]
pub struct OrderProcessorBuilder {
    gateway:   Option<Box<dyn PaymentGateway>>,
    mailer:    Option<Box<dyn Mailer>>,
    audit_log: Option<Box<dyn AuditLog>>,
}

impl OrderProcessorBuilder {
    pub fn gateway(mut self, g: impl PaymentGateway + 'static) -> Self {
        self.gateway = Some(Box::new(g));
        self
    }
    pub fn mailer(mut self, m: impl Mailer + 'static) -> Self {
        self.mailer = Some(Box::new(m));
        self
    }
    pub fn audit_log(mut self, a: impl AuditLog + 'static) -> Self {
        self.audit_log = Some(Box::new(a));
        self
    }
    pub fn build(self) -> OrderProcessor {
        OrderProcessor::new(
            self.gateway.unwrap_or_else(|| Box::new(NullGateway)),
            self.mailer.unwrap_or_else(|| Box::new(NullMailer)),
            self.audit_log.unwrap_or_else(|| Box::new(NullAuditLog)),
        )
    }
}

// In a test — state only what the test cares about:
let sut = OrderProcessorBuilder::default()
    .mailer(SpyMailer::new())
    .build();
```

```cpp
class OrderProcessorBuilder {
    std::unique_ptr<IPaymentGateway> gateway_   = std::make_unique<NullGateway>();
    std::unique_ptr<IMailer>         mailer_    = std::make_unique<NullMailer>();
    std::unique_ptr<IAuditLog>       audit_log_ = std::make_unique<NullAuditLog>();

public:
    OrderProcessorBuilder& with_gateway(std::unique_ptr<IPaymentGateway> g) {
        gateway_ = std::move(g); return *this;
    }
    OrderProcessorBuilder& with_mailer(std::unique_ptr<IMailer> m) {
        mailer_ = std::move(m); return *this;
    }
    OrderProcessorBuilder& with_audit_log(std::unique_ptr<IAuditLog> a) {
        audit_log_ = std::move(a); return *this;
    }
    OrderProcessor build() {
        return OrderProcessor(
            std::move(gateway_),
            std::move(mailer_),
            std::move(audit_log_)
        );
    }
};

// In a test — state only what the test cares about:
auto sut = OrderProcessorBuilder{}
    .with_mailer(std::make_unique<SpyMailer>())
    .build();
```

</CodeTabs>

The builder and `new_null` are complementary: `new_null` is for tests that genuinely do not care about any dependency, and the builder is for tests that care about exactly one. Both ensure that adding a new dependency to the production type requires updating one place — the builder defaults, or the `new_null` body — and not the individual tests.

## Full Solution

Everything above in one consolidated reference — interfaces, null objects, `OrderProcessor` with `new_null`, the builder, and example tests showing all three usage patterns.

<CodeTabs langs="python,rust,cpp" playground>

```python
from typing import Protocol
from dataclasses import dataclass

# --- Interfaces ---

class PaymentGateway(Protocol):
    def charge(self, amount_cents: int, card_token: str) -> None: ...

class Mailer(Protocol):
    def send(self, to: str, subject: str, body: str) -> None: ...

class AuditLog(Protocol):
    def record(self, event: str) -> None: ...

@dataclass
class Order:
    id: str
    amount_cents: int
    card_token: str
    email: str

# --- Null Objects ---

class NullGateway:
    def charge(self, amount_cents: int, card_token: str) -> None:
        pass

class NullMailer:
    def send(self, to: str, subject: str, body: str) -> None:
        pass

class NullAuditLog:
    def record(self, event: str) -> None:
        pass

# --- Spy ---

class SpyMailer:
    def __init__(self) -> None:
        self.last_recipient: str | None = None

    def send(self, to: str, subject: str, body: str) -> None:
        self.last_recipient = to

# --- OrderProcessor with new_null ---

class OrderProcessor:
    def __init__(self,
                 gateway:   PaymentGateway,
                 mailer:    Mailer,
                 audit_log: AuditLog) -> None:
        self._gateway   = gateway
        self._mailer    = mailer
        self._audit_log = audit_log

    @classmethod
    def new_null(cls) -> 'OrderProcessor':
        return cls(NullGateway(), NullMailer(), NullAuditLog())

    def process(self, order: Order) -> None:
        self._gateway.charge(order.amount_cents, order.card_token)
        self._mailer.send(order.email, "Order confirmed",
                          f"Order {order.id} received.")
        self._audit_log.record(f"processed:{order.id}")

def test_new_null():
    sut = OrderProcessor.new_null()

    sut.process(Order("1", 500, "tok_123", "a@b.com"))

def test_selective_override():
    spy = SpyMailer()
    sut = OrderProcessor(
        gateway=NullGateway(),
        mailer=spy,
        audit_log=NullAuditLog(),
    )

    sut.process(Order("1", 500, "tok_123", "a@b.com"))

    assert spy.last_recipient == "a@b.com"

# --- Builder ---

class OrderProcessorBuilder:
    def __init__(self) -> None:
        self._gateway   = NullGateway()
        self._mailer    = NullMailer()
        self._audit_log = NullAuditLog()

    def with_gateway(self, g: PaymentGateway) -> 'OrderProcessorBuilder':
        self._gateway = g
        return self

    def with_mailer(self, m: Mailer) -> 'OrderProcessorBuilder':
        self._mailer = m
        return self

    def with_audit_log(self, a: AuditLog) -> 'OrderProcessorBuilder':
        self._audit_log = a
        return self

    def build(self) -> OrderProcessor:
        return OrderProcessor(self._gateway, self._mailer, self._audit_log)

def test_builder():
    spy = SpyMailer()
    sut = (OrderProcessorBuilder()
           .with_mailer(spy)
           .build())

    sut.process(Order("1", 500, "tok_123", "a@b.com"))

    assert spy.last_recipient == "a@b.com"

# --- Run all tests ---

test_new_null();           print("new_null .............. passed")
test_selective_override(); print("selective_override .... passed")
test_builder();            print("builder ............... passed")
```

```rust
#![cfg(test)]

use std::cell::RefCell;
use std::rc::Rc;

// --- Interfaces ---

pub trait PaymentGateway {
    fn charge(&self, amount_cents: u32, card_token: &str);
}

pub trait Mailer {
    fn send(&self, to: &str, subject: &str, body: &str);
}

pub trait AuditLog {
    fn record(&self, event: &str);
}

pub struct Order {
    pub id: String,
    pub amount_cents: u32,
    pub card_token: String,
    pub email: String,
}

// --- Null Objects ---

pub struct NullGateway;
impl PaymentGateway for NullGateway {
    fn charge(&self, _: u32, _: &str) {}
}

pub struct NullMailer;
impl Mailer for NullMailer {
    fn send(&self, _: &str, _: &str, _: &str) {}
}

pub struct NullAuditLog;
impl AuditLog for NullAuditLog {
    fn record(&self, _: &str) {}
}

// --- Spy ---

#[derive(Clone)]
pub struct SpyMailer {
    last_recipient: Rc<RefCell<String>>,
}

impl SpyMailer {
    pub fn new() -> Self {
        Self { last_recipient: Rc::new(RefCell::new(String::new())) }
    }
    pub fn last_recipient(&self) -> String {
        self.last_recipient.borrow().clone()
    }
}

impl Mailer for SpyMailer {
    fn send(&self, to: &str, _subject: &str, _body: &str) {
        *self.last_recipient.borrow_mut() = to.to_string();
    }
}

// --- OrderProcessor with new_null ---

pub struct OrderProcessor {
    gateway:   Box<dyn PaymentGateway>,
    mailer:    Box<dyn Mailer>,
    audit_log: Box<dyn AuditLog>,
}

impl OrderProcessor {
    pub fn new(
        gateway:   Box<dyn PaymentGateway>,
        mailer:    Box<dyn Mailer>,
        audit_log: Box<dyn AuditLog>,
    ) -> Self {
        Self { gateway, mailer, audit_log }
    }

    pub fn new_null() -> Self {
        Self::new(
            Box::new(NullGateway),
            Box::new(NullMailer),
            Box::new(NullAuditLog),
        )
    }

    pub fn process(&self, order: &Order) {
        self.gateway.charge(order.amount_cents, &order.card_token);
        self.mailer.send(&order.email, "Order confirmed",
                         &format!("Order {} received.", order.id));
        self.audit_log.record(&format!("processed:{}", order.id));
    }
}

fn test_order() -> Order {
    Order { id: "1".into(), amount_cents: 500,
            card_token: "tok_123".into(), email: "a@b.com".into() }
}

#[test]
fn new_null_no_dependencies() {
    let sut = OrderProcessor::new_null();

    sut.process(&test_order());
}

#[test]
fn selective_override() {
    let spy = SpyMailer::new();
    let sut = OrderProcessor::new(
        Box::new(NullGateway),
        Box::new(spy.clone()),
        Box::new(NullAuditLog),
    );

    sut.process(&test_order());

    assert_eq!(spy.last_recipient(), "a@b.com");
}

// --- Builder ---

#[derive(Default)]
pub struct OrderProcessorBuilder {
    gateway:   Option<Box<dyn PaymentGateway>>,
    mailer:    Option<Box<dyn Mailer>>,
    audit_log: Option<Box<dyn AuditLog>>,
}

impl OrderProcessorBuilder {
    pub fn gateway(mut self, g: impl PaymentGateway + 'static) -> Self {
        self.gateway = Some(Box::new(g));
        self
    }
    pub fn mailer(mut self, m: impl Mailer + 'static) -> Self {
        self.mailer = Some(Box::new(m));
        self
    }
    pub fn audit_log(mut self, a: impl AuditLog + 'static) -> Self {
        self.audit_log = Some(Box::new(a));
        self
    }
    pub fn build(self) -> OrderProcessor {
        OrderProcessor::new(
            self.gateway.unwrap_or_else(|| Box::new(NullGateway)),
            self.mailer.unwrap_or_else(|| Box::new(NullMailer)),
            self.audit_log.unwrap_or_else(|| Box::new(NullAuditLog)),
        )
    }
}

#[test]
fn builder_usage() {
    let spy = SpyMailer::new();
    let sut = OrderProcessorBuilder::default()
        .mailer(spy.clone())
        .build();

    sut.process(&test_order());

    assert_eq!(spy.last_recipient(), "a@b.com");
}

fn main() {}
```

```cpp
#include <memory>
#include <string>
#include <cassert>
#include <iostream>

// --- Interfaces ---

struct IPaymentGateway {
    virtual void charge(int amount_cents, const std::string& token) = 0;
    virtual ~IPaymentGateway() = default;
};

struct IMailer {
    virtual void send(const std::string& to, const std::string& subject,
                      const std::string& body) = 0;
    virtual ~IMailer() = default;
};

struct IAuditLog {
    virtual void record(const std::string& event) = 0;
    virtual ~IAuditLog() = default;
};

struct Order {
    std::string id;
    int         amount_cents;
    std::string card_token;
    std::string email;
};

// --- Null Objects ---

struct NullGateway : IPaymentGateway {
    void charge(int, const std::string&) override {}
};

struct NullMailer : IMailer {
    void send(const std::string&, const std::string&,
              const std::string&) override {}
};

struct NullAuditLog : IAuditLog {
    void record(const std::string&) override {}
};

// --- Spy ---

struct SpyMailer : IMailer {
    std::string last_recipient_;

    void send(const std::string& to, const std::string&,
              const std::string&) override {
        last_recipient_ = to;
    }

    const std::string& last_recipient() const { return last_recipient_; }
};

// --- OrderProcessor with new_null ---

class OrderProcessor {
    std::unique_ptr<IPaymentGateway> gateway_;
    std::unique_ptr<IMailer>         mailer_;
    std::unique_ptr<IAuditLog>       audit_log_;

public:
    OrderProcessor(std::unique_ptr<IPaymentGateway> g,
                   std::unique_ptr<IMailer> m,
                   std::unique_ptr<IAuditLog> a)
        : gateway_(std::move(g))
        , mailer_(std::move(m))
        , audit_log_(std::move(a)) {}

    static OrderProcessor new_null() {
        return OrderProcessor(
            std::make_unique<NullGateway>(),
            std::make_unique<NullMailer>(),
            std::make_unique<NullAuditLog>()
        );
    }

    void process(const Order& order) {
        gateway_->charge(order.amount_cents, order.card_token);
        mailer_->send(order.email, "Order confirmed",
                      "Order " + order.id + " received.");
        audit_log_->record("processed:" + order.id);
    }
};

void test_new_null() {
    auto sut = OrderProcessor::new_null();
    Order order{"1", 500, "tok_123", "a@b.com"};

    sut.process(order);
}

void test_selective_override() {
    auto spy = std::make_unique<SpyMailer>();
    auto* spy_ptr = spy.get();
    Order order{"1", 500, "tok_123", "a@b.com"};
    OrderProcessor sut{
        std::make_unique<NullGateway>(),
        std::move(spy),
        std::make_unique<NullAuditLog>(),
    };

    sut.process(order);

    assert(spy_ptr->last_recipient() == "a@b.com");
}

// --- Builder ---

class OrderProcessorBuilder {
    std::unique_ptr<IPaymentGateway> gateway_   = std::make_unique<NullGateway>();
    std::unique_ptr<IMailer>         mailer_    = std::make_unique<NullMailer>();
    std::unique_ptr<IAuditLog>       audit_log_ = std::make_unique<NullAuditLog>();

public:
    OrderProcessorBuilder& with_gateway(std::unique_ptr<IPaymentGateway> g) {
        gateway_ = std::move(g); return *this;
    }
    OrderProcessorBuilder& with_mailer(std::unique_ptr<IMailer> m) {
        mailer_ = std::move(m); return *this;
    }
    OrderProcessorBuilder& with_audit_log(std::unique_ptr<IAuditLog> a) {
        audit_log_ = std::move(a); return *this;
    }
    OrderProcessor build() {
        return OrderProcessor(
            std::move(gateway_),
            std::move(mailer_),
            std::move(audit_log_)
        );
    }
};

void test_builder() {
    auto spy = std::make_unique<SpyMailer>();
    auto* spy_ptr = spy.get();
    Order order{"1", 500, "tok_123", "a@b.com"};
    auto sut = OrderProcessorBuilder{}
        .with_mailer(std::move(spy))
        .build();

    sut.process(order);

    assert(spy_ptr->last_recipient() == "a@b.com");
}

int main() {
    test_new_null();           std::cout << "new_null .............. passed\n";
    test_selective_override(); std::cout << "selective_override .... passed\n";
    test_builder();            std::cout << "builder ............... passed\n";
    return 0;
}
```

</CodeTabs>
