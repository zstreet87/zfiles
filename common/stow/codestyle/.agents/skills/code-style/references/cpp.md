# C++

Sources: [C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines)
(rule IDs below), [Google C++ Style Guide](https://google.github.io/styleguide/cppguide.html).

## Resources and ownership
- **RAII (R.1):** manage every resource with RAII. Avoid explicit
  `new`/`delete` (R.11). Use `std::make_unique` and `std::make_shared` (R.22,
  R.23).
- **Owning pointers (I.11):** never transfer ownership through a raw `T*` or
  `T&`. Raw pointers and references don't own; `unique_ptr` is the default
  owner, and `shared_ptr` is for ownership that is genuinely shared.
- **Rule of zero (C.20):** if you can avoid defining the special member
  functions, do. If you define one, define or `=delete` all five (C.21).
- **Destructors (C.36, C.37):** destructors never throw and are `noexcept`.

## Interfaces and functions
- **Parameters (F.16):** pass inputs that are cheap to copy by value and
  others by `const&`. Return values rather than using output parameters
  (F.20, F.21; Google "Inputs and Outputs").
- **Constructors (C.46):** make single-argument constructors `explicit`
  (Google "Implicit Conversions").
- **Arrays:** use `std::span` and `std::string_view` for non-owning views.
  Never pass an array as a bare pointer (I.13).
- **Generics:** constrain templates with concepts (T.10).

## Expressions
- **Initialization:** always initialize objects (ES.20). Prefer `{}`
  initialization (ES.23).
- **Immutability:** make things `const` by default (Con.1) and use
  `constexpr` for values known at compile time (Con.5).
- **Casts:** no C-style casts (ES.48, ES.49). `reinterpret_cast` needs a
  comment explaining why.
- **Signed and unsigned:** do not mix them in arithmetic (ES.100). Use
  unsigned types only for bit manipulation (ES.101).
- **Loops:** prefer range-`for` and `<algorithm>` over hand-written loops
  (ES.71, P.3).

## Errors
- **Exceptions or not:** choose one error model per codebase. The Core
  Guidelines use exceptions (E.2). Google bans exceptions in its own code; in
  that case use `absl::Status`, `std::expected`, or a result type. Never
  ignore a returned error. Mark functions that cannot throw `noexcept`.

## Performance (Per.*)
- **Measure (Per.6):** do not claim a performance gain without measuring it.
- **Design for optimization (Per.7):** choose the data layout so the
  compiler and hardware can optimize it.
- **Memory access (Per.19):** access memory predictably. Use contiguous
  containers (`std::vector`) over node-based ones, and prefer value types
  to graphs of pointers.
- **Allocation:** avoid allocating in hot loops. Call `reserve()`, reuse
  buffers and use move semantics.

## Headers (Google)
- **Self-contained headers:** each header compiles on its own and has an
  include guard or `#pragma once`.
- **Include what you use:** include every header you use, rather than relying
  on another header to pull it in.
- **Namespaces:** never put `using namespace` in a header.
- **Internal linkage:** give file-local code an unnamed namespace.

## Tooling
- **Compiler and analysis:** build with `-Wall -Wextra -Werror`, run
  `clang-tidy` with the `cppcoreguidelines-*` and `bugprone-*` checks, and
  test under ASan, UBSan and TSan.
