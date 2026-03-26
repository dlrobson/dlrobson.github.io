---
title: 'Seams: Where Code Becomes Testable'
date: '2026-03-25'
description: 'The four techniques for inserting a test double into existing code — constructor, property, method parameter, and extract-and-override — with examples in Python, Rust, and C++.'
---

<script>
  import CodeTabs from '$lib/components/CodeTabs.svelte'
</script>

A **seam** is a place where you can alter a program's behaviour without changing the code at that point — Michael Feathers' term for where testability lives. The question is not whether to inject a dependency, but which entry point causes the least disruption to the code around it.

## The Shared Domain

Every example in this post works against the same two interfaces and one data type. Defining them once keeps the seam-specific code focused on the structural difference between each approach.

<CodeTabs langs="python,rust,cpp">

```python
from typing import Protocol
from dataclasses import dataclass

class PaymentGateway(Protocol):
    def charge(self, amount_cents: int, card_token: str) -> None: ...

class Mailer(Protocol):
    def send(self, to: str, subject: str, body: str) -> None: ...

@dataclass
class Order:
    id:           str
    amount_cents: int
    card_token:   str
    email:        str
```

```rust
pub trait PaymentGateway {
    fn charge(&self, amount_cents: u32, card_token: &str);
}

pub trait Mailer {
    fn send(&self, to: &str, subject: &str, body: &str);
}

pub struct Order {
    pub id:           String,
    pub amount_cents: u32,
    pub card_token:   String,
    pub email:        String,
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

struct Order {
    std::string id;
    int         amount_cents;
    std::string card_token;
    std::string email;
};
```

</CodeTabs>

With these in place, the hard-coded `OrderProcessor` from the problem section creates concrete implementations (`StripeGateway`, `SmtpMailer`) inside its method body. Each seam technique below shows a different way to make those dependencies replaceable.

## The Problem

This service charges a payment gateway and sends a confirmation email. Both dependencies are instantiated directly inside the method — there is nowhere to insert a test double.

<CodeTabs langs="python,rust,cpp">

```python
class OrderProcessor:
    def process(self, order: Order) -> None:
        gateway = StripeGateway()                    # hard-coded
        mailer  = SmtpMailer("smtp.example.com")     # hard-coded
        gateway.charge(order.amount_cents, order.card_token)
        mailer.send(order.email, "Order confirmed",
                    f"Order {order.id} received.")
```

```rust
pub struct OrderProcessor;

impl OrderProcessor {
    pub fn process(&self, order: &Order) {
        let gateway = StripeGateway::new();               // hard-coded
        let mailer  = SmtpMailer::new("smtp.example.com"); // hard-coded
        gateway.charge(order.amount_cents, &order.card_token);
        mailer.send(&order.email, "Order confirmed",
                    &format!("Order {} received.", order.id));
    }
}
```

```cpp
class OrderProcessor {
public:
    void process(const Order& order) {
        StripeGateway gateway;                        // hard-coded
        SmtpMailer mailer{"smtp.example.com"};        // hard-coded
        gateway.charge(order.amount_cents, order.card_token);
        mailer.send(order.email, "Order confirmed",
                    "Order " + order.id + " received.");
    }
};
```

</CodeTabs>

Any test that calls `process` hits real infrastructure. The four techniques below each cut a seam at a different point.

## Constructor Injection

Accept the dependencies as constructor parameters, typed against an interface. The class no longer decides what it uses — the caller does.

<CodeTabs langs="python,rust,cpp">

```python
class OrderProcessor:
    def __init__(self, gateway: PaymentGateway, mailer: Mailer) -> None:
        self._gateway = gateway
        self._mailer  = mailer

    def process(self, order: Order) -> None:
        self._gateway.charge(order.amount_cents, order.card_token)
        self._mailer.send(order.email, "Order confirmed",
                          f"Order {order.id} received.")

# In a test:
gateway = FakeGateway()
mailer  = SpyMailer()
sut     = OrderProcessor(gateway, mailer)

sut.process(test_order)

assert mailer.was_called
```

