# Reviewing a change

Source (read in full): [Google Engineering Practices, code review](https://google.github.io/eng-practices/review/)
(reviewer and author guides). Pair with the `code-review` skill for running a review.

## Standard
- **Approve when the change clearly improves overall code health,** even if
  it isn't perfect. Never approve a change that makes code health worse
  (standard).
- **Technical facts and data overrule opinions.** The style guide is the
  final word on style. If the author shows two approaches are equally valid,
  accept the author's choice (standard#principles).

## What to look for
- **Over-engineering:** reject code built for imagined future needs, and
  solve the problem that exists now. "Too complex" means a reader can't
  understand it quickly (looking-for#complexity).
- **Concurrency:** reason it through by reading. Races and deadlocks rarely
  show up when you run the code (looking-for#functionality).
- **Tests:** they belong in the same change. Check that each test would
  fail if the code broke. Complexity in test code isn't acceptable either
  (looking-for#tests).
- **Every line:** review every line a human wrote. If you can't understand
  some code, ask for it to be clarified rather than guessing.
- **Unclear code:** fix the code, or add a comment in the code. An
  explanation left only in the review tool helps no future reader
  (comments, handling-comments).

## Process
- **Insist that cleanup happens now.** Cleanup deferred to "a later change"
  usually never happens. If it really must wait, file a bug and add a
  TODO that points to it (pushback).
- **Label comment severity:** Nit, Optional or FYI. Without labels,
  authors treat every comment as mandatory (comments).
- **Respond within one business day.** Speed of response matters more than
  total time, and faster responses resolve most complaints about
  strictness (speed).

## Authoring
- **Keep changes small:** one self-contained change, roughly 100 lines
  (1000 is too many). Ship a new API together with code that uses it.
  Keep refactors separate. The build passes after every change
  (small-cls).
- **Description:** start with an imperative first line that stands on its
  own, then a body explaining why, the limitations and the context
  (cl-descriptions).
- **The commit message carries the explanation.** A PR description doesn't
  show up in `git blame` (TigerStyle).
