---
title: 'Seams: Where Code Becomes Testable'
date: '2026-03-25'
description: 'Five cross-language seams for inserting test doubles — constructor, property, method parameter, extract-and-override, and closure injection — plus Python module patching and Rust-specific techniques, with examples throughout.'
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

def test_constructor_injection() -> None:
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

#[test]
fn test_constructor_injection() {
    let spy = std::rc::Rc::new(SpyMailer::new());
    let sut = OrderProcessor::new(
        Box::new(FakeGateway::new()),
        Box::new(spy.clone()),
    );

    sut.process(&test_order);

    assert!(spy.was_called());
}
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

void test_constructor_injection() {
    FakeGateway gateway;
    SpyMailer   mailer;
    OrderProcessor sut{gateway, mailer};

    sut.process(test_order);

    assert(mailer.was_called());
}
```

</CodeTabs>

This is the default choice. Dependencies are visible in the signature, immutable after construction, and easy to substitute. If you can touch the constructor, start here.

> **Note**
> Rust has a second flavour: generic type parameters (`OrderProcessor<G: PaymentGateway, M: Mailer>`) give zero-cost monomorphisation at the cost of encoding the concrete type into the struct type itself. The full trade-off is covered in the Rust: Static Dispatch section below.

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

def test_property_injection() -> None:
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

#[test]
fn test_property_injection() {
    let spy = Arc::new(SpyMailer::new());
    let mut sut = OrderProcessor::default();
    sut.set_gateway(Arc::new(FakeGateway::new()));
    sut.set_mailer(spy.clone());

    sut.process(&test_order);

    assert!(spy.was_called());
}
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

void test_property_injection() {
    OrderProcessor sut;
    sut.gateway = std::make_unique<FakeGateway>();
    sut.mailer  = std::make_unique<SpyMailer>();

    sut.process(test_order);

    assert(static_cast<SpyMailer*>(sut.mailer.get())->was_called());
}
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

def test_method_parameter_injection() -> None:
    spy = SpyMailer()

    OrderProcessor().process(test_order, FakeGateway(), spy)

    assert spy.was_called
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

#[test]
fn test_method_parameter_injection() {
    let spy = SpyMailer::new();

    OrderProcessor.process(&test_order, &FakeGateway::new(), &spy);

    assert!(spy.was_called());
}
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

void test_method_parameter_injection() {
    FakeGateway gateway;
    SpyMailer   mailer;

    OrderProcessor{}.process(test_order, gateway, mailer);

    assert(mailer.was_called());
}
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

def test_extract_and_override() -> None:
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

#[test]
fn test_extract_and_override() {
    let spy = SpyMailer::new();
    let sut = TestProcessor { gateway: FakeGateway::new(), mailer: spy.clone() };

    sut.process(&test_order);

    assert!(spy.was_called());
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

void test_extract_and_override() {
    TestableOrderProcessor sut;

    sut.process(test_order);

    assert(sut.mailer_ptr && sut.mailer_ptr->was_called());
}
```

</CodeTabs>

The test subclass is not production code — it lives entirely in the test file. The only footprint left in production is `virtual`/`protected` on the factory methods.

> **Warning**
> If the base constructor calls a virtual factory method, the override runs before the subclass is fully constructed. This causes confusing failures. Only use this seam when the factory methods are called from a non-constructor method.

## Closure and Function Injection

A single-method interface is structurally equivalent to a function. When a dependency does exactly one thing, there is no need to name and implement a full type — pass a callable instead. This reduces ceremony at the call site and, in tests, allows an inline lambda to replace a purpose-built double.

<CodeTabs langs="python,rust,cpp">

```python
from typing import Callable

class OrderProcessor:
    def process(self,
                order:  Order,
                charge: Callable[[int, str], None],
                send:   Callable[[str, str, str], None]) -> None:
        charge(order.amount_cents, order.card_token)
        send(order.email, "Order confirmed",
             f"Order {order.id} received.")

# In production:
processor.process(
    order,
    lambda amt, tok: StripeGateway().charge(amt, tok),
    lambda to, subj, body: SmtpMailer("smtp.example.com").send(to, subj, body),
)

def test_closure_injection() -> None:
    sent: list[str] = []

    OrderProcessor().process(
        test_order,
        lambda amt, tok: None,
        lambda to, subj, body: sent.append(to),
    )

    assert sent == ["a@b.com"]
```