```rust
pub struct OrderProcessor {
    gateway: Box<dyn PaymentGateway>,
    mailer:  Box<dyn Mailer>,
}

impl OrderProcessor {
    pub fn new(gateway: Box<dyn PaymentGateway>, mailer: Box<dyn Mailer>) -> Self {
        Self { gateway, mailer }
    }

    pub fn process(&self, order: &Order) {
        self.gateway.charge(order.amount_cents, &order.card_token);
        self.mailer.send(&order.email, "Order confirmed",
                         &format!("Order {} received.", order.id));
    }
}

// In a test:
let sut = OrderProcessor::new(
    Box::new(FakeGateway::new()),
    Box::new(SpyMailer::new()),
);

sut.process(&test_order);
```

```cpp
class OrderProcessor {
    IPaymentGateway& gateway_;
    IMailer& mailer_;
public:
    OrderProcessor(IPaymentGateway& gateway, IMailer& mailer)
        : gateway_(gateway), mailer_(mailer) {}

    void process(const Order& order) {
        gateway_.charge(order.amount_cents, order.card_token);
        mailer_.send(order.email, "Order confirmed",
                     "Order " + order.id + " received.");
    }
};

// In a test:
FakeGateway gateway;
SpyMailer   mailer;
OrderProcessor sut{gateway, mailer};

sut.process(test_order);

assert(mailer.was_called());
```

</CodeTabs>

This is the default choice. Dependencies are visible in the signature, immutable after construction, and easy to substitute. If you can touch the constructor, start here.

> **Note**
> Rust has a second flavour: generic type parameters (`OrderProcessor<G: PaymentGateway, M: Mailer>`) give zero-cost monomorphisation but encode the full concrete type into the struct type itself. `Box<dyn Trait>` pays a small runtime cost and keeps the type simple. The trade-off matters most when building deep object graphs — covered in [Null Construction](null-construction).

## Property Injection

When the constructor is off-limits — the class is created by a framework or a factory you do not own — a writable property offers a second entry point. A sensible default is set at construction; tests replace it before use.

<CodeTabs langs="python,rust,cpp">

```python
class OrderProcessor:
    def __init__(self) -> None:
        # Real implementations as defaults.
        self.gateway: PaymentGateway = StripeGateway()
        self.mailer:  Mailer         = SmtpMailer("smtp.example.com")

    def process(self, order: Order) -> None:
        self.gateway.charge(order.amount_cents, order.card_token)
        self.mailer.send(order.email, "Order confirmed",
                         f"Order {order.id} received.")

# In a test — the framework creates the instance, the test patches it:
sut = OrderProcessor()
sut.gateway = FakeGateway()
sut.mailer  = SpyMailer()

sut.process(test_order)

assert sut.mailer.was_called
```

```rust
use std::sync::{Arc, Mutex};

pub struct OrderProcessor {
    gateway: Arc<dyn PaymentGateway>,
    mailer:  Arc<dyn Mailer>,
}

impl Default for OrderProcessor {
    fn default() -> Self {
        Self {
            gateway: Arc::new(StripeGateway::new()),
            mailer:  Arc::new(SmtpMailer::new("smtp.example.com")),
        }
    }
}

impl OrderProcessor {
    pub fn set_gateway(&mut self, g: Arc<dyn PaymentGateway>) { self.gateway = g; }
    pub fn set_mailer (&mut self, m: Arc<dyn Mailer>)          { self.mailer  = m; }

    pub fn process(&self, order: &Order) {
        self.gateway.charge(order.amount_cents, &order.card_token);
        self.mailer.send(&order.email, "Order confirmed",
                         &format!("Order {} received.", order.id));
    }
}

// In a test:
let mut sut = OrderProcessor::default();
sut.set_gateway(Arc::new(FakeGateway::new()));
sut.set_mailer(Arc::new(SpyMailer::new()));

sut.process(&test_order);
```

