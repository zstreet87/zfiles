# Research vault convention

Every Obsidian vault has a matching paper directory: vault `<Name>` ->
`$HOME/Library/<Name>/`.

- **Creating a vault**: `new-research-project <Name>`. It scaffolds the
  Quarto/Obsidian template and creates the matching library directory in the
  same step, so the two cannot drift. It also resolves the vault root itself --
  that differs per target, so do not hardcode a root or reimplement the choice.
- **Adding a paper**: `paperctl add <title|arxiv-id|doi|url> --to <Name>`.
  Never download a PDF by hand -- paperctl files the PDF, writes a README index
  and BibTeX, is idempotent, and records link-only papers it cannot fetch.
- **Citing**: `paperctl bib --folder <Name> --out <vault>/library.bib`, then
  `bibliography: [references.bib, library.bib]` in `_quarto.yml`.
  `references.bib` is Better BibTeX's auto-export -- never hand-edit it.
- **Publishing**: `publish-post <vault>/drafts/<file>.qmd` (blog),
  `publish-confluence <file.md>` (wiki, needs `CONFLUENCE_*` in the
  environment). Both run `publish-lint` first and refuse anything a reader on
  another machine can't use -- local paths, `[[Note]]` links, local images.
  Use real `https://` links or plain text; never work around the gate.

Resolve paths, never assume them: `obsidian-vault path <Name>` for a vault,
`$HOME/Library` for the library. Anything target-specific belongs inside the
script that needs it, behind a runtime check -- not in this file, which is
loaded on every machine.

## Paths in this repo

This repo is public. Do not write absolute paths containing a username,
employer, internal hostname, or work directory into any tracked file -- use
`$HOME`, `${XDG_*}`, or a discovery command. Employer-specific tooling and
tenant identifiers stay out of the repo entirely: `$HOME/.local/bin` and
`~/.config/shell/secrets.env` are untracked and are where they go.

`common/githooks/pre-push` blocks the identifiers in
`${XDG_CONFIG_HOME:-$HOME/.config}/zfiles/leak-patterns`, but treat it as a
backstop, not permission.

## Writing code

Before writing or reviewing non-trivial Python, C, C++, Rust or
performance-critical code, load the `code-style` skill and read only the
reference file for that language. The repository's own conventions take
precedence over the skill.

## Writing shell scripts

Every script must pass `shellcheck` (run it via
`uvx --from shellcheck-py shellcheck` if it is not installed).

- **Strict mode**: start a script with `#!/usr/bin/env bash` and
  `set -euo pipefail`. Handle expected failures explicitly with `|| rc=$?`
  rather than turning strict mode off.
- **Changing directory**: avoid it. Use `git -C dir`, `make -C dir`, or
  absolute paths instead. If a command must run elsewhere, put it in a
  subshell, `( cd "$dir" || exit; cmd )`. Check every `cd` with `|| exit` or
  `|| return`. Do not use `pushd`/`popd` in scripts: they are meant for
  interactive use, an interrupted script leaves you in the wrong directory,
  and `popd` returns to a directory by name.
- **Quoting**: quote every expansion (`"$var"`, `"$(cmd)"`, `"${arr[@]}"`).
  Use arrays for argument lists, never word-split strings.
- **Tests**: in bash, use `[[ ]]` for tests and `(( ))` for arithmetic.
- **Variables**: declare variables in functions with `local`, and declare and
  assign them on separate lines when the value comes from a command, so its
  exit status is not lost.
- **Errors**: send errors to stderr (`>&2`). Exit non-zero on failure, and
  clean up temporary files with `trap 'rm -rf "$tmp"' EXIT`.
- **Scope**: if a script grows past about 100 lines or needs data structures,
  write it in Python instead.