```rust
impl OrderProcessor {
    pub fn process(
        &self,
        order:  &Order,
        charge: impl Fn(u32, &str),
        send:   impl Fn(&str, &str, &str),
    ) {
        charge(order.amount_cents, &order.card_token);
        send(&order.email, "Order confirmed",
             &format!("Order {} received.", order.id));
    }
}

// In production:
let gw = StripeGateway::new();
let ml = SmtpMailer::new("smtp.example.com");
processor.process(&order, |amt, tok| gw.charge(amt, tok), |to, s, b| ml.send(to, s, b));

#[test]
fn test_closure_injection() {
    let sent = std::cell::Cell::new(false);

    OrderProcessor.process(
        &test_order(),
        |_, _| {},
        |_, _, _| sent.set(true),
    );

    assert!(sent.get());
}
```

```cpp
class OrderProcessor {
    using ChargeFn = std::function<void(int, const std::string&)>;
    using SendFn   = std::function<void(const std::string&, const std::string&, const std::string&)>;
public:
    void process(const Order& order, ChargeFn charge, SendFn send) {
        charge(order.amount_cents, order.card_token);
        send(order.email, "Order confirmed",
             "Order " + order.id + " received.");
    }
};

void test_closure_injection() {
    bool sent = false;
    OrderProcessor sut;

    sut.process(
        test_order,
        [](int, const std::string&) {},
        [&sent](const std::string&, const std::string&, const std::string&) { sent = true; }
    );

    assert(sent);
}
```

</CodeTabs>

This is method parameter injection reduced to its minimum surface area. When the callable is simple enough to fit in a lambda, prefer this over a full interface. If it grows — needs configuration, internal state, or multiple operations — extract it back to an interface and use constructor injection.

## Python: Module Seam

Python resolves names at runtime through each module's own namespace. When `order_processor.py` imports a module, the name becomes an entry in `order_processor.__dict__`. Any code that calls through that name looks it up in that dictionary at the moment of the call — not at import time, not at definition time.

This means you can replace the binding in a module's namespace and any subsequent calls in that module will hit your replacement. `unittest.mock.patch` is the standard tool for this.

<CodeTabs langs="python">

```python
# order_processor.py — no injection; dependencies called directly via module names
import stripe as _stripe
import mailer as _mailer

def process(order: Order) -> None:
    _stripe.charge(order.amount_cents, order.card_token)
    _mailer.send(order.email, "Order confirmed",
                 f"Order {order.id} received.")

# ── test ────────────────────────────────────────────────────
from unittest.mock import patch, MagicMock

def test_module_seam() -> None:
    spy_mailer = MagicMock()

    with patch("order_processor._stripe"), \
         patch("order_processor._mailer", spy_mailer):
        process(test_order)

    spy_mailer.send.assert_called_once()
```

</CodeTabs>

> **Warning**
> Patch the name where it is **used**, not where it is **defined**. `patch("order_processor._stripe")` works because it replaces the binding in `order_processor`'s namespace. Patching `"stripe.charge"` targets the original module — but `order_processor` already holds its own reference, so the patch never intercepts the call. Getting this wrong silently does nothing.

This seam requires no changes to production code at all. The cost is that the test is coupled to the module's import structure rather than its public interface, and the substitution is invisible from the call site.

## Rust: Static Dispatch

Constructor injection in Rust defaults to `Box<dyn Trait>` — the concrete type is selected at construction and erased from the struct's type. The alternative is a generic type parameter: the concrete type is encoded into the struct type at compile time and the compiler generates a specialised implementation for each combination. This is zero-cost — no vtable, no heap allocation — but the full concrete type appears in the type signature everywhere the struct is used.

<CodeTabs langs="rust">

```rust
pub struct OrderProcessor<G: PaymentGateway, M: Mailer> {
    gateway: G,
    mailer:  M,
}

impl<G: PaymentGateway, M: Mailer> OrderProcessor<G, M> {
    pub fn new(gateway: G, mailer: M) -> Self {
        Self { gateway, mailer }
    }

    pub fn process(&self, order: &Order) {
        self.gateway.charge(order.amount_cents, &order.card_token);
        self.mailer.send(&order.email, "Order confirmed",
                         &format!("Order {} received.", order.id));
    }
}

// Production type is fully visible: OrderProcessor<StripeGateway, SmtpMailer>
let sut = OrderProcessor::new(StripeGateway::new(), SmtpMailer::new("smtp.example.com"));

#[test]
fn test_static_dispatch() {
    let ml = SpyMailer::new();
    // Type is inferred as OrderProcessor<FakeGateway, SpyMailer>
    let sut = OrderProcessor::new(FakeGateway, ml.clone());

    sut.process(&test_order());

    assert!(ml.was_called());
}
```

</CodeTabs>

Use `Box<dyn Trait>` when the concrete type varies at runtime, when you are building a deep object graph where encoding every type parameter becomes unwieldy, or when the overhead is immaterial. Use generics when you need zero-cost dispatch and the caller always knows the concrete type at compile time. The seam itself — the trait boundary — is identical in both cases.

## Rust: Additive `#[cfg(test)]`