```cpp
class OrderProcessor {
public:
    // Public by design — the seam is intentional.
    std::unique_ptr<IPaymentGateway> gateway = std::make_unique<StripeGateway>();
    std::unique_ptr<IMailer>         mailer  = std::make_unique<SmtpMailer>("smtp.example.com");

    void process(const Order& order) {
        gateway->charge(order.amount_cents, order.card_token);
        mailer->send(order.email, "Order confirmed",
                     "Order " + order.id + " received.");
    }
};

// In a test — framework creates the instance, test replaces properties:
OrderProcessor sut;
sut.gateway = std::make_unique<FakeGateway>();
sut.mailer  = std::make_unique<SpyMailer>();

sut.process(test_order);

assert(static_cast<SpyMailer*>(sut.mailer.get())->was_called());
```

</CodeTabs>

The default-value pattern is what separates this from sloppy mutation: production code that never touches the properties gets real behaviour automatically. The cost is that dependencies are invisible in the constructor signature — a reader has to know to look for settable fields.

## Method Parameter Injection

When only one method in the class uses a dependency, pulling it into the constructor means all other methods carry a field they never touch. Method parameter injection keeps the dependency local to where it is needed.

<CodeTabs langs="python,rust,cpp">

```python
class OrderProcessor:
    def process(self,
                order:   Order,
                gateway: PaymentGateway,
                mailer:  Mailer) -> None:
        gateway.charge(order.amount_cents, order.card_token)
        mailer.send(order.email, "Order confirmed",
                    f"Order {order.id} received.")

# In production:
processor.process(order, StripeGateway(), SmtpMailer("smtp.example.com"))

# In a test:
processor.process(test_order, FakeGateway(), SpyMailer())
```

```rust
impl OrderProcessor {
    pub fn process(
        &self,
        order:   &Order,
        gateway: &dyn PaymentGateway,
        mailer:  &dyn Mailer,
    ) {
        gateway.charge(order.amount_cents, &order.card_token);
        mailer.send(&order.email, "Order confirmed",
                    &format!("Order {} received.", order.id));
    }
}

// In production:
processor.process(&order, &StripeGateway::new(), &SmtpMailer::new("smtp.example.com"));

// In a test:
processor.process(&test_order, &FakeGateway::new(), &SpyMailer::new());
```

```cpp
class OrderProcessor {
public:
    void process(const Order& order,
                 IPaymentGateway& gateway,
                 IMailer& mailer) {
        gateway.charge(order.amount_cents, order.card_token);
        mailer.send(order.email, "Order confirmed",
                    "Order " + order.id + " received.");
    }
};

// In production:
StripeGateway gateway;
SmtpMailer    mailer{"smtp.example.com"};
processor.process(order, gateway, mailer);

// In a test:
FakeGateway gateway;
SpyMailer   mailer;

processor.process(test_order, gateway, mailer);
```

</CodeTabs>

Nothing in the class changes except the signature. This is the most surgical option and works well for utility-style classes with no long-lived state. The trade-off is that callers are now responsible for supplying dependencies on every call, which becomes unwieldy when there are many call sites or when the real implementation is expensive to construct.

## Extract and Override

The three techniques above all change the way the class is _used_. Extract and override cuts the seam inside the class itself: move the dependency creation into a virtual method, then subclass in the test to return a double. The public interface stays untouched.

This is the seam of last resort for code you cannot restructure — when you cannot change the constructor, cannot add properties, and cannot change a method signature.

<CodeTabs langs="python,rust,cpp">

