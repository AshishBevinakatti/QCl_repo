# Documentation structure and record templates

## Repository docs tree (create in Phase 0)
```
README.md                         project overview + link to docs/README.md
docs/
  README.md                       index of all docs, "start here" for humans
  00-onboarding/
    DAY-ONE.md                    zero -> running app -> first test -> first commit
    ARCHITECTURE_OVERVIEW.md      one-page picture + links to details
    GLOSSARY.md                   hotel / ERP / project terms
    WORKING-AGREEMENT.md          how we work: phases, gates, git flow, commit approval
  01-requirements/
    RESOURCE_INDEX.md             every file in the resource folder: what it is, who needs it
    source-extracts/              text extracts of SOW, Decision Pack, Landing Page doc
    REQUIREMENTS.md               REQ-<module>-<nnn> with source + acceptance criteria
    TRACEABILITY.md               SOW section -> REQ -> design -> code -> test -> doc
    DECISIONS-FROM-CLIENT.md      Decision Pack answers: confirmed / pending / out of scope
    CHANGE_REQUESTS.md            CR-<nnn>
  02-architecture/
    adr/                          ADR-<nnn>-<slug>.md
    data-model.md  api.md  security.md  integrations.md  environments.md
  03-phases/
    phase-0/ ... phase-9/         PLAN(s), PHASE-REPORT
  04-modules/
    erp-01-website-cms.md ... erp-14-hrms.md, facilities.md, housekeeping.md, maintenance.md
  05-operations/
    runbook.md  backup-restore.md  deployment.md  troubleshooting.md  release-process.md
  06-user-guides/                 user guide, admin guide, training material (client-facing)
  07-testing/                     test plan, test report, UAT scripts, defect log
  logs/
    STATE.md                      current state (overwritten)
    DEVLOG.md                     append-only chronological log
    DECISIONS.md                  small decisions & assumptions (big ones -> ADR)
    RESOURCES_LOG.md              append-only resource usage
    OPEN_QUESTIONS.md             questions for client/user, with status
    RISKS.md                      risk register
    CHANGELOG.md                  user-visible changes (Keep a Changelog)
  templates/                      copies of the templates below
```

## STATE.md (overwrite each time)
```markdown
# Project State
Updated: <date -Iseconds>
Phase: <N – name>      Work unit: <id – name>      Status: <planning | awaiting plan approval | implementing | verifying | awaiting commit approval | awaiting phase-gate answer | paused>
Branch: <name>         Uncommitted changes: <yes/no – summary>
Last approved by user: <what, when>
Pending question to user: <exact question or "none">
Next action: <one concrete step>
Blockers / missing resources: <list or none>
```

## DEVLOG.md entry (append-only)
```markdown
## <date -Iseconds> — <short title>
- Phase/unit: 3.2 Booking engine        Branch: feature/3.2-booking-engine
- What: <what was done>
- Why: <reason / requirement refs: REQ-…, SOW §…>
- Resources used: <paths from /run/media/ash_63/DATA/Intership wrok/ERP_Resouce, or "none">
- Files changed: <list or "see commit <hash>">
- Commands that changed state: <installs, migrations, git operations>
- Verification: <tests run, results, manual checks, what was NOT verified>
- Problems & fixes: <errors, root cause, fix>
- User interaction: <questions asked, answers, approvals/refusals>
- Next: <next step>
```

## RESOURCES_LOG.md row
```markdown
| Date | Path (under /run/media/ash_63/DATA/Intership wrok/ERP_Resouce) | sha256 (key docs) | Used for | Phase/unit | Extract location |
```

## ADR (docs/02-architecture/adr/ADR-NNN-slug.md)
```markdown
# ADR-NNN: <title>
Status: proposed | accepted (date, approved by) | superseded by ADR-MMM
Context: <problem, constraints, SOW refs>
Options considered: <A, B, C with pros/cons>
Decision: <chosen option>
Consequences: <good, bad, follow-ups, how to reverse>
```

## Phase PLAN (docs/03-phases/phase-N/<unit>-PLAN.md)
```markdown
# <Unit> Plan
Goal · SOW/REQ references · In scope · Out of scope (with reasons) · Design (data, API, screens, states, rules)
Config vs code decisions · Tests to write · Docs to update · Risks · Open questions · Definition of done · Estimated slices
Approval: <who, when>
```

## PHASE-REPORT
```markdown
# Phase N Report
Summary · Deliverables (with links) · Exit checklist with evidence · Deviations from plan · Test evidence
Docs updated · Fresh-developer test result · Risks & open questions carried forward · Commits/merges/tags (hashes)
Decision requested: continue to Phase N+1? — answer: <user's answer, date>
```

## Module doc (docs/04-modules/<module>.md)
Purpose · SOW refs and REQ ids · Actors/roles · Business rules (each with source) · Data model (tables, key fields) · State machine · API endpoints · Screens · Permissions · Configuration options · Integrations/adapters · Events/audit entries · Tests (where they live, how to run) · Known limits · Troubleshooting · Change history.

## Traceability row
`| SOW § | REQ id | Requirement | Design ref | Code (path) | Tests (path) | Doc | Status |`

## Change Request entry
`CR-NNN | date | requested by | description | SOW reference / why out of scope | impact (effort, schedule, modules) | status: proposed / quoted / approved / rejected | decision date`

## Open question entry
`Q-NNN | date | module | question | why it blocks | default used meanwhile | owner (client/user) | status | answer + date`

## DAY-ONE.md outline (must be verified by actually following it)
1. What this project is (5 lines) and where the requirement documents live (and extracts if the drive is unavailable)
2. Prerequisites with exact versions; how to check each
3. Clone, install, configure (`.env.example` → `.env`), seed data, run — exact commands + expected output
4. Run the tests; expected result
5. Repo map: what each top-level folder is for
6. The development workflow in one page: phases, work-unit loop, branch names, commit format, "agent asks before commit"
7. How to make a first small change safely (worked example), including the doc update
8. Where decisions, logs and open questions are; how to add an ADR
9. Common problems and fixes
10. Who/what to ask when stuck

## Documentation quality bar
- A new developer can complete DAY-ONE.md without help.
- Each doc states: purpose, audience, last verified date, owner.
- No orphan docs: everything is linked from `docs/README.md`.
- No screenshots as the only source of truth; text first.
