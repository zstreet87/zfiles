# C

Sources (read in full): [Linux kernel coding style](https://www.kernel.org/doc/html/latest/process/coding-style.html)
(K §n), [kernel deprecated interfaces](https://www.kernel.org/doc/html/latest/process/deprecated.html) (D),
[Holzmann, The Power of 10](https://spinroot.com/gerard/pdf/P10.pdf) (P10),
[SEI CERT C](https://cmu-sei.github.io/secure-coding-standards/sei-cert-c-coding-standard/)
(all 122 rule pages checked for their severity level; L1 = highest severity).

## Errors
- **Check every non-void return value.** Cast a deliberate ignore to
  `(void)` (P10 rule 7, CERT ERR33-C/POS54-C, both L1).
  - `posix_memalign` returns an error code and does not set `errno`
    (POS54-C).
  - Read `errno` only after a function that sets it has reported failure,
    and set `errno = 0` before the call (ERR30-C, L1).
- **Return codes and names:**
  - An action function returns `0` or `-errno`.
  - A predicate returns `bool`.
  - A function that computes a value signals failure with an out-of-range
    result (`NULL`, `ERR_PTR`).
  - Mixing these conventions is "a fertile source of difficult-to-find
    bugs" (K §16).
- **Clean up through one exit path** with `goto` labels named after what
  they undo (`out_free_buf:`), stacked in reverse order of acquisition. A
  single shared `err:` label frees things that may be NULL (K §7).
- **Assertions catch impossible states.** They must have no side effects.
  A failed check takes an explicit recovery action, such as returning an
  error, rather than aborting (P10 rule 5). Use compile-time checks
  (`_Static_assert`, `BUILD_BUG_ON`) for anything known at build time.
- **Don't crash the program for a reachable condition.** In the kernel,
  use `WARN_ON_ONCE`, never a new `BUG()`. "I'm too lazy to do error
  handling" is not an excuse (K §22).

## Memory
- **Allocation size arithmetic:**
  - Compute sizes from the object: `p = malloc(sizeof(*p))`.
  - Never compute `n * size` inside an allocator's arguments. Use
    `calloc(n, sizeof(*p))`, or check for overflow first (C23
    `ckd_mul`). A wrapped multiplication becomes a heap overflow (D,
    K §14, INT31-C).
- **Allocated memory is uninitialized.** Memory from `malloc`,
  `aligned_alloc` or the grown part of a `realloc` is uninitialized; only
  `calloc` zeroes (EXP33-C, L1).
- **Check for null before dereferencing** any pointer that may be null
  (EXP34-C, L1).
- **Out of bounds:** don't even form a pointer outside an array, let
  alone dereference it (ARR30-C).
- **After `free`:** don't evaluate the pointer, not even to cast or
  assign it, and never call `realloc(p, 0)` (MEM30-C).
- **No variable-length arrays,** and no `[0]` or `[1]` trailing arrays.
  Use a flexible array member `items[]` (D).
- **Strings:**
  - Bounded copies only (`snprintf`, `strscpy` in the kernel).
  - Never `strcpy`, `strncpy` (it may leave the string unterminated),
    `sprintf` or `gets` (D).
  - Never pass an unterminated buffer to a `str*` function (STR32-C, L1).
- **Data that other threads can reach must be reference-counted.** A lock
  keeps data consistent; it does not manage lifetime (K §11).
- **In bounded or safety-critical code,** allocate everything at
  initialization, use no recursion, and keep stack depth provable (P10
  rules 1 and 3).

## Integers
- **Prevent signed overflow before it happens.** Check operands, or use
  C23 `ckd_add`/`ckd_sub`/`ckd_mul`. Watch `INT_MIN / -1` and left
  shifts. The compiler assumes overflow never happens (INT32-C, L1).
- **Conversions must not lose data,** especially sizes passed to
  allocators, array indices, and arguments to `<ctype.h>` and `memset`
  (INT31-C, L1).
- **Store `getc` results in an `int`,** and use `feof`/`ferror` to tell
  `EOF` apart from data (FIO34-C, L1).

## Control flow and structure
- **Keep functions short:** one or two screens, 5–10 local variables, and
  about 60 lines in bounded code (K §6, P10 rule 4).
- **Nesting:** more than three levels of indentation means the function
  needs restructuring (K §1).
- **Give every loop a visible bound.** Assert when a traversal exceeds
  its bound (P10 rule 2).
- **Switches:** every `case` ends in `break`, `return`, `goto`,
  `continue` or `fallthrough;` (D).
- **Scope:** declare at the smallest scope, and don't reuse a variable
  for an unrelated purpose. File-private functions are `static` (P10
  rule 6).
- **Limit pointers:** one level of dereference per expression. Don't hide
  a pointer in a `typedef` or a macro (P10 rule 9, K §5).
- **Typedefs only for opaque types and fixed-width integers,** never for
  structs (K §5).

## Preprocessor
- **Prefer `static inline` functions and `enum` constants to macros**
  (K §12).
- **Macros must be well-behaved:** a multi-statement macro is wrapped in
  `do { } while (0)`, and arguments are parenthesised. A macro never hides
  a `return` or `goto`, and never relies on a local variable having a
  particular name (K §12).
- **No `#ifdef` inside function bodies.** Put stubs in a header, or use
  `if (IS_ENABLED(X))` so both branches are still type-checked. "With ten
  conditional directives there could be up to 2^10 versions of the code"
  (K §21, P10 rule 8).
- **Don't scatter `inline`;** compilers decide better. More than about
  three lines inlined costs instruction cache (K §15).

## Security
- **Never put user input in a format string.** Use `"%s"` (FIO30-C, L1).
- **Never call `system()`** (ENV33-C, L1).
- **Signal handlers** may use only async-signal-safe functions, and may
  touch only `volatile sig_atomic_t` or lock-free atomics (SIG30-C/SIG31-C,
  L1).
- **Never `memcmp` or hash structs that have padding;** the padding is
  indeterminate (EXP42-C, L1).
- **Use explicit byte order** (`htonl`/`ntohl`) for data crossing machines
  (POS39-C, L1).
- **Seed random number generators deliberately.** For HPC, log the seed
  so runs can be reproduced (MSC32-C).

## Disagreements and choices
- **`goto`:** P10 bans it; the kernel uses it for cleanup. Use it only for
  the cleanup pattern above.
- **Assertion density:** P10 and TigerStyle aim for at least two per
  function; the kernel avoids runtime asserts. Use asserts heavily in
  libraries and tools, and follow kernel practice in the kernel.
- **Most severe ≠ L1:** CERT's L1 level favours rules a tool can find and
  fix. Out-of-bounds access (ARR30-C) and use after free (MEM30-C) are L2
  but are the most dangerous bugs.

## Tooling
- **Warnings:** build with `-Wall -Wextra -Werror` (add `-Wpedantic`
  where possible) from the first day.
- **Static analysis:** run `clang-tidy` (`cert-*`, `bugprone-*`) or
  cppcheck.
- **Sanitizers:** test under ASan and UBSan, and TSan for threaded code.