```python
class OrderProcessor:
    # The seam: extracted factory methods, overridable by a subclass.
    def _make_gateway(self) -> PaymentGateway:
        return StripeGateway()

    def _make_mailer(self) -> Mailer:
        return SmtpMailer("smtp.example.com")

    def process(self, order: Order) -> None:
        gateway = self._make_gateway()
        mailer  = self._make_mailer()
        gateway.charge(order.amount_cents, order.card_token)
        mailer.send(order.email, "Order confirmed",
                    f"Order {order.id} received.")

# In a test — subclass lives only in the test file:
class TestableOrderProcessor(OrderProcessor):
    def __init__(self) -> None:
        super().__init__()
        self.gateway = FakeGateway()
        self.mailer  = SpyMailer()

    def _make_gateway(self) -> PaymentGateway: return self.gateway
    def _make_mailer(self)  -> Mailer:         return self.mailer

sut = TestableOrderProcessor()
sut.process(test_order)
assert sut.mailer.was_called
```

```rust
// Rust has no inheritance. The closest structural equivalent is a trait with
// default method bodies — the production struct uses the defaults, a test struct
// overrides them. In practice, reaching for constructor injection with Box<dyn>
// is almost always cleaner than this pattern in Rust.
pub trait Processable {
    fn make_gateway(&self) -> Box<dyn PaymentGateway> {
        Box::new(StripeGateway::new())
    }
    fn make_mailer(&self) -> Box<dyn Mailer> {
        Box::new(SmtpMailer::new("smtp.example.com"))
    }
    fn process(&self, order: &Order) {
        let g = self.make_gateway();
        let m = self.make_mailer();
        g.charge(order.amount_cents, &order.card_token);
        m.send(&order.email, "Order confirmed",
               &format!("Order {} received.", order.id));
    }
}

pub struct OrderProcessor;
impl Processable for OrderProcessor {} // uses trait defaults

// In a test — separate impl, no changes to production types:
struct TestProcessor { gateway: FakeGateway, mailer: SpyMailer }
impl Processable for TestProcessor {
    fn make_gateway(&self) -> Box<dyn PaymentGateway> { Box::new(self.gateway.clone()) }
    fn make_mailer (&self) -> Box<dyn Mailer>          { Box::new(self.mailer.clone()) }
}
```

```cpp
class OrderProcessor {
protected:
    // The seam: virtual factory methods with real defaults.
    virtual std::unique_ptr<IPaymentGateway> make_gateway() {
        return std::make_unique<StripeGateway>();
    }
    virtual std::unique_ptr<IMailer> make_mailer() {
        return std::make_unique<SmtpMailer>("smtp.example.com");
    }

public:
    void process(const Order& order) {
        auto gateway = make_gateway();
        auto mailer  = make_mailer();
        gateway->charge(order.amount_cents, order.card_token);
        mailer->send(order.email, "Order confirmed",
                     "Order " + order.id + " received.");
    }
};

// In a test — subclass lives only in the test file:
class TestableOrderProcessor : public OrderProcessor {
public:
    FakeGateway* gateway_ptr = nullptr;
    SpyMailer*   mailer_ptr  = nullptr;

protected:
    std::unique_ptr<IPaymentGateway> make_gateway() override {
        auto g = std::make_unique<FakeGateway>();
        gateway_ptr = g.get();
        return g;
    }
    std::unique_ptr<IMailer> make_mailer() override {
        auto m = std::make_unique<SpyMailer>();
        mailer_ptr = m.get();
        return m;
    }
};

TestableOrderProcessor sut;
sut.process(test_order);
assert(sut.mailer_ptr && sut.mailer_ptr->was_called());
```

</CodeTabs>

The test subclass is not production code — it lives entirely in the test file. The only footprint left in production is `virtual`/`protected` on the factory methods.

> **Warning**
> If the base constructor calls a virtual factory method, the override runs before the subclass is fully constructed. This causes confusing failures. Only use this seam when the factory methods are called from a non-constructor method.

## Which Seam to Use

