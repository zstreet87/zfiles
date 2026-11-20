# C++

Sources (read in full): [C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines)
(rule IDs), [Google C++ Style Guide](https://google.github.io/styleguide/cppguide.html)
(section anchors), [SEI CERT C++](https://cmu-sei.github.io/secure-coding-standards/sei-cert-cpp-coding-standard/)
(all 83 rule pages checked for their severity level). C [c.md](c.md) applies to the C subset.

## Ownership and resources
- **RAII for every resource:** memory, files, locks and handles. No naked
  `new` or `delete` outside resource-management classes. Hand each
  allocation to an owner immediately, with one allocation per statement
  (R.1, R.11–R.13).
- **Raw `T*` and `T&` never own** (I.11).
  - `unique_ptr` is the default owner. Use `shared_ptr` only for ownership
    that is really shared; it is slower and less predictable (R.21). Break
    cycles with `weak_ptr` (R.24).
- **Smart-pointer parameters only when the function manages lifetime**
  (R.30–R.36, F.7):
  - `unique_ptr<T>` by value: the function takes ownership.
  - `shared_ptr<T>` by value: the function shares ownership.
  - Otherwise pass `T&`, or `T*` if null is allowed.
- **Make a local copy of a global or aliased `shared_ptr` before calling
  through it.** A callee that resets it leaves you with a dangling pointer
  (R.37).
- **Never wrap an already-owned pointer in a second smart pointer**
  (MEM56-CPP). **Check `new(std::nothrow)` results**, and don't let
  `bad_alloc` escape a `noexcept` function (MEM52-CPP, L1).
- **Rule of zero** (C.20). If you declare any copy, move or destructor
  operation, declare all of them (C.21). Even `~X() = default;` suppresses
  the implicit move, so every move silently becomes a copy.
- **Destructors, `swap` and moves never fail; mark them `noexcept`**
  (C.36, C.37, C.66).
  - A base-class destructor is public and virtual, or protected and
    non-virtual (C.35).
- **Data member order:** a member must be declared before any member that
  uses it. Members are destroyed in reverse order, so a `jthread` member
  declared before the data it reads is a use-after-free (C.13).

## Interfaces and functions
- **Input parameters:** pass cheap types (2–3 words) by value and others
  by `const&`. Never use `&&` "for efficiency" (F.16).
- **Return values instead of output parameters;** use a named struct for
  several values (F.20, F.21).
- **Never return a pointer or reference to a local.** Never `return
  std::move(local)`; it blocks return-value optimisation (F.43, F.48,
  ES.56).
- **Don't require a reference parameter to outlive the call;** it may be
  bound to a temporary (Google "Inputs and Outputs").
- **Use `span` / `string_view` for non-owning views,** never a pointer plus
  a count (I.13).
- **Use `not_null`, or a reference, when null is invalid** (I.12).
- **Type parameters strongly:** no `void*`, no `bool` flags (use an enum
  or an options struct), `chrono` types for durations, and at most about
  4 parameters (I.4, I.23, Google "Function Argument Comments").
- **Mark single-argument constructors and conversion operators
  `explicit`** (C.46, C.164, Google "Implicit Conversions").
- **Constructors:** a constructor fully initializes the object or fails.
  Use a factory function for fallible construction, and never call
  virtual functions in constructors (C.41, C.50, C.82).
- **Class hierarchies:**
  - Each override says exactly one of `virtual`, `override` or `final`
    (C.128).
  - Polymorphic types disable public copying to prevent slicing (C.67).
- **Constrain every template parameter with a concept** (T.10). Don't
  specialise function templates (T.144).

## Expressions
- **Always initialize** (ES.20). Prefer `{}` initialization to reject
  narrowing (ES.23). Watch the trap: `std::vector<int> v{100, 1}` has two
  elements, not 100.
- **`const` and `constexpr` by default** (Con.1, Con.5).
- **Use named casts only** (ES.48, ES.49):
  - Never cast away `const`.
  - Use `std::bit_cast` for type punning, never a union (C.183).
  - Use `std::ignore =` to discard a `[[nodiscard]]` result.
- **Integers:**
  - Signed for arithmetic, unsigned only for bit manipulation (ES.100–ES.107,
    Google "On Unsigned Integers").
  - Prevent overflow and divide-by-zero (ES.103–ES.105, INT32-C).
- **Never depend on evaluation order,** including function-argument order
  (ES.43, ES.44).
- **Pointer invalidation:** a `push_back` invalidates pointers to vector
  elements. Reuse the iterator that `insert`/`erase` return (ES.65,
  CTR51-CPP).
- **Never `memset`, `memcpy` or `memcmp` non-trivially-copyable types or
  types with padding** (C.90, EXP62-CPP, L1).
- **Lambdas:** capture by reference only when the lambda can't escape.
  Capture explicitly when it is stored or sent to another thread. Never
  write `[=]` in a member function; it captures `this` (F.52–F.54,
  EXP61-CPP).

## Errors
- **Pick one error model per codebase and never ignore errors.**
  - The Core Guidelines throw when a function can't do its task (E.2, I.10)
    and call many bans "superstition" (R.10, NR.3).
  - Google bans exceptions for historical reasons only: "Things would
    probably be different if we had to do it all over again from scratch."
  - **Choice:** new code that isn't low-latency or embedded uses exceptions
    for failures and `std::expected` for expected outcomes. Code built with
    `-fno-exceptions` uses `std::expected` or a status type throughout.
- **Exceptions:**
  - Throw by value and catch by `const&`.
  - Re-throw with `throw;`; `throw e;` slices.
  - Order catch clauses from most derived to least derived (E.15, ERR54-CPP).
- **Don't catch in every function;** let errors propagate to code that can
  act on them (E.18).

## Concurrency
- **Assume the code will run multithreaded.** A function-local `static`
  that is mutated is a data race (CP.1, CP.2).
- **Locks:**
  - Lock with RAII only: `std::scoped_lock` for several mutexes (CP.20,
    CP.21).
  - Name the lock. `lock_guard<mutex>{m};` unlocks immediately, and
    `unique_lock<mutex>(m);` declares a new variable named `m` (ES.84,
    CP.44).
  - Never call unknown code (callbacks, virtual functions) while holding
    a lock (CP.22).
- **Threads and condition variables:**
  - Use `std::jthread`; never `detach()` (CP.23–CP.26).
  - Always `wait` on a condition variable with a predicate (CP.42).
- **Never use `volatile` for concurrency;** use `atomic` (CP.8, CP.200).
- **Coroutines:**
  - A coroutine lambda has no captures.
  - Hold no lock across `co_await`.
  - No reference parameters, because they dangle after the first suspension
    point (CP.51–CP.53).
- **Lock-free code:** avoid it unless you have measured the need. For lazy
  initialization use a function-local `static` or `call_once`, never a
  hand-rolled double-checked lock (CP.100, CP.110).
- **Contract:** `const` methods must be safe to call concurrently with each
  other (Google "Use of const").

## Globals and headers
- **Static-storage objects must be trivially destructible.** Mark
  constant-initialized statics `constexpr` or `constinit`. Use a
  function-local static for lazy singletons (Google "Static and Global
  Variables", I.3, I.22).
- **Headers:**
  - Headers are self-contained, and you include what you use (SF.10,
    SF.11, Google).
  - No `using namespace` and no anonymous namespace in a header (SF.7,
    SF.21).
  - In a `.cpp`, put internal helpers in an anonymous namespace.
- **No C-style variadic functions;** use parameter packs (DCL50-CPP, L1;
  ES.34).

## Performance
- **Measure before claiming speed,** but design interfaces that leave room
  to optimise later (Per.6, Per.7).
- **Default to `vector`** and access memory linearly. A `vector` beats
  `map` and `list` up to a few KB of elements (Per.19, SL.con.2).
- **Containers and buffers:**
  - Call `reserve`.
  - Reuse buffers. The "caller-allocated output" exception to F.20 exists
    for this case.
  - For small static tables, use a sorted array, not a `std::map`
    (Google).

## Tooling
- **Compiler:** `-Wall -Wextra -Werror`.
- **Static analysis:** `clang-tidy` with `cppcoreguidelines-*`,
  `bugprone-*` and `cert-*`.
- **Sanitizers:** ASan, UBSan and TSan in CI.
