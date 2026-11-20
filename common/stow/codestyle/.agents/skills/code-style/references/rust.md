# Rust

Sources: [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/checklist.html)
(C-* IDs below), [Microsoft Pragmatic Rust Guidelines](https://microsoft.github.io/rust-guidelines/),
[Clippy lints](https://rust-lang.github.io/rust-clippy/master/).

## Errors and panics
- **Recoverable errors:** return `Result` and propagate with `?`. Libraries
  define meaningful error types (C-GOOD-ERR), usually with `thiserror`;
  applications can use `anyhow`.
- **Panics:** a panic means a bug, not an expected failure. No `unwrap()` or
  `expect()` on input from outside. Document every panic and error case in
  the function's docs (C-FAILURE).
- **Validation (C-VALIDATE):** functions check their arguments, ideally by
  taking types that cannot hold invalid values ("parse, don't validate").

## Types
- **Newtypes (C-NEWTYPE):** use them to tell apart values that share a
  representation, such as `UserId(u64)` and `Meters(f64)`.
- **Meaningful arguments (C-CUSTOM-TYPE):** use enums instead of `bool` or
  `Option` parameters, such as `Mode::Fast` rather than `true`.
- **Builders (C-BUILDER):** use them for values with many optional fields.
- **Common traits (C-COMMON-TRAITS, C-DEBUG):** derive `Debug`, `Clone`,
  `PartialEq`, `Eq`, `Hash` and `Default` where they make sense. Every public
  type implements `Debug`.
- **Conversions (C-CONV-TRAITS):** use `From`, `TryFrom` and `AsRef`. Name
  conversions with the `as_` (cheap borrow), `to_` (costly) and `into_`
  (consuming) prefixes (C-CONV).
- **Private fields (C-STRUCT-PRIVATE):** struct fields are private so the
  type can change without breaking users.

## Ownership and API shape
- **Borrowed parameters:** accept `&str`, `&[T]` and `impl AsRef<Path>`
  rather than `String`, `Vec<T>` or `PathBuf`. Generics keep assumptions
  about parameters to a minimum (C-GENERIC).
- **Who copies (C-CALLER-CONTROL):** let the caller decide when to clone;
  take ownership only when the function stores the value.
- **No out-parameters (C-NO-OUT):** return a tuple or struct instead.
- **Thread safety (C-SEND-SYNC):** make types `Send` and `Sync` where
  possible. Destructors never fail (C-DTOR-FAIL).

## unsafe
- **Keep it small:** keep `unsafe` blocks minimal. Each one gets a
  `// SAFETY:` comment proving its invariants, and each `unsafe fn` gets a
  `# Safety` section in its docs.
- **Wrap it:** put `unsafe` code behind a safe API, and test it under Miri.

## Performance
- **Allocation:** avoid allocating on hot paths. Use `Vec::with_capacity`,
  reuse buffers, use `&str` instead of `String`, and use `Cow` where a value
  is only sometimes owned.
- **Iterators:** prefer iterator chains; they compile to tight loops without
  bounds checks.
- **Profile** release builds (`cargo flamegraph`) and benchmark with
  `criterion`.
- **Generics or trait objects:** prefer static dispatch (generics) on hot
  paths and `dyn Trait` where code size or compile time matters more.

## Tooling
- **CI checks:** run `cargo fmt --check`, `cargo clippy -- -D warnings`
  (consider `clippy::pedantic`) and `cargo test` in CI. Add `cargo deny` or
  `cargo audit` to check dependencies.