| Seam                       | Best when                                                   |
| -------------------------- | ----------------------------------------------------------- |
| Constructor injection      | Starting fresh, or you can touch the constructor            |
| Method parameter injection | Only one method uses the dependency                         |
| Property injection         | Constructor is off-limits; framework controls instantiation |
| Extract and override       | None of the above; public interface cannot change           |

## Full Solution

Below is every `OrderProcessor` variant and a test for each seam type, collected into one block per language. Use this as a quick reference — each approach is self-contained.

<CodeTabs langs="python,rust,cpp" playground>

```python
from typing import Protocol
from dataclasses import dataclass

# ── Domain ──────────────────────────────────────────────────

class PaymentGateway(Protocol):
    def charge(self, amount_cents: int, card_token: str) -> None: ...

class Mailer(Protocol):
    def send(self, to: str, subject: str, body: str) -> None: ...

@dataclass
class Order:
    id:           str
    amount_cents: int
    card_token:   str
    email:        str

# ── Production stubs (stand-ins for real implementations) ──

class StripeGateway:
    def charge(self, amount_cents: int, card_token: str) -> None:
        pass  # would hit Stripe API

class SmtpMailer:
    def __init__(self, host: str) -> None:
        self.host = host
    def send(self, to: str, subject: str, body: str) -> None:
        pass  # would send real email

# ── Test doubles ────────────────────────────────────────────

class FakeGateway:
    def charge(self, amount_cents: int, card_token: str) -> None:
        pass

class SpyMailer:
    def __init__(self) -> None:
        self.was_called = False
    def send(self, to: str, subject: str, body: str) -> None:
        self.was_called = True

test_order = Order(id="42", amount_cents=999, card_token="tok_test", email="a@b.com")

# ── 1. Constructor Injection ───────────────────────────────

class CtorOrderProcessor:
    def __init__(self, gateway: PaymentGateway, mailer: Mailer) -> None:
        self._gateway = gateway
        self._mailer  = mailer

    def process(self, order: Order) -> None:
        self._gateway.charge(order.amount_cents, order.card_token)
        self._mailer.send(order.email, "Order confirmed",
                          f"Order {order.id} received.")

def test_ctor() -> None:
    gw = FakeGateway()
    ml = SpyMailer()

    CtorOrderProcessor(gw, ml).process(test_order)

    assert ml.was_called

# ── 2. Property Injection ──────────────────────────────────

class PropOrderProcessor:
    def __init__(self) -> None:
        self.gateway: PaymentGateway = StripeGateway()          # default
        self.mailer:  Mailer         = SmtpMailer("smtp.ex.com") # default

    def process(self, order: Order) -> None:
        self.gateway.charge(order.amount_cents, order.card_token)
        self.mailer.send(order.email, "Order confirmed",
                         f"Order {order.id} received.")

def test_prop() -> None:
    sut = PropOrderProcessor()
    sut.gateway = FakeGateway()
    sut.mailer  = SpyMailer()

    sut.process(test_order)

    assert sut.mailer.was_called

# ── 3. Method Parameter Injection ──────────────────────────

class ParamOrderProcessor:
    def process(self, order: Order,
                gateway: PaymentGateway, mailer: Mailer) -> None:
        gateway.charge(order.amount_cents, order.card_token)
        mailer.send(order.email, "Order confirmed",
                    f"Order {order.id} received.")

def test_param() -> None:
    ml = SpyMailer()

    ParamOrderProcessor().process(test_order, FakeGateway(), ml)

    assert ml.was_called

# ── 4. Extract and Override ────────────────────────────────

class ExtractOrderProcessor:
    def _make_gateway(self) -> PaymentGateway: return StripeGateway()
    def _make_mailer(self)  -> Mailer:         return SmtpMailer("smtp.ex.com")

    def process(self, order: Order) -> None:
        gw = self._make_gateway()
        ml = self._make_mailer()
        gw.charge(order.amount_cents, order.card_token)
        ml.send(order.email, "Order confirmed",
                f"Order {order.id} received.")

class TestableOrderProcessor(ExtractOrderProcessor):
    def __init__(self) -> None:
        super().__init__()
        self.gateway = FakeGateway()
        self.mailer  = SpyMailer()
    def _make_gateway(self) -> PaymentGateway: return self.gateway
    def _make_mailer(self)  -> Mailer:         return self.mailer

def test_extract() -> None:
    sut = TestableOrderProcessor()

    sut.process(test_order)

    assert sut.mailer.was_called

# ── Run all tests ──────────────────────────────────────────

test_ctor();    print("ctor .......... passed")
test_prop();    print("prop .......... passed")
test_param();   print("param ......... passed")
test_extract(); print("extract ....... passed")
```

