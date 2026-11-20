---
name: code-style
description: Coding standards drawn from full reads of Google's style guides, PEP 8/257, the Linux kernel style, NASA/JPL Power of 10, the C++ Core Guidelines, SEI CERT C/C++, the Rust API Guidelines, Microsoft Pragmatic Rust, the Rustonomicon, TigerStyle, Drepper, Data-Oriented Design, Carmack and Greg's Wiki. Use when writing or reviewing non-trivial Python, C, C++, Rust, shell or performance-critical code, or when choosing between designs on correctness, safety or speed.
---

# Code style

The repository's own conventions come first: its AGENTS.md, its linter and
formatter configuration, and the code around yours. Use this skill where they
say nothing. Read only the reference file for the language you are writing in:

| Writing | Read |
|---|---|
| Python | [references/python.md](references/python.md) |
| C | [references/c.md](references/c.md) |
| C++ | [references/cpp.md](references/cpp.md) |
| Rust (including `unsafe`) | [references/rust.md](references/rust.md) |
| Bash / shell | [references/shell.md](references/shell.md) |
| Hot loops, memory layout, concurrency, latency | [references/performance.md](references/performance.md) |
| Reviewing a change | [references/review.md](references/review.md) |

Each rule cites its source's own ID (`ES.20`, `C-NEWTYPE`, `INT32-C`, `§2.12`,
`P10 rule 2`), so you can look up the full rationale. Where the sources
disagree, the reference file says so and makes a choice.

## Rules for every language

1. **Let tools settle formatting.** Run the formatter and spend review on
   correctness and design. Keep warnings at zero from the first day, and fix
   a false positive by rewriting the code rather than suppressing the warning.
   Any suppression that remains says why (P10 rule 10, MS
   M-LINT-OVERRIDE-EXPECT).
2. **Handle every error, at the level that can act on it.** Check every
   result that can fail, or discard it explicitly and visibly. In one study,
   92% of catastrophic system failures came from mishandling non-fatal errors
   that the software had explicitly signalled (TigerStyle, CERT ERR33-C,
   P10 rule 7).
3. **Treat a bug and an expected failure differently.** A broken contract is
   a bug: assert, panic or crash loudly. An expected failure, such as a
   missing file or bad input, is a value the caller handles. Never use one
   channel for the other (MS M-PANIC-ON-BUG, Core Guidelines I.10,
   kernel §22).
4. **Make invalid states impossible to represent.** Use types rather than
   comments and runtime checks: newtypes, enums instead of `bool` parameters,
   `span` instead of a pointer plus a count, and existence-based tables
   instead of flags (Core Guidelines P.1/I.4, C-NEWTYPE, C-CUSTOM-TYPE, DOD
   Ch.3).
5. **Make ownership and lifetime visible in signatures.** It should be clear
   who frees what, and how long a reference must live (I.11, R.30–R.37,
   Google "Inputs and Outputs").
6. **Keep state immutable and local by default.** Use no mutable globals and
   don't duplicate a value. Gather the input, pass it to a pure function, then
   act on the result (Carmack, Con.1, TigerStyle "don't duplicate variables",
   §2.5).
7. **Use simple, bounded control flow.** Keep nesting at three levels or
   fewer and functions under about 60–70 lines. Give every loop and queue a
   bound, and avoid recursion in code that must stay bounded. Keep
   conditionals in the parent function and loops in the leaf helpers, so
   "push `if`s up and `for`s down" (P10 rules 1, 2 and 4, TigerStyle,
   kernel §1/§6).
8. **Design data layout early and tune code late.** Rough out bandwidth and
   latency for disk, network, memory and CPU while designing. Profile before
   tuning any code (TigerStyle, Per.6/Per.7, DOD Ch.8).
9. **Don't build for a future that hasn't arrived.** Solve the problem in
   front of you, and generalise only once there are at least three users
   (Google code review "looking-for", DOD Ch.11).
10. **Name and comment for the next reader.** Put units last in names
    (`latency_ms_max`). A comment says why, not what, and a comment that
    contradicts the code is worse than none (PEP 8, kernel §8, TigerStyle).
