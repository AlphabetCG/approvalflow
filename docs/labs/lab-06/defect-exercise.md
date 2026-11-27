# Lab 6 — Controlled defect exercise DEF-EX-01

**Product Team:** TH-005_P5 (ApprovalFlow) · **UAT Team:** TH-001_P3 (LoungCheu)
**Version history:** v1 (2026-11-26) – defect, RED, GREEN, PR; v2 (2026-11-27) – release, deployed revision and TH-001_P3 acceptance decision recorded; retest pending

> **This exercise is separate from the Sprint 1 acceptance.** Sprint 1 was accepted by TH-001_P3 on release `v0.2.0` (`1cbd8b4`, revision `approvalflow-00006-8bp`). TH-001_P3 and the TA then approved this exercise. The defect was injected on purpose on a branch. It ran only in CI and was **never merged on its own, released, or deployed**. The release that comes out of it is a new version with the fix, not a change to what was accepted.

Defect report and triage: [issue #39](https://github.com/AlphabetCG/approvalflow/issues/39).

## 1. The defect

| | |
|---|---|
| Behaviour | A reviewer who is **not** assigned to a request can approve or reject it by calling `POST /api/requests/:id/approve` or `/reject` directly. The UI hides the Decision section, but the API does not check the assignment. |
| Correct behaviour | `404 {"error":"NOT_FOUND","message":"Request not found"}` (same as an unknown id); status stays `SUBMITTED`; no new History entry. |
| Requirement / AC violated | **D-13**, **AC-04-6**, **NFR-03** (Sprint 1, F-04); also BR-02 (the History records an actor who may not act) |
| Injected in | `server/src/requests/decide.ts`: the lookup and the conditional update no longer filter on the assigned reviewer |
| Severity / priority | Critical / P1 (authorization bypass; changes other departments' decisions) |

## 2. RED → GREEN

| Step | Commit | What | CI run | Result |
|---|---|---|---|---|
| Defect | `db65815` | Scope removed from `decide()` (commit message says CONTROLLED DEFECT EXERCISE) | [45779792279](https://github.com/AlphabetCG/approvalflow/actions/runs/45779792279) | **FAIL**: 1 / 172. The existing test T-04-09 caught it (`expected 200 to be 404`) |
| RED | `9715c6e` | New test T-04-23 in `server/tests/decisions.int.test.ts`: approve and reject, by an unassigned reviewer of the same department and of another department; checks 404 body, status `SUBMITTED`, same reviewer, History rows identical, assigned reviewer can still decide | [45779993354](https://github.com/AlphabetCG/approvalflow/actions/runs/45779993354) | **FAIL**: 5 / 176 (T-04-09 + 4 × T-04-23), all `expected 200 to be 404` |
| GREEN | `daad8ab` | Scope restored in the lookup (`requesterId` or `reviewerId` = caller) and in the conditional update (`reviewerId` = caller) | [45780108037](https://github.com/AlphabetCG/approvalflow/actions/runs/45780108037) | **PASS**: server 176 / 176 (unit + API/DB), client 44 / 44, E2E 4 / 4, Docker image builds |

**Test gap found:** before the exercise, T-04-09 covered only *approve* by a *same-department* reviewer. A defect in the reject path, or one limited to other departments, would not have been caught. T-04-23 covers both actions and both cases.

## 3. Version table

| # | Stage | Branch / ref | Commit | Deployed? |
|---|---|---|---|---|
| 0 | Baseline: Sprint 1 release accepted by TH-001_P3 | `main`, tag `v0.2.0` | `1cbd8b4` (same tree as `staging` `c77c9f7`, the branch point) | Yes: `approvalflow-00006-8bp`, image `sha256:7769a17259d37491eae97001f3d08dad5fc694c606b76d7c51ba22933249c8ea` |
| 1 | Defect injected (controlled exercise) | `fix/unassigned-reviewer-decide` | `db65815` | **No** (CI only) |
| 2 | Failing test T-04-23 (RED) | `fix/unassigned-reviewer-decide` | `9715c6e` | **No** (CI only) |
| 3 | Fix (GREEN) | `fix/unassigned-reviewer-decide` | `daad8ab` | No |
| 4 | Fix merged into `staging` (merge commit, reviewed and merged by copter549365) | PR #40 | `8e3c6d6` | No |
| 5 | Release with the fix on `main` (also #41 `/api/version`, #38 docs) | release PR #43, tag `v0.2.1` | `18438b3bdb7fe8497551eca617b576a52349c948` | Yes, by Deploy demo run [45873824600](https://github.com/AlphabetCG/approvalflow/actions/runs/45873824600) (push to `main`, 26 Nov 2026 18:10 UTC) |
| 6 | Deployed revision | Cloud Run `approvalflow` | image `sha256:08aa271b5e9daf7d17a8949031844d29c9776aec996db67f209f8dc9e7f9cc4d` (Cloud Run `status.imageDigest`; the run log shows the Artifact Registry index digest `sha256:76027ebecfc617670aef52714a2e84c64764f467f3ef29da3980fe76ef6f2acf`) | revision `approvalflow-00007-sbv`, 100 % traffic; smoke test PASS, incl. `/api/version` = `18438b3`; footer "Version 18438b3 · approvalflow-00007-sbv" (EV-DEF-01) |

Why the defect never reached Cloud Run: Deploy demo runs only on a push to `main` and deploys only the head of `main`. Images are built only there, so no image of `db65815` or `9715c6e` exists to roll back to. CI on the branch was started with `workflow_dispatch` (the CI workflow only, no deploy job).

## 4. Retest by TH-001_P3 — UAT-04 on the new revision

Run on the revision in row 6, after we announce it. Use the UAT-04 steps in [uat-handoff.md](uat-handoff.md) (§5), with steps 6a and 6b added before step 7:

| # | Action | Expected result |
|---|---|---|
| 6a | Still signed in as REV-FIN1 (another department). Open DevTools → Console on the app and run `fetch('/api/requests/<id>/approve',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(async r=>console.log(r.status, await r.text()))` with the id from step 1. Then the same with `/reject` and `body:'{"reason":"Not my request to decide"}'`. | Both print `404 {"error":"NOT_FOUND","message":"Request not found"}`. |
| 6b | Sign out; sign in as the Engineering reviewer who is **not** assigned (rev.eng1 if step 1 said rev.eng2, otherwise rev.eng2). Repeat both calls from 6a. | Both print `404 …Request not found`. |
| 7 | (as in the handoff) Sign in as the assigned Engineering reviewer; open the request. | Status still `SUBMITTED`; History has only "Submitted". |

| Field | Result |
|---|---|
| Tester / team | |
| Date and time | |
| Version tested (commit / revision) | |
| Inputs (request id, accounts) | |
| Actual result | |
| PASS / FAIL / BLOCKED | |
| Screenshot IDs | |

## 5. Acceptance

The Sprint 1 acceptance decision of TH-001_P3, sent in the IG group (EV-ACC-01):

| Item | Value |
|---|---|
| Decision | **Accepted** |
| Release | `v0.2.0` / commit `1cbd8b4` / revision `approvalflow-00006-8bp` |
| Decided by | Paphangkorn Luanseng, Jetanin Naitho (TH-001_P3) |
| Date | 25 Nov 2026 |
| Basis | 7/7 cases (UAT-01 to UAT-07) PASS, no findings; the team confirmed there was no deploy during testing |
| Conditions / limitations | None |

This decision stays as recorded. The retest above only records whether DEF-EX-01 is fixed on the new revision; it does not reopen the Sprint 1 decision.