```rust
#![cfg(test)]

use std::sync::Arc;

// ── Domain ──────────────────────────────────────────────────

pub trait PaymentGateway {
    fn charge(&self, amount_cents: u32, card_token: &str);
}
pub trait Mailer {
    fn send(&self, to: &str, subject: &str, body: &str);
}

pub struct Order {
    pub id: String, pub amount_cents: u32,
    pub card_token: String, pub email: String,
}

// ── Production stubs (stand-ins for real implementations) ──

struct StripeGateway;
impl StripeGateway { fn new() -> Self { Self } }
impl PaymentGateway for StripeGateway {
    fn charge(&self, _: u32, _: &str) {} // would hit Stripe API
}

struct SmtpMailer { _host: String }
impl SmtpMailer {
    fn new(host: &str) -> Self { Self { _host: host.into() } }
}
impl Mailer for SmtpMailer {
    fn send(&self, _: &str, _: &str, _: &str) {} // would send real email
}

// ── Test doubles ────────────────────────────────────────────

#[derive(Clone)]
struct FakeGateway;
impl PaymentGateway for FakeGateway {
    fn charge(&self, _: u32, _: &str) {}
}

#[derive(Clone)]
struct SpyMailer { called: std::cell::Cell<bool> }
impl SpyMailer {
    fn new() -> Self { Self { called: std::cell::Cell::new(false) } }
    fn was_called(&self) -> bool { self.called.get() }
}
impl Mailer for SpyMailer {
    fn send(&self, _: &str, _: &str, _: &str) { self.called.set(true); }
}

fn test_order() -> Order {
    Order { id: "42".into(), amount_cents: 999,
            card_token: "tok_test".into(), email: "a@b.com".into() }
}

// ── 1. Constructor Injection ───────────────────────────────

mod ctor {
    use super::*;
    pub struct OrderProcessor {
        gateway: Box<dyn PaymentGateway>,
        mailer:  Box<dyn Mailer>,
    }
    impl OrderProcessor {
        pub fn new(gateway: Box<dyn PaymentGateway>,
                   mailer:  Box<dyn Mailer>) -> Self {
            Self { gateway, mailer }
        }
        pub fn process(&self, order: &Order) {
            self.gateway.charge(order.amount_cents, &order.card_token);
            self.mailer.send(&order.email, "Order confirmed",
                             &format!("Order {} received.", order.id));
        }
    }

    #[test]
    fn test() {
        let ml = std::rc::Rc::new(SpyMailer::new());
        let sut = OrderProcessor::new(
            Box::new(FakeGateway), Box::new(ml.clone()));

        sut.process(&test_order());

        assert!(ml.was_called());
    }
}

// ── 2. Property Injection ──────────────────────────────────

mod prop {
    use super::*;
    pub struct OrderProcessor {
        pub gateway: Arc<dyn PaymentGateway>,
        pub mailer:  Arc<dyn Mailer>,
    }
    impl Default for OrderProcessor {
        fn default() -> Self {
            Self {
                gateway: Arc::new(StripeGateway::new()),
                mailer:  Arc::new(SmtpMailer::new("smtp.example.com")),
            }
        }
    }
    impl OrderProcessor {
        pub fn process(&self, order: &Order) {
            self.gateway.charge(order.amount_cents, &order.card_token);
            self.mailer.send(&order.email, "Order confirmed",
                             &format!("Order {} received.", order.id));
        }
    }

    #[test]
    fn test() {
        let ml = Arc::new(SpyMailer::new());
        let mut sut = OrderProcessor::default();
        sut.gateway = Arc::new(FakeGateway);
        sut.mailer  = ml.clone();

        sut.process(&test_order());

        assert!(ml.was_called());
    }
}

// ── 3. Method Parameter Injection ──────────────────────────

mod param {
    use super::*;
    pub struct OrderProcessor;
    impl OrderProcessor {
        pub fn process(&self, order: &Order,
                       gateway: &dyn PaymentGateway,
                       mailer:  &dyn Mailer) {
            gateway.charge(order.amount_cents, &order.card_token);
            mailer.send(&order.email, "Order confirmed",
                        &format!("Order {} received.", order.id));
        }
    }

    #[test]
    fn test() {
        let ml = SpyMailer::new();

        OrderProcessor.process(&test_order(), &FakeGateway, &ml);

        assert!(ml.was_called());
    }
}

// ── 4. Extract and Override ────────────────────────────────

mod extract {
    use super::*;
    pub trait Processable {
        fn make_gateway(&self) -> Box<dyn PaymentGateway> {
            Box::new(StripeGateway::new())
        }
        fn make_mailer(&self) -> Box<dyn Mailer> {
            Box::new(SmtpMailer::new("smtp.example.com"))
        }
        fn process(&self, order: &Order) {
            let g = self.make_gateway();
            let m = self.make_mailer();
            g.charge(order.amount_cents, &order.card_token);
            m.send(&order.email, "Order confirmed",
                   &format!("Order {} received.", order.id));
        }
    }

    pub struct OrderProcessor;
    impl Processable for OrderProcessor {}

    #[test]
    fn test() {
        struct TestProc(FakeGateway, SpyMailer);
        impl Processable for TestProc {
            fn make_gateway(&self) -> Box<dyn PaymentGateway> {
                Box::new(self.0.clone())
            }
            fn make_mailer(&self) -> Box<dyn Mailer> {
                Box::new(self.1.clone())
            }
        }
        let ml = SpyMailer::new();
        let sut = TestProc(FakeGateway, ml.clone());

        sut.process(&test_order());
        // SpyMailer uses Cell, clone shares state
    }
}

fn main() {}
```

