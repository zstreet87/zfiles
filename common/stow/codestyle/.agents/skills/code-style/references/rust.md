# Rust

Sources (read in full): [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/) (C-*),
[Microsoft Pragmatic Rust Guidelines](https://microsoft.github.io/rust-guidelines/) (M-*),
[The Rustonomicon](https://doc.rust-lang.org/nomicon/) (Nom: chapter), [Rust Performance Book](https://nnethercote.github.io/perf-book/) (PB).

## Errors and panics
- **A panic means the program has a bug, never an expected failure.**
  - Panic when a contract is violated (`divide_by(x, 0)`). Return `Result`
    for failures the caller can expect (`parse(&str)`).
  - Never assume a panic will be caught: callers may build with
    `panic = "abort"`.
  - (M-PANIC-IS-STOP, M-PANIC-ON-BUG)
- **Error types:**
  - Library errors are structs specific to the situation: they carry a
    cause, a backtrace and `is_xxx()` helpers, and keep any `ErrorKind`
    private. No single catch-all error enum (M-ERRORS-CANONICAL-STRUCTS).
  - Implement `std::error::Error + Send + Sync + 'static` (C-GOOD-ERR).
  - Applications pick one of `anyhow` or `eyre` (M-APP-ERROR).
- **Conversions into your error type:** implement `From<Upstream>` so `?`
  converts, rather than `.map_err` everywhere (M-FROM-ERROR). Note that a
  public `impl From<other_crate::Error>` makes that crate part of your
  public API (C-STABLE).
- **Panic messages:** every intentional `panic!`, `assert!` or
  `unreachable!` includes the relevant values (M-PANIC-MESSAGE).
- **No `unwrap()` on external input.** Examples in docs use `?`, because
  they get copied verbatim (C-QUESTION-MARK).
- **Destructors never fail or block.** Provide `close() -> Result` and keep
  `Drop` best-effort (C-DTOR-FAIL, C-DTOR-BLOCK).
- **`catch_unwind` is a last resort,** followed by a controlled restart
  (M-PANIC-CONTINUATION).

## Types and API
- **Encode meaning in types:**
  - Newtypes (`Miles(f64)`) and enums instead of `bool` arguments
    (C-NEWTYPE, C-CUSTOM-TYPE).
  - A newtype that carries an invariant has a fallible constructor and
    `TryFrom`, never an infallible `From` (M-STRONG-TYPES-GUARD).
- **Validate arguments, preferring static checks.** Use types first, then
  runtime checks, then `debug_assert!`, then an `_unchecked` variant as an
  opt-out. Rust APIs do not follow the robustness principle (C-VALIDATE).
- **Ownership:** borrow (`&str`, `&[T]`, `impl AsRef<Path>`) unless you
  need ownership; then take `T`, never `&T` followed by a clone
  (C-CALLER-CONTROL).
- **Conversion names:** `as_` is free, `to_` is costly, and `into_`
  consumes. Getters have no `get_` prefix (C-CONV, C-GETTER). Implement
  `From`/`TryFrom`/`AsRef`, never `Into` directly (C-CONV-TRAITS).
- **Builders:** use one for more than two optional parameters. Setters are
  infallible, validation happens in a fallible `.build()?`, and the entry
  point is `Foo::builder(required)` (M-INIT-BUILDER, C-BUILDER).
- **Return values, not out-parameters,** except to reuse a buffer
  (`read(&mut self, buf: &mut [u8])`) (C-NO-OUT, M-MEM-REUSE).
- **Future-proofing:**
  - Fields are private (C-STRUCT-PRIVATE).
  - Seal traits that outsiders shouldn't implement (C-SEALED).
  - Put no derivable bounds on data-structure generics (C-STRUCT-BOUNDS).
- **Traits:**
  - Derive or implement the common traits eagerly; every public type is
    `Debug` (C-COMMON-TRAITS, C-DEBUG).
  - Only smart pointers implement `Deref` (C-DEREF).
- **Simple signatures:** keep `Arc`, `Box` and `RefCell` out of public
  signatures. Nest service generics at most one level deep
  (M-AVOID-WRAPPERS, M-SIMPLE-ABSTRACTIONS).
- **Core functionality is inherent methods;** trait impls forward to them
  (M-ESSENTIAL-FN-INHERENT).
- **Statics:** don't rely on one for correctness. Two semver-incompatible
  copies of a crate each get their own (M-AVOID-STATICS).
- **Features are additive:** a `std` feature, never `no-std` (C-FEATURE,
  M-FEATURES-ADDITIVE).

## Concurrency and async
- **Public futures and types are `Send`.** Assert it at compile time
  (M-TYPES-SEND, C-SEND-SYNC).
- **CPU-bound async work** yields about every 10–100 µs (M-YIELD-POINTS).
- **Shared services** implement `Clone` through `Arc<Inner>`
  (M-SERVICES-CLONE).
- **Memory ordering:** plain accesses never synchronise anything, and
  Acquire/Release only order accesses through the *same* location. Use
  `Relaxed` only for standalone counters, and SeqCst when unsure. Test on
  weakly ordered hardware such as ARM (Nom: atomics).
- **Read an atomic once and use that value.** Reloading after a check
  leaves a gap (Nom: races).

## unsafe
- **Allowed reasons:** a new abstraction, a benchmarked performance gain,
  or FFI. Each block gets a `// SAFETY:` argument and must pass Miri. Never
  use `unsafe` to work around `Send` or lifetimes (M-UNSAFE).
- **Mark something `unsafe` only when misuse can cause UB.** "Dangerous" is
  not enough (M-UNSAFE-IMPLIES-UB). Code that can cause UB from safe code,
  however unlikely, is unsound (M-UNSOUND).
- **The privacy boundary is the safety boundary.** Safe code in the same
  module can break your invariants (`self.cap += 1`), so keep the fields
  that carry them private (Nom: working-with-unsafe).
- **Don't trust callers' safe code** (`Ord`, closures, `Clone`). It may be
  wrong or panic in the middle of an operation. Use an `unsafe trait` only
  when you cannot defend against it (Nom: safe-unsafe-meaning).
- **Producing an invalid value is UB, even if you never read it.** That
  covers a `bool` other than 0 or 1, a bad enum discriminant, null in a
  reference, `Box` or `NonNull`, and an uninitialized integer
  (Nom: what-unsafe-does).
- **Aliasing:** a `&mut` must never be aliased, and turning `&` into `&mut`
  is *always* UB; use `UnsafeCell`. Split a borrow by building each half
  from a raw pointer, as `split_at_mut` does (Nom: transmutes,
  borrow-splitting).
- **Tie a lifetime created from a raw pointer** (`&*raw`, `transmute`) to
  an input immediately (Nom: unbounded-lifetimes).
- **Owning raw pointer:** use `NonNull<T>` (covariant), plus
  `PhantomData<T>`, plus `Send`/`Sync` impls bounded the way std's are
  (Nom: phantom-data, send-and-sync).
- **Uninitialized memory:**
  - Use `MaybeUninit` and initialize with `ptr::write`, never `=`, which
    drops the garbage that was there.
  - Never make a reference to uninitialized data; use
    `&raw mut (*p).field` (Nom: unchecked-uninit).
- **Panic safety:** if untrusted code panics mid-operation, memory must
  still be safe. Don't leave a too-large `len` or a duplicated value while
  calling it, and use a guard whose `Drop` repairs state (Nom:
  exception-safety).
- **Leaks are safe, so never depend on `Drop` running.** Proxy types
  should leak rather than become unsound; `Drain` sets `len = 0` first.
  Abort when a refcount overflows (Nom: leaking).
- **Layout:** `repr(Rust)` layout is unspecified and may differ between
  instantiations. Pun or share types over FFI only with `repr(C)` or
  `repr(transparent)`. Never take references to `repr(packed)` fields
  (Nom: repr-rust, other-reprs).
- **FFI:**
  - Use `"C-unwind"` if a panic or C++ exception may cross the boundary.
    A foreign exception entering through `"C"` is UB.
  - Use `Option<&T>`, `Option<Box<T>>` or `Option<extern fn>` for nullable
    C pointers.
  - Unregister C callbacks in `Drop` (Nom: ffi).
- **Allocation:** sizes must fit in `isize::MAX`, never allocate zero
  bytes, never free when `cap == 0`, and call `handle_alloc_error` on a
  null result (Nom: vec-alloc).
- **Lint:** enable `clippy::undocumented_unsafe_blocks`.

## Performance
- **Build configuration:**
  - Benchmark `--release` builds.
  - Consider `codegen-units = 1`, `lto = "fat"` and `panic = "abort"`, and
    benchmark each change separately.
  - `lto = false` still runs thin local LTO; only `"off"` disables it
    (PB: build-configuration).
- **Allocate less:**
  - `with_capacity`, and reuse a collection with `clear()`.
  - `clone_from`, and `Cow` for data that is mixed borrowed and owned.
  - Read lines into one reused `String`, not `lines()` (PB:
    heap-allocations, M-INITIAL-CAPACITY).
- **Hot types at 128 bytes or less** (larger ones are copied with
  `memcpy`). Box rare large enum variants, store indices as `u32`, and add
  static size assertions (PB: type-sizes).
- **Collections and iterators:**
  - Don't `collect` only to iterate again; return `impl Iterator`.
  - Use `swap_remove` when order doesn't matter.
  - Use `*_or_else` variants for costly defaults (PB: iterators,
    standard-library-types).
- **I/O:** buffer it (`BufWriter`) and call `flush()` explicitly. A flush
  error on drop is silently lost. Lock stdout for repeated writes (PB: io).
- **Hashing:** use FxHash or foldhash for trusted keys only when profiling
  shows hashing is hot, and enforce the choice with clippy
  `disallowed-types` (PB: hashing, M-FAST-HASHER).
- **Inlining:** measure after adding `#[inline]`; it doesn't propagate.
  Mark rare paths `#[cold]` (PB: inlining).
- **Box immutable data:** use `Box<str>` or `Box<[T]>` for immutable data
  with many instances (M-BOX-DST).

## Disagreements and choices
- **Builder style:** the API Guidelines prefer non-consuming builders
  (`&mut self`); Microsoft's guidelines use consuming ones (`self`).
  Follow the crate's existing style.
- **Generic types:** the API Guidelines encourage generics; Microsoft's
  guidelines discourage generics on *types* (services). Make functions
  generic and keep struct type parameters few.
- **Preludes:** Microsoft forbids preludes and glob re-exports, but many
  crates ship them. Don't add new ones.
- **The Rustonomicon is not normative,** and it doesn't define the aliasing
  model. Check provenance details against the Reference, the `std::ptr`
  docs and Miri.

## Tooling
- **Lints:** `cargo fmt --check`, and `cargo clippy -- -D warnings` with
  `pedantic` enabled. Override a lint with `#[expect(lint, reason = "…")]`,
  not `#[allow]`; `expect` warns once the override goes stale
  (M-LINT-OVERRIDE-EXPECT).
- **Checks:** `cargo test`, Miri for unsafe code, and `cargo audit` or
  `cargo deny`.
