# C

Sources: [Linux kernel coding style](https://www.kernel.org/doc/html/latest/process/coding-style.html)
(section numbers below), [NASA/JPL Power of 10](https://spinroot.com/gerard/pdf/P10.pdf),
[SEI CERT C](https://wiki.sei.cmu.edu/confluence/display/c).

## Structure
- **Nesting (kernel §1):** more than 3 levels of indentation means the
  function needs restructuring. Return early on error.
- **Functions (kernel §6, P10 rule 4):** keep them short and doing one thing,
  about 60 lines or less, with 5 to 10 local variables at most.
- **Cleanup (kernel §7):** use a single cleanup path with `goto out_free_x;`
  labels, in the reverse order of acquisition. This is the accepted exception
  to "no goto".
- **Control flow (P10 rule 1):** no `setjmp`/`longjmp` and no recursion in
  code that has to be safe. Every loop has a bound a reader or tool can see
  (P10 rule 2).
- **Scope (P10 rule 6):** declare data at the smallest possible scope.
  Functions private to a file are `static`.

## Memory and pointers
- **Allocation:** check every allocation. Compute sizes from the variable:
  `p = malloc(sizeof(*p))` and `kcalloc(n, sizeof(*p), ...)` (kernel §14).
  Guard multiplications against overflow (CERT MEM07-C).
- **Ownership:** document who frees each pointer. In code that has to be
  safe, allocate up front and not on hot paths (P10 rule 3).
- **Pointers (P10 rule 9):** use at most one level of dereference per
  expression. Never hide a pointer inside a typedef (kernel §5).
- **Strings:** use bounded functions (`snprintf`, `strscpy`). Never use
  `gets`, `strcpy` or `sprintf` on input you don't control.

## Errors and values
- **Return values (P10 rule 7):** check every non-void return value, or cast
  it to `(void)` deliberately. Each function checks its parameters.
- **Error convention (kernel §16):** a function that performs an action
  returns `0` on success or `-errno` on failure. A predicate returns a bool.
- **Assertions (P10 rule 5):** use them for conditions that should be
  impossible. They must have no side effects.
- **Undefined behaviour:** watch signed overflow, shifts past the type's
  width, misaligned access and strict-aliasing violations. Test with
  `-fsanitize=address,undefined`.

## Preprocessor (P10 rule 8, kernel §12)
- **Prefer real code to macros:** use `static inline` functions and `enum`
  constants instead of macros. A macro must expand to a complete statement
  (`do { } while (0)`) and parenthesize its arguments. Keep `#ifdef` out of
  function bodies.

## Tooling
- **Compiler flags:** build with `-Wall -Wextra -Werror` (and `-Wpedantic`
  where possible), plus `clang-tidy` or `cppcheck` (P10 rule 10).
- **Sanitizers:** run tests under ASan and UBSan.