`#[cfg(test)]` can open a test entry point into a type without changing its production interface. The key distinction is **additive** versus **substitutive**:

- **Additive**: add methods, constructors, or derives that only exist in test builds.
- **Substitutive**: provide an entirely different `impl Trait for Type` under `#[cfg(test)]`.

The additive form is safe. The substitutive form creates two divergent implementations of the same type that can drift independently — the type system will not warn you.

<CodeTabs langs="rust">

```rust
// #[cfg_attr] adds derives only in test builds
#[cfg_attr(test, derive(Clone, PartialEq, Debug))]
pub struct Order {
    pub id:           String,
    pub amount_cents: u32,
    pub card_token:   String,
    pub email:        String,
}

pub struct OrderProcessor {
    gateway: Box<dyn PaymentGateway>,
    mailer:  Box<dyn Mailer>,
}

impl OrderProcessor {
    pub fn new(gateway: Box<dyn PaymentGateway>, mailer: Box<dyn Mailer>) -> Self {
        Self { gateway, mailer }
    }

    // Test-only constructor — erased from production binary
    #[cfg(test)]
    pub fn new_test(
        gateway: impl PaymentGateway + 'static,
        mailer:  impl Mailer + 'static,
    ) -> Self {
        Self { gateway: Box::new(gateway), mailer: Box::new(mailer) }
    }

    pub fn process(&self, order: &Order) {
        self.gateway.charge(order.amount_cents, &order.card_token);
        self.mailer.send(&order.email, "Order confirmed",
                         &format!("Order {} received.", order.id));
    }
}

#[test]
fn test_additive_cfg_test() {
    let ml = SpyMailer::new();
    let sut = OrderProcessor::new_test(FakeGateway, ml.clone());

    sut.process(&test_order());

    assert!(ml.was_called());
}
```

</CodeTabs>

> **Warning**
> Do not provide two different `impl Trait for Type` blocks separated by `#[cfg(not(test))]` and `#[cfg(test)]`. The implementations can drift independently — a change to the production impl does not force a corresponding update to the test impl, and the type system cannot detect the divergence. Use the seams above and inject the double at the boundary instead.

## Which Seam to Use

| Seam                       | Best when                                                        | Languages     |
| -------------------------- | ---------------------------------------------------------------- | ------------- |
| Constructor injection      | Starting fresh, or you can touch the constructor                 | All           |
| Method parameter injection | Only one method uses the dependency                              | All           |
| Property injection         | Constructor is off-limits; framework controls instantiation      | All           |
| Extract and override       | None of the above; public interface cannot change                | All           |
| Closure/function injection | Single-behaviour dependency; a lambda fits at the call site      | All           |
| Module seam                | Cannot change the call site at all                               | Python        |
| Static dispatch            | Zero-cost dispatch; concrete type is always known at compile time | Rust, C++    |
| Additive `#[cfg(test)]`    | Need a test entry point without changing the production API      | Rust          |

## Full Solution

Below is every `OrderProcessor` variant and a test for each seam type, collected into one block per language. Use this as a quick reference — each approach is self-contained.

<CodeTabs langs="python,rust,cpp" playground>

