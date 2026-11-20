---
name: code-style
description: Coding standards distilled from Google, the Linux kernel, the C++ Core Guidelines, the Rust API Guidelines, NASA/JPL and id Software. Use when writing or reviewing non-trivial Python, C, C++, Rust or performance-critical code, or when choosing between designs on readability, safety or speed.
---

# Code style

The repository's own conventions come first: its AGENTS.md, its linter and
formatter config, and the code next to yours. Use this skill where those are
silent. Read only the reference file for the language you are writing:

| Writing | Read |
|---|---|
| Python | [references/python.md](references/python.md) |
| C | [references/c.md](references/c.md) |
| C++ | [references/cpp.md](references/cpp.md) |
| Rust | [references/rust.md](references/rust.md) |
| Hot loops, latency, memory layout | [references/performance.md](references/performance.md) |
| Shell | the "Writing shell scripts" section of the global AGENTS.md |

## Rules for every language

1. **Let tools enforce formatting.** Run the formatter (ruff format,
   clang-format, rustfmt) and do not discuss what it settles. Spend review
   effort on correctness and design.
2. **Build with warnings as errors, and keep linters clean.** Fix a warning
   rather than silencing it, unless a comment explains why it does not apply.
   (NASA/JPL Power of 10, rule 10.)
3. **Handle errors at the right level.** Check every result that can fail.
   Fail loudly and early at trust boundaries. Never swallow an error silently.
4. **Make ownership and lifetime visible in the types.** Whoever allocates a
   resource, or what owns it, should be obvious from a function's signature,
   not from its comments.
5. **Keep scopes small and state immutable by default.** Mutable state that
   many functions share is the main source of bugs that only show up later
   (Carmack).
6. **Prefer simple control flow.** Avoid deep nesting (more than about 3
   levels), long functions (more than about 60 lines), and "clever" code. A
   function does one thing.
7. **Measure before optimizing,** but choose the data layout deliberately from
   the start: the data layout is hard to change later, whereas a slow loop is
   easy to fix.
8. **Names carry meaning, comments carry the reason.** Describe *why*, not
   *what*. A comment that repeats the code goes stale.
