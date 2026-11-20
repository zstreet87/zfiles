# Python

Sources: [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)
(section numbers below), [PEP 8](https://peps.python.org/pep-0008/),
[PEP 20](https://peps.python.org/pep-0020/).

## Correctness
- **Default arguments (§2.12):** never use a mutable default (`def f(x=[])`).
  Use `None` and create the object inside the function. The default is shared
  between calls.
- **Exceptions (§2.4):** catch the narrowest exception you can. Never use a
  bare `except:`, which also catches `KeyboardInterrupt` and `SystemExit`
  (PEP 8). Keep each `try` block minimal. Re-raise with `raise ... from err`.
- **Comparing to `None`:** write `x is None`, not `x == None`. Do not write
  `if x:` when you mean `if x is not None:`, because empty containers and `0`
  are false (PEP 8).
- **Global state (§2.5):** avoid mutable globals. Module-level constants are
  `UPPER_CASE`.
- **Resources:** use `with` for files, locks and connections. Never rely on
  `__del__` to clean up.
- **Asserts:** do not use `assert` to validate input, because `-O` removes
  asserts. Raise `ValueError` or `TypeError` instead.

## Types and API
- **Type annotations (§2.21):** annotate public functions and run a type
  checker (mypy or pyright) in CI.
- **Containers:** use `dataclasses` (`frozen=True` where possible) or
  `NamedTuple` instead of loose dicts and tuples that carry structure.
- **Returns (PEP 8):** be consistent; either every `return` returns a value or
  none does.
- **Docstrings:** every public function has a Google-style docstring with
  `Args:`, `Returns:` and `Raises:` sections (§3.8).

## Idioms
- **Comprehensions (§2.7):** use them for simple transforms. Use a loop once
  you need more than one `for` or a complex condition.
- **Strings:** use `str.startswith` and `str.endswith`, not slicing. Use
  `''.join(parts)` in loops, not `+=`. Use f-strings, except in logging calls:
  write `log.info("x=%s", x)` so the formatting is skipped when the log level
  is off.
- **Paths:** use `pathlib`. Use `subprocess.run([...], check=True)` with an
  argument list and never `shell=True` on untrusted input.
- **Imports:** import modules, not names (§2.2). Never use
  `from x import *`.

## Performance
- **Profile first** with `cProfile` or `py-spy`. Move numeric loops into
  NumPy, PyTorch or other vectorized code. A Python-level loop over
  elements costs about 100x more than the vectorized equivalent.
- **Lookups:** use `set` and `dict` for membership tests, not lists.

## Tooling
- **Lint and format with ruff** (`ruff check`, `ruff format`), type-check
  with mypy or pyright, and test with pytest.