```python
from typing import Callable, Protocol
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

# ── 5. Closure/Function Injection ──────────────────────────

class ClosureOrderProcessor:
    def process(self, order: Order,
                charge: Callable[[int, str], None],
                send:   Callable[[str, str, str], None]) -> None:
        charge(order.amount_cents, order.card_token)
        send(order.email, "Order confirmed",
             f"Order {order.id} received.")

def test_closure() -> None:
    sent: list[str] = []

    ClosureOrderProcessor().process(
        test_order,
        lambda amt, tok: None,
        lambda to, subj, body: sent.append(to),
    )

    assert sent == ["a@b.com"]

# ── 6. Module Seam (Python only) ───────────────────────────
# Module-level names are looked up at call time. Replacing them in
# the module's __dict__ intercepts calls without touching the function.

from unittest.mock import MagicMock, patch

_gateway: PaymentGateway = StripeGateway()   # module-level — no injection
_mailer:  Mailer         = SmtpMailer("smtp.ex.com")

def flat_process(order: Order) -> None:
    _gateway.charge(order.amount_cents, order.card_token)
    _mailer.send(order.email, "Order confirmed",
                 f"Order {order.id} received.")

def test_module() -> None:
    spy = MagicMock()

    with patch("__main__._gateway"), \
         patch("__main__._mailer", spy):
        flat_process(test_order)

    spy.send.assert_called_once()

# ── Run all tests ──────────────────────────────────────────

test_ctor();     print("ctor .......... passed")
test_prop();     print("prop .......... passed")
test_param();    print("param ......... passed")
test_extract();  print("extract ....... passed")
test_closure();  print("closure ....... passed")
test_module();   print("module ........ passed")
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
struct SpyMailer { called: std::rc::Rc<std::cell::Cell<bool>> }
impl SpyMailer {
    fn new() -> Self { Self { called: std::rc::Rc::new(std::cell::Cell::new(false)) } }
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
        let ml = SpyMailer::new();
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

    #[expect(dead_code, reason = "represents the production type; tests use TestProc instead")]
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

        assert!(ml.was_called()); // clone shares the Rc<Cell<bool>>, so this sees the call
    }
}

// ── 5. Closure/Function Injection ──────────────────────────

mod closure {
    use super::*;
    pub struct OrderProcessor;
    impl OrderProcessor {
        pub fn process(
            &self,
            order:  &Order,
            charge: impl Fn(u32, &str),
            send:   impl Fn(&str, &str, &str),
        ) {
            charge(order.amount_cents, &order.card_token);
            send(&order.email, "Order confirmed",
                 &format!("Order {} received.", order.id));
        }
    }

    #[test]
    fn test() {
        let sent = std::cell::Cell::new(false);
        let sut = OrderProcessor;

        sut.process(
            &test_order(),
            |_, _| {},
            |_, _, _| sent.set(true),
        );

        assert!(sent.get());
    }
}

// ── 6. Static Dispatch (Generic Type Parameters) ───────────

mod static_dispatch {
    use super::*;
    pub struct OrderProcessor<G: PaymentGateway, M: Mailer> {
        gateway: G,
        mailer:  M,
    }
    impl<G: PaymentGateway, M: Mailer> OrderProcessor<G, M> {
        pub fn new(gateway: G, mailer: M) -> Self { Self { gateway, mailer } }
        pub fn process(&self, order: &Order) {
            self.gateway.charge(order.amount_cents, &order.card_token);
            self.mailer.send(&order.email, "Order confirmed",
                             &format!("Order {} received.", order.id));
        }
    }

    #[test]
    fn test() {
        let ml = SpyMailer::new();
        let sut = OrderProcessor::new(FakeGateway, ml.clone());

        sut.process(&test_order());

        assert!(ml.was_called());
    }
}

// ── 7. Additive #[cfg(test)] ────────────────────────────────

mod cfg_test {
    use super::*;
    pub struct OrderProcessor {
        gateway: Box<dyn PaymentGateway>,
        mailer:  Box<dyn Mailer>,
    }
    impl OrderProcessor {
        #[expect(unused, reason = "represents the production constructor; tests use new_test")]
        pub fn new(gateway: Box<dyn PaymentGateway>, mailer: Box<dyn Mailer>) -> Self {
            Self { gateway, mailer }
        }
        #[cfg(test)]
        pub fn new_test(
            gateway: impl PaymentGateway + 'static,
            mailer:  impl Mailer + 'static,
        ) -> Self {
            Self { gateway: Box::new(gateway), mailer: Box::new(mailer) }
        }
        pub fn process(&self, order: &Order) {
            self.gateway.charge(order.amount_cents, &order.card_token);
            self.mailer.send(&order.email, "Order confirmed",
                             &format!("Order {} received.", order.id));
        }
    }

    #[test]
    fn test() {
        let ml = SpyMailer::new();
        let sut = OrderProcessor::new_test(FakeGateway, ml.clone());

        sut.process(&test_order());

        assert!(ml.was_called());
    }
}

fn main() {}
```

```cpp
#include <functional>
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
    FakeGateway gw;
    SpyMailer ml;
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
    FakeGateway gw;
    SpyMailer ml;
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

// ── 5. Closure/Function Injection ──────────────────────────

namespace closure {
class OrderProcessor {
    using ChargeFn = std::function<void(int, const std::string&)>;
    using SendFn   = std::function<void(const std::string&, const std::string&, const std::string&)>;
public:
    void process(const Order& o, ChargeFn charge, SendFn send) {
        charge(o.amount_cents, o.card_token);
        send(o.email, "Order confirmed",
             "Order " + o.id + " received.");
    }
};

void test() {
    bool sent = false;
    OrderProcessor sut;

    sut.process(
        test_order,
        [](int, const std::string&) {},
        [&sent](const std::string&, const std::string&, const std::string&) { sent = true; }
    );

    assert(sent);
}
} // namespace closure

int main() {
    ctor::test();     std::cout << "ctor .......... passed\n";
    prop::test();     std::cout << "prop .......... passed\n";
    param::test();    std::cout << "param ......... passed\n";
    extract::test();  std::cout << "extract ....... passed\n";
    closure::test();  std::cout << "closure ....... passed\n";
    return 0;
}
```

</CodeTabs>

These four techniques answer _how to make a dependency substitutable_. Once an entire graph of types is injectable, a second problem emerges: assembling all those test fixtures becomes its own maintenance burden. That is covered in [Null Construction](null-construction).