```cpp
#include <memory>
#include <string>
#include <cassert>
#include <iostream>

// ── Domain ──────────────────────────────────────────────────

struct IPaymentGateway {
    virtual void charge(int amount_cents, const std::string& token) = 0;
    virtual ~IPaymentGateway() = default;
};

struct IMailer {
    virtual void send(const std::string& to, const std::string& subject,
                      const std::string& body) = 0;
    virtual ~IMailer() = default;
};

struct Order {
    std::string id;
    int         amount_cents;
    std::string card_token;
    std::string email;
};

// ── Production stubs (stand-ins for real implementations) ──

struct StripeGateway : IPaymentGateway {
    void charge(int, const std::string&) override {} // would hit Stripe API
};

struct SmtpMailer : IMailer {
    std::string host_;
    SmtpMailer(const std::string& host) : host_(host) {}
    void send(const std::string&, const std::string&,
              const std::string&) override {} // would send real email
};

// ── Test doubles ────────────────────────────────────────────

struct FakeGateway : IPaymentGateway {
    void charge(int, const std::string&) override {}
};

struct SpyMailer : IMailer {
    bool was_called_ = false;
    void send(const std::string&, const std::string&,
              const std::string&) override { was_called_ = true; }
    bool was_called() const { return was_called_; }
};

Order test_order{"42", 999, "tok_test", "a@b.com"};

// ── 1. Constructor Injection ───────────────────────────────

namespace ctor {
class OrderProcessor {
    IPaymentGateway& gateway_;
    IMailer& mailer_;
public:
    OrderProcessor(IPaymentGateway& gw, IMailer& ml)
        : gateway_(gw), mailer_(ml) {}
    void process(const Order& o) {
        gateway_.charge(o.amount_cents, o.card_token);
        mailer_.send(o.email, "Order confirmed",
                     "Order " + o.id + " received.");
    }
};

void test() {
    FakeGateway gw; SpyMailer ml;
    OrderProcessor sut{gw, ml};

    sut.process(test_order);

    assert(ml.was_called());
}
} // namespace ctor

// ── 2. Property Injection ──────────────────────────────────

namespace prop {
class OrderProcessor {
public:
    std::unique_ptr<IPaymentGateway> gateway = std::make_unique<StripeGateway>();
    std::unique_ptr<IMailer>         mailer  = std::make_unique<SmtpMailer>("smtp.example.com");
    void process(const Order& o) {
        gateway->charge(o.amount_cents, o.card_token);
        mailer->send(o.email, "Order confirmed",
                     "Order " + o.id + " received.");
    }
};

void test() {
    OrderProcessor sut;
    sut.gateway = std::make_unique<FakeGateway>();
    sut.mailer  = std::make_unique<SpyMailer>();

    sut.process(test_order);

    assert(static_cast<SpyMailer*>(sut.mailer.get())->was_called());
}
} // namespace prop

// ── 3. Method Parameter Injection ──────────────────────────

namespace param {
class OrderProcessor {
public:
    void process(const Order& o,
                 IPaymentGateway& gw, IMailer& ml) {
        gw.charge(o.amount_cents, o.card_token);
        ml.send(o.email, "Order confirmed",
                "Order " + o.id + " received.");
    }
};

void test() {
    FakeGateway gw; SpyMailer ml;
    OrderProcessor sut;

    sut.process(test_order, gw, ml);

    assert(ml.was_called());
}
} // namespace param

// ── 4. Extract and Override ────────────────────────────────

namespace extract {
class OrderProcessor {
protected:
    virtual std::unique_ptr<IPaymentGateway> make_gateway() {
        return std::make_unique<StripeGateway>();
    }
    virtual std::unique_ptr<IMailer> make_mailer() {
        return std::make_unique<SmtpMailer>("smtp.example.com");
    }
public:
    virtual ~OrderProcessor() = default;
    void process(const Order& o) {
        auto gw = make_gateway();
        auto ml = make_mailer();
        gw->charge(o.amount_cents, o.card_token);
        ml->send(o.email, "Order confirmed",
                 "Order " + o.id + " received.");
    }
};

class TestableOrderProcessor : public OrderProcessor {
public:
    SpyMailer* mailer_ptr = nullptr;
protected:
    std::unique_ptr<IPaymentGateway> make_gateway() override {
        return std::make_unique<FakeGateway>();
    }
    std::unique_ptr<IMailer> make_mailer() override {
        auto m = std::make_unique<SpyMailer>();
        mailer_ptr = m.get();
        return m;
    }
};

void test() {
    TestableOrderProcessor sut;
    sut.process(test_order);
    assert(sut.mailer_ptr && sut.mailer_ptr->was_called());
}
} // namespace extract

int main() {
    ctor::test();    std::cout << "ctor .......... passed\n";
    prop::test();    std::cout << "prop .......... passed\n";
    param::test();   std::cout << "param ......... passed\n";
    extract::test(); std::cout << "extract ....... passed\n";
    return 0;
}
```

</CodeTabs>

These four techniques answer _how to make a dependency substitutable_. Once an entire graph of types is injectable, a second problem emerges: assembling all those test fixtures becomes its own maintenance burden. That is covered in [Null Construction](null-construction).
