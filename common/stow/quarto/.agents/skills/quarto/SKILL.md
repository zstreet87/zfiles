---
name: quarto
description: "Render research notes, papers and blog posts with Quarto — PDF/LaTeX/HTML from one source, Obsidian notes as direct input, filter ordering, and the blog publish path. Use when rendering a paper or post, debugging a Quarto build, or editing _quarto.yml."
---

# Quarto

Quarto is the **only renderer** in this setup. One source file becomes the blog
post and the paper; nothing else converts between formats.

```bash
quarto render notes/method.md --to pdf      # paper
quarto render notes/method.md --to latex    # .tex for arXiv / a journal
quarto render notes/method.md --to html     # blog-shaped
quarto preview notes/method.md              # live reload while editing
quarto render                               # everything in the project
```

`quarto preview` is the workhorse for drafting: keep it running, edit the note
in Obsidian or the terminal, watch it re-render.

## Obsidian notes are valid input

A vault scaffolded by `new-research-project` is a Quarto project. Its
`_quarto.yml` makes `.md` notes render as-is:

```yaml
from: markdown+wikilinks_title_after_pipe+mark
filters: [obsidian]
```

So `quarto render notes/x.md --to pdf` works on a note written in Obsidian,
with `[[wikilinks]]`, `![[embeds]]`, callouts and `[[@citekey]]` intact. There
is no conversion step to run first, and no intermediate file to inspect.

## Filter ordering is the thing that bites

Quarto runs filters in phases. A filter declared with a bare path runs **after**
Quarto has normalized the document, which is too late to produce anything Quarto
itself needs to act on. Declare the phase explicitly:

```yaml
contributes:
  filters:
    - at: pre-ast
      path: obsidian.lua
```

Valid values, from `share/schema/definitions.yml`:
`pre-ast, post-ast, pre-quarto, post-quarto, pre-render, post-render, pre-finalize, post-finalize`.

Measured on Quarto 1.10.18, rendering a note whose filter emits a
`.callout-warning` Div, checking for `tcolorbox` in the generated `.tex`:

| `at:`        | callout renders in PDF |
| ------------ | ---------------------- |
| `pre-ast`    | **yes**                |
| `post-ast`   | no                     |
| `pre-quarto` | no, despite the name   |

The failure mode is nasty: HTML still looks right (the HTML writer renders the
class regardless), the build succeeds, and only the PDF silently loses the
callout box **and** its title — the title lives in a Div attribute, so it
vanishes with the box. If a callout looks fine in `--to html` and wrong in
`--to pdf`, this is why.

**Anything that must be recognized by Quarto — callouts, cross-references,
figure handling — has to be produced at `pre-ast`.**

## Debugging a failed render

1. `keep-tex: true` is already set in the vault template, so read the `.tex`
   next to the output. That is what LaTeX actually saw.
2. A LaTeX error usually points at a line far from its cause. Search the `.tex`
   for the surprising construct, not for the line number.
3. Filter warnings go to stderr and Quarto does not highlight them:
   `quarto render x.md --to pdf 2>&1 | grep obsidian.lua`
4. To take Quarto out of the picture, run the bundled Pandoc directly:
   ```bash
   PD=~/.local/share/quarto/bin/tools/x86_64/pandoc
   "$PD" x.md --from markdown+wikilinks_title_after_pipe+mark \
        --lua-filter _extensions/obsidian/obsidian.lua --to markdown
   ```
   If it works here but not under Quarto, the difference is phase or paths.

## Quarto does not hand Pandoc your file

It stages a copy into `/tmp/quarto-session-XXXX/quarto-input-XXXX.md`. Inside a
filter, `PANDOC_STATE.input_files[1]` therefore points into `/tmp`, and anything
that walks up from it to find a project or vault root finds nothing. Use the
environment instead:

| variable                | value                                |
| ----------------------- | ------------------------------------ |
| `QUARTO_DOCUMENT_PATH`  | the real directory of the source file |
| `QUARTO_PROJECT_DIR`    | the project root                     |

Quarto also `chdir`s into the document's directory, so the working directory is
a usable fallback. Plain `pandoc` sets neither but does give a real input path —
a filter that must work under both should try all of them.

## Formats

`_quarto.yml` in the vault template defines `html` and `pdf` (lualatex, article,
`keep-tex: true`). A bare `quarto render` builds both, so it needs a LaTeX
engine; `quarto install tinytex` if the target has no texlive. See the `latex`
skill.

## Blog

The blog is a separate Quarto project at `~/Documents/Repos/zstreeter.github.io`.

- **Never edit `posts/` directly.** Source of truth is `drafts/<slug>.qmd` in
  the vault.
- `publish-post drafts/<file>.qmd [slug]` copies the draft and its images into
  `posts/YYYY-MM-DD-<slug>/index.qmd`.
- Deploy: `cd ~/Documents/Repos/zstreeter.github.io && quarto publish gh-pages`.

Don't add executable cells to a draft unless asked — the blog repo commits its
freeze cache, so executed output gets committed too.

## Install

Not from apt on these machines (no sudo). Omarchy has `quarto-cli-bin` in
`pkglist.txt`; WSL installs it user-local under `~/.local/share/quarto` with a
symlink in `~/.local/bin`.

## Related

`obsidian` (authoring and opening), `pandoc` (what Quarto delegates to, and how
the filter works), `latex` (engines and packages), `zotero` (`references.bib`).
