# Development Log (append-only — add new entries, never rewrite old ones)

## 2026-10-01T09:41:03+05:30 — Session start, state restore (new project)
- Phase/unit: 0 – bootstrap        Branch: none (no git repo)
- What: loaded `erp-prp` skill; checked `docs/logs/STATE.md` (absent), `DEVLOG.md` (absent),
  `OPEN_QUESTIONS.md` (absent); ran `git status` (not a repo); listed resource folder (read-only).
- Why: Rule 0 — restore state at session start.
- Resources used: `/run/media/ash_63/DATA/ERP_Resouce` (directory listing only)
- Files changed: none
- Commands that changed state: none (read-only checks)
- Verification: confirmed new project — no STATE.md, no git repo, workspace holds only `AGENTS.md`, `opencode.json`, `.opencode/`
- Problems & fixes: none
- User interaction: reported new-project state; user replied "ok plan the phase 0 and create project file structure from resource" + "inside ERP_DEV folder"
- Next: Phase 0 understand step (inventory + extracts)

## 2026-10-01T09:41:03+05:30 — Resource inventory + extracts
- Phase/unit: 0 – bootstrap        Branch: none
- What: hashed all 4 resource-folder files (sha256); extracted SOW + landing checklist via
  python-docx, tech-stack PDF via pdftotext; copied playbook text; wrote extracts with header
  (source path, date, hash) to `ERP_DEV/docs/01-requirements/source-extracts/`; read all four documents.
- Why: Phase 0 activities — inventory + derived extracts (Rule 1); SOW/REQ understanding (Rule 3 loop step 1).
- Resources used: all four files under `/run/media/ash_63/DATA/ERP_Resouce` (read-only; nothing written there)
- Files changed: `ERP_DEV/docs/01-requirements/source-extracts/*.md` (4 files)
- Commands that changed state: `mkdir -p ERP_DEV/docs/...` (new dirs only)
- Verification: `sha256sum` output captured; extract sizes checked (sow 23530 B, landing 10230 B,
  tech-stack 20398 B, playbook 23861 B). Content spot-checked against sources. No raw binaries copied.
- Problems & fixes: no pandoc/libreoffice — used installed python-docx + pdftotext; no new dependencies installed.
- User interaction: none in this step (authorised in advance)
- Next: write PLAN.md, skeleton, logs; present for commit approval
- Deviation note: Rule 3 step 2 says show the plan and wait before building; the user authorised
  planning + skeleton creation together, so both are presented jointly for approval at commit review.

## 2026-10-01T09:46:34+05:30 — User answers: inventory approved, git-flow-lite confirmed, report-first
- Phase/unit: 0 – bootstrap        Branch: main (uncommitted)
- What: presented Phase 0 work + asked 3 questions. User: (1) commit question → "first give the report
  what you did and then ask re this" (full report requested before any commit); (2) resource inventory
  → approved (Phase 0 inventory exit item met); (3) Q-001 → git-flow-lite (skill default confirmed).
- Why: Phase 0 exit needs inventory approval; branching model needed before creating `develop`.
- Resources used: none
- Files changed: `RESOURCE_INDEX.md` (approval recorded), `OPEN_QUESTIONS.md` (Q-001 answered),
  `STATE.md` (updated)
- Commands that changed state: none
- Verification: Q-001 row checked after edit; R-002 closed.
- Problems & fixes: my first Q-001 edit matched the table header instead of the Q-001 row and mangled
  lines 3–5; repaired immediately with a corrective edit (file uncommitted, no history rewritten) and
  verified by re-reading. Lesson: anchor table edits on the row ID, not the header tail.
- User interaction: answers as above; commit still NOT approved — report first, then re-ask.
- Next: deliver full Phase 0 work report, then re-ask the commit question.

## 2026-10-01T09:46:34+05:30 — Initial commit + develop + fresh-developer test
- Phase/unit: 0 – bootstrap        Branch: main → develop
- What: user approved commit ("Yes, commit as proposed"). Pre-commit: read `opencode.json` (no secrets);
  found `.opencode/node_modules/` — excluded via its nested `.gitignore` (only `skills/` staged).
  Staged explicit paths (`ERP_DEV`, `AGENTS.md`, `opencode.json`, `.opencode`); fixed malformed
  `.gitattributes` line 3 (multi-pattern line rejected by git) and re-staged. Committed, created
  `develop`, switched to it. Fresh-developer test: clean local clone of `develop` — full docs tree,
  clean status. Wrote `phase-0/PHASE-REPORT.md` (uncommitted).
- Why: Phase 0 exit — skeleton committed on `develop`, inventory approved, clone-verified.
- Resources used: none
- Files changed: 67 files, +2859 (see commit); plus uncommitted `PHASE-REPORT.md`
- Commands that changed state: `git init -b main`, `git add <explicit paths>`, `git commit`, `git branch develop`, `git checkout develop`, `git clone -b develop . /tmp/opencode/freshclone` (test only)
- Verification: `git log --oneline -n 5` → `fec27bb docs(core): phase 0 bootstrap — skeleton, inventory, extracts`;
  `git status` clean on both worktree and clone; forbidden-file scan 0; `git check-attr` clean.
  NOT verified: clone from a remote (no remote configured — nothing pushed, per rule).
- Problems & fixes: `.gitattributes` multi-pattern line invalid — split to one pattern per line.
- User interaction: commit approved as proposed; PHASE-REPORT + continue-to-Phase-1 still to be approved.
- Next: present commit + report; ask to commit PHASE-REPORT and whether to continue to Phase 1.

## Key facts learned (for Phase 1)
- SOW: 9 CORE modules ERP-01…ERP-09 + 5 optional add-ons ERP-10…ERP-14 (need client confirmation);
  facilities depth TBD in requirements analysis; tax/posting treatment TBD; RFID 1 terminal + 100 cards;
  9 implementation phases; exclusions list (§30).
- Landing checklist: every item unanswered; catalogue + logo "received" but no copy in the folder.
- Tech-stack proposal (Java 21/Spring Boot, React+TS, Postgres, Kafka, Redis, K8s, Keycloak) is a
  *proposal* — stack is decided by ADR in Phase 2, not assumed now.
- Playbook §4 (trunk-based, no `develop`) conflicts with skill git-flow-lite (`main` + `develop`).
  Per source-of-truth order the SOW wins on scope; on process the skill wins unless the user says
  otherwise → logged as Q-001.
- Playbook cites `QuantumClk_Freelance_Consultancy_Agreement` — not in the folder → Q-002.
