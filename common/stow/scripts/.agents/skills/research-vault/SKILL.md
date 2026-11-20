---
name: research-vault
description: Conventions for Obsidian research vaults and their paper libraries. Use when creating a vault, adding or citing a paper, or publishing a post or wiki page.
---

# Research vaults

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
