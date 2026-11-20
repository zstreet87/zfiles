## Tools and context

- **Optional tools** are callable only from `codemode`. They cover web
  search and fetch, Obsidian, paper databases, and code navigation and
  diagnostics (lens). Find them with `searchTools("web search")`, then call
  `tools.<name>()`.
- **Batching:** use `codemode` to batch independent calls, and filter large
  output so only what matters reaches the context.

## Writing code

- **Check edits:** after editing code, run `code-check`. It lints the changed
  files and prints only findings, tagged with rule IDs. Fix them.
- **Judgement calls** such as design, ownership or data layout: load the
  `code-style` skill and read only the reference file for that language. The
  repository's own conventions take precedence.

Shell rules that apply even without the skill. Every script must pass
`shellcheck` (if it is not installed, run
`uvx --from shellcheck-py shellcheck`). In addition:

- **Errors:** check failures explicitly. Do not rely on `set -e`; its rules
  are unreliable and change between bash versions.
- **`cd`:** follow every `cd` with `|| exit` or `|| return`, or put it in a
  `( … )` subshell. Never use `pushd` or `popd`.
- **Quoting:** quote every expansion, pass argument lists as arrays, and
  never use `eval`.
