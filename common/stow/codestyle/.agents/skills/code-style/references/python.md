# Python

Sources (read in full): [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)
(section numbers below), [PEP 8](https://peps.python.org/pep-0008/),
[PEP 20](https://peps.python.org/pep-0020/), [PEP 257](https://peps.python.org/pep-0257/),
[typing best practices](https://typing.python.org/en/latest/reference/best_practices.html).

## Errors
- **Catch specific exceptions.** No bare `except:`; it catches
  `KeyboardInterrupt` and `SystemExit`. Use `except Exception:` only to log
  and re-raise, or at an isolation point such as the outermost block of a
  thread (PEP 8, §2.4.4).
- **Keep `try` bodies to the minimum.** Put follow-on work in `else:`, so an
  unrelated `KeyError` isn't caught by mistake (PEP 8).
- **Chain exceptions:** `raise NewError(...) from err`. With `from None`,
  copy the useful details into the new error yourself (PEP 8).
- **Never `return`, `break` or `continue` inside `finally`.** It silently
  cancels the exception in flight (PEP 8).
- **Never use `assert` to validate input or for required logic.** `-O`
  strips asserts. Raise `ValueError`/`TypeError` instead (§2.4.4).
- **Custom exceptions:** subclass `Exception` (not `BaseException`) and end
  the name in `Error`. Design the hierarchy around what callers need to tell
  apart (PEP 8, §2.4.4).
- **Make error messages greppable and exact:**
  `raise ValueError(f"Not a probability: {p=}")`. Watch for NaN: `p < 0 or
  p > 1` is false for NaN, so write `not 0 <= p <= 1` (§3.10.2).

## State and lifetime
- **No mutable defaults:** not `def f(x=[])`, `={}`, or defaults evaluated
  at import time such as `=time.time()`. Use `None`, then
  `if x is None: x = []` (§2.12.4).
- **No mutable global state.** If it can't be avoided, make it `_private`,
  access it through functions, and comment why (§2.5.4).
- **Close resources with `with`:** files, sockets, connections, mmaps and
  matplotlib figures. `__del__` timing is not guaranteed (§3.11, PEP 8).
- **Name a context manager by what it does:** `with
  conn.begin_transaction():`, not a bare `with conn:` that hides the commit
  (PEP 8).
- **Generators hold their locals until exhausted.** Wrap expensive
  resources in a context manager (§2.9).
- **No work at import time.** Put logic in `main()` behind
  `if __name__ == "__main__":`. Decorators run at import, so they must not
  touch files, sockets or databases (§3.17, §2.17.4).

## Correctness idioms
- **Write `x is None` / `x is not None`,** never `== None`, and never
  `if x:` when you mean "not None", because empty containers and `0` are
  false. No `x = x or []` (PEP 8, §2.14.4).
- **Compare known integers to 0 explicitly** (`if n == 0`). For NumPy
  arrays use `.size`; arrays raise in a boolean context (§2.14.4).
- **Use `isinstance()`,** not `type(a) is type(b)` (PEP 8).
- **Ordering:** define all six rich comparisons, or use
  `functools.total_ordering` (PEP 8).
- **Late-binding closures:** a closure in a loop sees the loop variable's
  last value (§2.16).
- **Threads:** never rely on built-in operations being atomic, not even
  plain assignment. Pass data with `queue.Queue`, or protect it with locks
  or a `Condition` (§2.18).
- **Use `str.startswith`/`endswith`,** not slices (PEP 8).

## API design
- **Keep things private until there's a reason not to (`_name`);** it's
  easier to make something public later than to take it back. Declare the
  public API in `__all__` (PEP 8).
- **Properties must be cheap and unsurprising.** If access becomes
  expensive, replace the property with a `get_x()` method so old callers
  break visibly (§2.13, §3.15).
- **Prefer a module-level function to `staticmethod`.** Use `classmethod`
  only for named constructors (§2.17.4).
- **Import modules, not names** (`from pkg import mod`, then `mod.Thing`).
  `typing` and `collections.abc` are exempt. Use absolute imports and no
  `import *` (§2.2.4).
- **Comprehensions:** one `for` and one condition at most. Anything bigger
  becomes a loop (§2.7.4).
- **Keep functions to about 40 lines;** past that, consider splitting (§3.18).

## Types
- **Annotate public APIs and type-check in CI.** Write `X | None`
  explicitly; implicit Optional is disallowed (§2.21, §3.19.5).
- **Parameters take abstract types** (`Iterable`, `Sequence`, `Mapping`);
  **return values use concrete types** (`list`, `dict`) (typing BP, §3.19.12).
- **Use `object` rather than `Any`** when anything is acceptable. Type
  ignored callback results as `Callable[..., object]` (typing BP).
- **Avoid non-`None` union return types;** they force `isinstance` checks
  on every caller (typing BP).
- **Always give type parameters:** `Sequence[int]`, not bare `Sequence`.
  Use built-in generics (`list[str]`) (§3.19.12).

## Docs
- **Every public function gets a docstring** with `Args:`, `Returns:`
  (`Yields:` for generators) and `Raises:`. The summary is an imperative
  sentence ending in a period ("Return the path."), and the docstring must
  say whether arguments are mutated (PEP 257, §3.8.3).
- **Don't list exceptions raised on API misuse;** that makes the misuse
  behaviour part of the contract (§3.8.3).

## Performance
- **Build strings with `''.join(parts)`** or `io.StringIO`, not `+=` in a
  loop. CPython's in-place concatenation optimisation is fragile (PEP 8,
  §3.10).
- **Logging calls take a %-pattern:** `log.info("x=%s", x)`, not an
  f-string (§3.10.1).
- **Profile first** (`cProfile`, `py-spy`). Move numeric loops into
  NumPy/PyTorch, and use `set`/`dict` for membership tests.

## Disagreements and choices
- **Line length:** PEP 8 says 79, Google 80, Black 88. Use whatever the
  formatter enforces.
- **Unused arguments:** Google prefers `del arg  # Unused.` over renaming to
  `_arg`, because renaming breaks keyword callers. Most linters expect `_`.
  Follow the repository.
- **`from x import Name`:** PEP 8 allows it; Google requires module imports.
  Follow the repository, and default to module imports in new code.

## Tooling
- **Run** `ruff check`, `ruff format`, mypy or pyright, and pytest.
