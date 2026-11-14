# Workflow: translation and review

The aim is correct, consistent content with fast parallel work. This file defines roles, ownership, and review stages. `guides/translation-es.md` defines language quality. Book-specific choices belong in `books/<id>/NOTES.md`.

## User and orchestrator

The user sets the scope, model, thinking level, and concurrency limit. The orchestrator communicates with the user and coordinates all work.

The orchestrator owns preparation, source and asset work, audio, webpage changes, shared-data integration, builds, tests, and commits. Subagents translate and review content. The orchestrator checks reviewer diffs rather than routinely repeating their full content reviews.

Before adding or changing a review stage, explain its purpose, scope, and effect on time or parallel work. Get the user's confirmation. Extra passes within an agreed stage need no further permission when issues remain.

Use the agreed exact model and thinking level for every subagent. The current translation and review agreement is `openai-codex/gpt-6.1-sol`, thinking `high`. Do not silently change it. Stay within the user's agreed concurrency limit.

## Jobs and chapter ownership

A **job** is a batch of consecutive paragraphs with one answer file. “Section” means the same thing; use “job” in assignments and reports. It is not a new division in the book.

One translator reads the complete English chapter, then its selected Spanish counterpart, and translates the jobs in order. Do not split a chapter among translators. Job size limits the amount of work between handoffs, not the translator's context.

Prepare manageable jobs before translation starts. Prefer scene or conversation boundaries when practical. The current `prep` tool uses approximate token counts and paragraph boundaries; it does not detect scenes. Do not change job ranges or sentence IDs after a handoff without coordinating all affected work.

A short chapter can have one job. Its job review and whole-chapter review remain separate stages, each with its own minimum pass count.

## Preparation and parallel work

- Read the book notes and agree on lasting choices with the user before using them throughout the book.
- Prepare the English source, job files, and reference data. Preserve valid source text and timings when the task does not require changes.
- Select a corresponding Spanish translation before drafting. Provide its local path and chapter location to translators and reviewers.
- For a series, prefer counterparts from the same publisher edition family and source. Verify each volume separately.
- Record the counterpart's translator, publisher, edition, digital revision, and source in the book notes. Mark unverified details explicitly.
- Check internal credits and chapter correspondence; filenames and a shared download source do not establish an exact edition match.
- Keep counterpart files and extracts local, outside the repository. Report a missing counterpart or uncertain correspondence before translation starts.
- Prepare audio, pictures, and webpage changes while content agents work, when these tasks have no conflicting dependencies.
- Prepare dictionary entries for the chapter's vocabulary and useful common senses. Do not expand into unrelated vocabulary.
- Dictionary preparation can overlap translation. Translators report missing entries and concepts instead of waiting for the whole dictionary batch.
- Several chapters can run at once within the agreed scope and agent limit. Each chapter has its own translator and review stages.
- Prioritize work that releases the next job or review. More active agents are not a goal by themselves.

## File ownership and handoffs

**One writer per file at a time.** The orchestrator assigns exact editable paths. Reading other files does not give permission to edit them.

1. The translator writes, validates, reads, and corrects the current job.
2. The translator immediately reports that job as ready for review, then stops editing it.
3. The orchestrator checks the handoff and commits that job's baseline before a reviewer edits it.
4. The reviewer becomes the job's writer. The translator continues with the next job.
5. The reviewer finishes edits and checks, reports results, and releases the files.
6. The orchestrator checks the diff, resolves concerns, integrates shared proposals, and commits accepted changes.

Enable `mid_task_reports: true` when launching the translator, and request immediate job-completion reports. Do not wait for the whole chapter to finish before reporting ready jobs. Each report includes the job, file paths, check results, shared proposals, and unresolved questions.

A translator must not silently revise a handed-over job during a later consistency check. Report the issue to the orchestrator. The orchestrator assigns its correction without creating a second writer.

Only the orchestrator stages and commits files. Add named task files, not unrelated or unfinished work. Other agents can continue in separate files. Local commits do not authorize a push; push only when the user asks.

Changing the documentation does not change an active agent's file permissions. Make each ownership transfer explicit.

## Review stages and passes

A **stage** has a defined scope and purpose. A **pass** is one review of that scope by a fresh reviewer subagent.

The standard stages are:

- **Job review:** check every reading line, popup unit, note, and relevant shared reference in one job.
- **Whole-chapter review:** after all jobs clear review, check the complete chapter and its relevant shared references. Include voice, repeated terms, forms of address, continuity, spoilers, and job boundaries.

Every stage requires **at least two consecutive passes by separate fresh reviewers**. A first pass with no findings does not remove the second pass. Translator self-checks and orchestrator diff checks do not count as reviewer passes. Job passes do not count toward the whole-chapter minimum.

