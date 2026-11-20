# Bash / shell

Sources (read in full): [Google Shell Style Guide](https://google.github.io/styleguide/shellguide.html)
(G §n), [BashPitfalls](https://mywiki.wooledge.org/BashPitfalls),
[BashGuide/Practices](https://mywiki.wooledge.org/BashGuide/Practices),
[BashFAQ/105](https://mywiki.wooledge.org/BashFAQ/105), [ShellCheck wiki](https://www.shellcheck.net/wiki/) (SCnnnn).

## Scope
- **Use shell for small wrappers and glue.** Past about 100 lines or
  non-trivial control flow, rewrite in Python *now* (G §1.2).
- **Shebang:** use `#!/usr/bin/env bash` (this picks up a newer bash, for
  example on macOS) and record the minimum bash version the script needs.
  Set options with `set`, not on the shebang line (Practices, G §1.1).
- **Lint every script:** it must pass `shellcheck` (G §6.1). If it isn't
  installed, run `uvx --from shellcheck-py shellcheck`.

## Errors (strict mode is not error handling)
- **Check failures explicitly.** Test the command itself (`if ! mv -- "$a"
  "$b"; then`), not `$?` (G §8.1, SC2181). Send errors to stderr through an
  `err()` helper (G §3.1).
- **Don't rely on `set -e`.** It is silently disabled inside any function
  called from `if`, `&&`, `||` or `!`, and inside `$(…)`. `local` hides
  the exit status, and the rules change between bash versions (FAQ 105,
  Pitfalls). Write explicit checks whether or not it's on. `set -u` is the
  least harmful of the three options.
- **No global `pipefail`.** It makes `cmd | head` and `cmd | grep -q`
  fail at random through SIGPIPE. Turn it on only around pipelines whose
  later stages read all of their input (Pitfalls).
- **Check every `cd`:** `cd -- "$d" || exit`.
  - Avoid changing directory where you can: use `git -C`, `make -C` or
    absolute paths.
  - Run a temporary `cd` inside a subshell: `( cd -- "$d" || exit; work )`.
  - Never use `pushd`/`popd` in scripts. An interrupted script is left in
    the wrong directory, and `popd` returns to a directory by name, which
    may have moved (Pitfalls, SC2164, SC2103).
- **Don't use `a && b || c` as if/else;** `c` also runs when `b` fails.
  Write an `if` (SC2015).
- **Declare, then assign:** `local x; x=$(cmd)`. Assigning on the
  declaration line hides `cmd`'s exit status. The same applies to `export`
  and `readonly` (G §7.5, SC2155).
- **Copy `PIPESTATUS` immediately** (`rc=("${PIPESTATUS[@]}")`); the next
  command overwrites it (G §8.1).
- **Under `set -e`, `(( i++ ))` exits** when `i` is 0 (G §6.9).
- **Clean up with `trap 'rm -rf -- "$tmp"' EXIT`.** Single-quote the trap
  so it expands when it fires (SC2064).

## Quoting and data
- **Double-quote every expansion:** `"$var"`, `"$(cmd)"`, `"${arr[@]}"`.
  `${var}` is not quoting (G §5.7, SC2086).
- **Argument lists are arrays,** never strings. Forward arguments with
  `"$@"`. Read command output with `readarray -t a < <(cmd)` (G §6.7,
  SC2206/SC2207).
- **Print data with `printf '%s\n' "$x"`.** Never put data in a format
  string, and never `echo` arbitrary data (SC2059).
- **Never splice data into code:** no `eval` (G §6.6), and no `sh -c '…{}…'`
  with `find`. Pass the data as an argument instead:
  `find . -exec sh -c 'f "$1"' _ {} \;`.
- **Arithmetic evaluates code.** `(( ))`, `$(( ))`, `[[ -gt ]]` and array
  subscripts all run `$(…)` found inside a value. Validate untrusted input
  first (`case $x in ''|*[!0-9]*) die;; esac`), or use
  `[ "$x" -gt 0 ]` (Pitfalls).
- **Use `$HOME`, not `~`,** in quoted strings and in `export`/`local`
  assignments (SC2088).

## Files
- **Never parse `ls`** (SC2045). Loop over a glob (`for f in ./*.txt`), or
  use `find … -print0 | while IFS= read -r -d '' f`.
  - Guard against a glob that matches nothing: `[[ -e $f ]] || continue`
    (SC2044).
- **Write globs as `./*` or put `--` before file arguments,** so a file
  named `-rf` isn't read as an option (G §6.5, SC2035). Guard deletes with
  `rm -rf -- "${dir:?}/"*` (SC2115).
- **Read lines with `IFS= read -r line`** (SC2162). Use `xargs -0` with
  `-print0` (SC2038).
- **Never read and write the same file in one pipeline.** Write to a temp
  file, then `mv` it into place (SC2094).
- **Read loops whose variables must survive the loop:** use `while …; done
  < <(cmd)`, not `cmd | while`. A pipe runs the loop in a subshell, so
  variables set inside are lost (SC2030/SC2031).

## Style
- **Tests and arithmetic:** use `[[ ]]` for tests and `(( ))` for trusted
  arithmetic. Never use `<`/`>` for numbers inside `[[`; they compare as
  strings (G §6.3).
- **Functions:**
  - Every variable inside a function is `local`.
  - Make constants `readonly`.
  - Define functions with `f() {`, without the `function` keyword.
  - With several functions, end the script with `main "$@"` (G §7).
- **Library functions get a header** listing Globals, Arguments, Outputs
  and Returns (G §4.2).
- **Prefer builtins to forking:** `${var%.*}`, `${s//a/b}`, `[[ =~ ]]`.
  Loop with `for ((i=0; i<n; i++))`; `{1..$n}` doesn't expand (G §8.2).
- **Redirection order:** `cmd >>log 2>&1`, not `2>&1 >>log` (SC2069).
  For root-owned files use `cmd | sudo tee file`, because `sudo cmd >file`
  redirects as you, not as root (SC2024).

## Disagreements and choices
- **Strict mode:** the widely shared `set -euo pipefail` is "dubious at
  best" (FAQ 105), and Google doesn't prescribe it. Repositories that
  already use it may keep it, but explicit checks are still required.
- **Shebang:** Google uses `#!/bin/bash`; Practices uses
  `#!/usr/bin/env bash`. Use `env`.
- **`let`:** Google bans it, but `let 'h[$k]++'` is the one safe way to
  increment an associative array with arbitrary keys (Pitfalls).
