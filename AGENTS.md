# zfiles

## Paths in this repo

This repo is public. Do not write absolute paths containing a username,
employer, internal hostname, or work directory into any tracked file -- use
`$HOME`, `${XDG_*}`, or a discovery command. Employer-specific tooling and
tenant identifiers stay out of the repo entirely: `$HOME/.local/bin` and
`~/.config/shell/secrets.env` are untracked and are where they go.

`common/githooks/pre-push` blocks the identifiers in
`${XDG_CONFIG_HOME:-$HOME/.config}/zfiles/leak-patterns`, but treat it as a
backstop, not permission.

Research-vault conventions live in the `research-vault` skill; coding standards in `code-style`.