For each pass:

1. Give the reviewer a committed baseline, exact scope, editable files, guides, book notes, and previous findings.
2. Ask the reviewer to inspect the assigned content, not only the previous reviewer's changes.
3. Let the reviewer directly fix clear errors in owned content files. Propose shared-file changes instead of editing them.
4. Require validation and a report of substantive changes, shared proposals, coverage, and unresolved concerns.
5. Check every reviewer edit through the diff and surrounding English and Spanish. Check validation results and proposed shared changes.
6. Commit accepted corrections before the next reviewer begins.

The orchestrator launches another fresh reviewer whenever diff checks, validation, or reports expose unresolved concerns. Point that reviewer to the concerns without restricting the rest of the agreed scope.

A stage finishes only after its minimum passes, successful checks, and no unresolved issues in the scope. Valid corrections do not automatically require another pass if the minimum is met and the diff check finds no further issue. Do not repeat reviews merely to replace acceptable wording with another preference.

Reviewers fix errors, not their predecessors' personal style. Raise ambiguous meaning, character voice, or lasting terminology choices for the orchestrator to resolve. The orchestrator discusses lasting book choices with the user.

Record the stage, scope, pass number, reviewer, baseline commit, changed files, shared proposals checked, validation, and remaining issues. A preparation report or partial inspection is not a completed pass over a larger scope.

## Dynamic stages

The workflow can gain stages during work, with user confirmation. For example, a cross-chapter stage can check terminology, voices, forms of address, and continuity across several chapters.

Every added stage has the same two-pass minimum, fresh reviewers, committed baselines, diff checks, and repeat-until-resolved rule. It does not replace another required stage unless the user explicitly changes the plan.

Stages can overlap when their editable files do not overlap. Whole-chapter review waits for that chapter's job reviews. A cross-chapter editing stage needs ownership of its affected files before it starts.

## Shared references in every review

Every reviewer checks the shared material relevant to the assigned scope, including existing content. Do not reread the entire dictionary during every pass.

- Job reviewers check their units' dictionary senses and forms, grammar explanations, links, and book rules.
- Whole-chapter reviewers check those references and their consistent use across the chapter.
- Cross-chapter reviewers check their consistent use across the assigned chapters.

Sentence-specific notes stay in chapter answer files. Reusable grammar explanations live in `guides/concepts-es.json`. Dictionary entries live in `guides/dictionary-en.json`. Names, terms, voices, and forms of address live in the book notes.

Translators and reviewers propose shared additions or corrections with affected sentence IDs, meanings, examples, and reasons. Reviewers may find errors in existing shared content, not only new proposals.

The orchestrator combines duplicate proposals, resolves conflicting IDs, and integrates changes into shared files. Only the orchestrator writes these files. Preserve linked dictionary sense and concept IDs. Never silently change an entry's meaning to fit one chapter.

Before changing shared content, find its uses. Tell affected agents about changes and arrange rechecks where needed. A changed shared reference can reopen an affected review scope; it must not silently invalidate completed reviews.

Shared material belongs to every relevant review stage. Each pass includes relevant shared content and pending proposals. Shared changes must not escape review because only the orchestrator writes them. Arrange further review if integration exposes new concerns. Do not add a separate shared-reference stage without the user's confirmation.

## Tools and completion

- Read `guides/translation-es.md` and the book's Translation notes before translating or reviewing.
- Use the counterpart as starting wording, not as finished answers or an alignment map. Follow the guide's English-based checks.
- Prepare jobs: `.venv/Scripts/python tools/translation.py prep books/<id> <n> [--jobs N] [--paragraphs N]`.
- Validate a job: `.venv/Scripts/python tools/translation.py check books/<id> <n> <job>`.
- Read its display: `.venv/Scripts/python tools/translation.py show books/<id> <n> [job]`.
- Check shared entries: `.venv/Scripts/python tools/dictionary.py check`.
- Follow `guides/dictionary-en.md` for meanings, examples, and raw evidence for irregular forms.
- Keep unresolved proposal warnings visible. An `OK` structural check does not prove that all dictionary and concept links exist.
- Do not claim a complete review from truncated output. Read bounded portions until the assigned scope is complete.
- Translators and reviewers report English source errors; they do not edit timed source text. The orchestrator decides the source and timing work.

After the required stages pass, the orchestrator builds the site and checks coverage, links, assets, and affected existing chapters. Run `tools/prepare_pwa.py`, automated tests, and browser checks for reading lines, popups, playback, and seeking. Fix integration problems and return content concerns to reviewers.

Measure elapsed time, waiting, review passes, and rework between chapters. Use those results to propose workflow changes to the user. Keep the process simple. Beyond the agreed stages, do not add tracking systems or repeated full reads without a concrete need.
