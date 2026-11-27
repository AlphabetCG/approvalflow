# Lab 7 — CR-01 change impact and contract revision

**Change request:** [#45](https://github.com/AlphabetCG/approvalflow/issues/45) CR-01, an approval above 20,000 THB requires a comment
**Type:** adaptive maintenance. The Sprint 1 rule was correct for its specification; the requirement changes.
**Version history:** v1 (2026-11-27, Naphat) – impact analysis and contract revision (F-04 v4), written before any code change

## 1. Old and new rule

| | Rule | Source |
|---|---|---|
| **Old** (Sprint 1, accepted `v0.2.0` / `1cbd8b4` / `approvalflow-00006-8bp`; still the behavior on `main` `18438b3` / `approvalflow-00007-sbv`) | Approve takes an **optional** comment of at most 1,000 characters after trimming, for **any** amount. | D-14, AC-04-2, T-04-03, T-04-05 |
| **New** (BR-08, D-17) | Approve of a request **above 20,000.00 THB** needs a comment of **10–1,000** characters after trimming. At or below 20,000.00 the old rule stays. | CR-01, F-04 v4 |

Approval: the instructor announced that TA approval is not required for the Lab 7 change request (EV-L7-00).

## 2. Impact trace

| Requirement | Feature | SRS | Feature SDS (F-04) | System-Level SDS | AC | STS | Code module |
|---|---|---|---|---|---|---|---|
| BR-08 (new), FR-06 | F-04 | §5 BR-08, §6 D-14 (revised), D-17 | D-17; check order row 7 (new), race → row 8 | No change (see §3) | AC-04-13 (new), AC-04-2 (revised) | T-04-24 (unit), T-04-25, T-04-26 (API + DB) | `server/src/requests/decision-validation.ts` (threshold, message, `requiresApproveComment`), `server/src/requests/decide.ts` (check inside the transaction) |
| BR-08, D-13, NFR-03 | F-04 | §6 D-13 (unchanged) | Check order: new check after 4–6 | – | AC-04-14 (new) | T-04-27 (API + DB) | `server/src/requests/decide.ts` (placement after the 404/403/409 checks) |
| BR-08, FR-06 | F-04 (UI) | – | Permissions/UI table: hint text, invalid-input row | – | AC-04-15 (new) | T-04-28, T-04-29 (component) | `client/src/requests/DecisionSection.tsx` (needs the amount), `client/src/requests/RequestDetailPage.tsx` (passes `amount`) |

## 3. Areas checked

| Area | Affected? | Reason |
|---|---|---|
| Callers / dependencies | Yes | `POST /api/requests/:id/approve` is the only caller of the rule; `/reject` is unchanged. `validateDecision` stays amount-free, so the route's check order 1–3 does not change. |
| API validation | Yes | New 400 with the existing `VALIDATION_ERROR` + `details` shape, so the client's existing 400 handling (T-04-22) shows it beside the field. |
| UI validation | Yes | Client check before the call, so the reviewer sees the message without a round trip. The API stays the authority. |
| Roles / ownership | No change, but **at risk** | The rule needs the amount, which only the transaction loads. Putting it in the body check (before 404) would let an outsider learn that a request is above 20,000 from a 400, which breaks D-13 (the bug class of DEF-EX-01). Hence check 7 after 4–6, covered by T-04-27. |
| Persistence / schema | No | The comment is stored in the existing `RequestHistory.reason`. No new column. |
| Migration | Not applicable | No schema change. |
| Historical data | No backfill | Requests `APPROVED` before v4 without a comment stay valid; BR-06 (append-only) forbids editing them. Existing `SUBMITTED` requests above 20,000 (on the live service e.g. TH-001_P3's `UAT-P3-02 max`, 100,000.00) need a comment when they are approved. |
| Precision | Yes | Server compares Prisma `Decimal` (`amount.greaterThan(20000)`); client compares integer cents parsed from the API's `"20000.01"` string. No floating point, so 20,000.00 vs 20,000.01 is exact. |
| Transactions / concurrency | No change | The check runs inside the existing transaction before the conditional update; a 400 writes nothing. BR-07 race handling (now row 8) is unchanged. |
| Seed and E2E data | No | Seed requests are 1,290.50–8,000; E2E-01 approves with a comment. Neither crosses the rule. |
| System-Level SDS | No change | Architecture, data model, state machine (BR-02), role matrix and API error conventions (400 = validation) are unchanged. |
| Submit (F-02), My requests (F-03), queue | No | They do not decide. BR-04 amount limits are unchanged. |

## 4. Behavior that must not change, and the tests that protect it

| Preserved behavior | Regression tests |
|---|---|
| Approve at or below 20,000.00 without a comment | T-04-05 (1,500), T-04-26 (exactly 20,000.00), T-04-29 (UI) |
| Reject rule BR-03 | T-04-02, T-04-06, T-04-07, T-04-18, T-04-20, T-04-22 |
| Only the assigned reviewer decides; outsiders get 404 (D-13, NFR-03) | T-04-09, T-04-23, T-04-27 |
| Own request 403 (BR-01); requester 403; no session 401 | T-04-08, T-04-10, `answers 401 without a session` |
| Decided once (BR-02), one winner of a race (BR-07) | T-04-11, T-04-12, T-04-27 (409 before the new 400) |
| Sprint 1 journeys end to end | E2E-01..04 |

The selected suite for every step is the full CI job `test-and-docker`: server unit + API/DB integration (`npm test`), client component tests, E2E, Docker build.

## 5. Order of work (recorded in Git)

1. CR-01 issue #45 (27 Nov 2026).
2. This document and F-04 v4 / SRS / traceability in one contract PR, reviewed by the teammate **before** any code.
3. RED: T-04-24..29 committed and run on the pre-change code; the failures are missing behavior (200 where 400 is expected, no hint), not compile errors.
4. GREEN: implementation commit; same tests pass; full regression.
5. PR into `staging` (review, CI) → release PR into `main` → Deploy demo → smoke test → post-deploy checks of the changed rule and a preserved Sprint 1 access path.
