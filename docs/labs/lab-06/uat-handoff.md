# ApprovalFlow — Sprint 1 UAT handoff (Lab 6, Part A)

**Product Team:** TH-005_P5 (ApprovalFlow) — Naphat Utabuawong (67070501015), Nantakorn Pinsupaporn (67070501028)
**UAT Team:** TH-001_P3 (LoungCheu) — Paphangkorn Luanseng (67070501083), Jetanin Naitho (67070501011)
**Version history:** v1 (2026-11-24) – initial handoff

## 1. What you are testing

| Item | Value |
|---|---|
| Application | ApprovalFlow — employees submit expense/purchase requests; a reviewer in their department approves or rejects them |
| Deployed URL | <https://approvalflow-lecxxyja2q-as.a.run.app> |
| Tested release | tag `v0.2.0`, commit `1cbd8b46df495d4c748817ab8f92f1cce4143485` (`1cbd8b4`, `main`) |
| Cloud Run revision / image | `approvalflow-00006-8bp` (100% traffic), image `sha256:<CONFIRM from revision 00006-8bp YAML>`. Image built and first deployed (revision `00005-8rh`, `sha256:20984f2b96e485900c40100778f7ff4f85deb86c878d8c6d8c1c891fe76049cf`) by Deploy demo run [45030322636](https://github.com/AlphabetCG/approvalflow/actions/runs/45030322636) on 22 Nov 2026; revision `00006-8bp` was then created from the Cloud Console (`<reason: e.g. setting change, same image>`). |
| Sprint 1 baseline | tag `v0.1.0` (release PR #18): F-01 sign-in, F-02 submit request, F-03 my requests and history, F-04 review queue and approve/reject |
| Difference v0.1.0 → v0.2.0 | Delivery only (Docker, CI/CD, deploy pipeline) and one sentence on the home page. No Sprint 1 behaviour changed; no Sprint 2 feature is deployed. |
| Repository | <https://github.com/AlphabetCG/approvalflow> |
| Version check | The app has no version endpoint. We announce every deploy in the IG group with its commit and revision; if we have not announced one, the version above is the one running. |

**In scope:** sign in/out, submit a request, automatic reviewer assignment, My requests, request detail with history, Review queue, approve/reject.
**Out of scope (not part of this acceptance):** Administrator role and admin screens (Sprint 2), editing or cancelling a request, notifications, reports, user management. Reporting their absence is an enhancement, not a defect.

**Version promise:** we will not deploy to this URL from 24 Nov 12:00 until your findings are sent (25 Nov 12:00) without telling you first. Any fix release will be announced with its new commit and digest before you re-test.

## 2. Accounts

All accounts are synthetic. **The password (same for all accounts) is sent by private message on IG; it is not in this document or in Git.**

| Label | Email | Role | Department |
|---|---|---|---|
| REQ-ENG1 | `req.eng1@example.com` | Requester | Engineering |
| REQ-ENG2 | `req.eng2@example.com` | Requester | Engineering |
| REQ-FIN1 | `req.fin1@example.com` | Requester | Finance |
| REV-ENG1 | `rev.eng1@example.com` | Reviewer | Engineering |
| REV-ENG2 | `rev.eng2@example.com` | Reviewer | Engineering |
| REV-FIN1 | `rev.fin1@example.com` | Reviewer | Finance |
| REV-FIN2 | `rev.fin2@example.com` | Reviewer | Finance |

There is no Administrator account in Sprint 1.

## 3. Rules you need to know (from the Sprint 1 contract)

- **Reviewer assignment is automatic and rotates** between the reviewers of the requester's department (AC-02-6). You cannot know in advance whether REV-ENG1 or REV-ENG2 gets a request. **After every submit, write down the reviewer email shown in the success message** and sign in as that reviewer. "The assigned reviewer" below always means that account.
- A reviewer never reviews their own request (AC-02-5, BR-01).
- Amount: greater than 0, at most 100,000, at most 2 decimal places (AC-02-2). Reject needs a reason of 10–1,000 characters after trimming; an approve comment is optional (AC-04-3, AC-04-4).
- A request is decided once: `SUBMITTED` → `APPROVED` or `REJECTED` (AC-04-8).
- Users see only their own requests, plus requests assigned to them as reviewer. Anything else shows **"Request not found."**, the same as for a request that does not exist, so nothing leaks (AC-03-4, AC-04-6).

## 4. Data setup and cleanup

- The database already holds 7 demo users and 4 demo requests. You do not need to prepare anything.
- **Each case creates its own requests**, so cases are independent and can run in any order, by either tester. Start every title with `UAT-<your team>-<case>`, e.g. `UAT-T7-01 Team lunch`. That separates your data from ours and from the other tester's.
- Sprint 1 has no delete, so your test requests stay in the database. That is expected. Ignore older requests that do not start with your prefix. The only effect is on the rotation: another request may change which reviewer is next, which is why you always read the reviewer from the screen.
- Use one browser window per account, or a private window for the second account, so the two sign-ins do not share a cookie. Sign out at the end of each case.

## 5. UAT cases

| ID | Category | Requirement / AC |
|---|---|---|
| UAT-01 | Normal domain journey | FR-01..FR-07; AC-01-1, AC-02-1, AC-03-1, AC-03-3, AC-04-1, AC-04-2 |
| UAT-02 | Business rule / boundary (amount) | BR amount rule; AC-02-2, AC-02-9 |
| UAT-03 | Business rule / boundary (reject reason) | BR-03; AC-04-3, AC-04-4, AC-04-11 |
| UAT-04 | Forbidden role / ownership | NFR-03; AC-03-4, AC-04-6, AC-04-7, AC-04-10, AC-04-11 |
| UAT-05 | Forbidden: reviewer on own request | BR-01; AC-02-5, AC-04-11 |
| UAT-06 | State / history / persistence | BR-02; AC-03-5, AC-04-8, AC-04-12 |
| UAT-07 | Sign-in and session | AC-01-2, AC-01-5, AC-01-8, AC-01-9 |

---

### UAT-01 — Submit, approve, and see the result (normal journey)

**Purpose:** a requester's request reaches the right reviewer, is approved, and the requester sees the outcome.
**Roles:** REQ-ENG1, then the assigned reviewer (REV-ENG1 or REV-ENG2).
**Preconditions:** signed out.
**Inputs:** Title `UAT-<team>-01 Team lunch`; Category `Training`; Amount `1500.50`; Description `Lunch for the onboarding workshop`; approve comment `Within budget`.

| # | Action | Expected result |
|---|---|---|
| 1 | Open the URL; sign in as REQ-ENG1. | Header shows "Anan (Engineering requester)" and role "Requester". The header has **no** "Review queue" link. |
| 2 | Click **New request**; enter the inputs; click **Submit request**. | Message: "Request submitted. Status: SUBMITTED. Reviewer: rev.eng1@example.com" **or** "…rev.eng2@example.com". **Write down this reviewer.** |
| 3 | Click **My requests**. | The new request is the **first** row (newest first): Title as entered, Category Training, Status `SUBMITTED`, Reviewer = the one from step 2. |
| 4 | Open the request. | Amount shows `1,500.50`. History has one entry: "Submitted", `– → SUBMITTED`, by Anan. No **Decision** section. |
| 5 | Sign out; sign in as the reviewer from step 2. Click **Review queue**. | The request is listed with status `SUBMITTED`. Only `SUBMITTED` requests assigned to this reviewer are listed, oldest first. |
| 6 | Open it; type `Within budget` in **Comment or reason**; click **Approve**. | "Request approved." Status `APPROVED`. A second history entry appears: "Approved", `SUBMITTED → APPROVED`, by this reviewer, Comment: Within budget. The Decision section disappears. |
| 7 | Click **Review queue**. | The request is no longer in the queue. |
| 8 | Sign out; sign in as REQ-ENG1; open the request from **My requests**. | Status `APPROVED`; history shows both entries in order (Submitted, then Approved with the comment). |

### UAT-02 — Amount boundaries

**Purpose:** invalid amounts are refused and nothing is stored; the exact limits are accepted.
**Role:** REQ-ENG2. **Preconditions:** signed out.
**Inputs:** Category `Supplies`; Description `Boundary test`; title and amount per row.

| # | Action | Expected result |
|---|---|---|
| 1 | Sign in as REQ-ENG2; open **New request**. | Empty form. |
| 2 | Title `UAT-<team>-02 zero`, Amount `0`; **Submit request**. | Under Amount: "Amount must be greater than 0". No success message. |
| 3 | Change Amount to `100000.01`; submit. | "Amount must be at most 100000". No success message. |
| 4 | Change Amount to `12.345`; submit. | "Amount must have at most 2 decimal places". No success message. |
| 5 | Clear Title; Amount `10`; submit. | "Title is required". No success message. The other fields keep their values. |
| 6 | Title `UAT-<team>-02 min`, Amount `0.01`; submit. | "Request submitted. Status: SUBMITTED…" |
| 7 | **New request**: Title `UAT-<team>-02 max`, Category `Supplies`, Amount `100000`, Description `Boundary test`; submit. | "Request submitted. Status: SUBMITTED…" |
| 8 | Open **My requests**. | Exactly two `UAT-<team>-02` requests: "max" (100,000.00) above "min" (0.01). **No** request for the refused attempts (steps 2–5). |

### UAT-03 — Reject needs a reason of at least 10 characters

**Purpose:** a short reason is refused without changing the request; a valid reason rejects it and the requester sees why.
**Roles:** REQ-FIN1, then the assigned reviewer (REV-FIN1 or REV-FIN2).
**Inputs:** Title `UAT-<team>-03 Taxi`; Category `Travel`; Amount `350`; Description `Airport taxi`; reasons exactly as in the steps.

| # | Action | Expected result |
|---|---|---|
| 1 | Sign in as REQ-FIN1; submit the request. | Success message; write down the reviewer (rev.fin1 or rev.fin2). |
| 2 | Sign out; sign in as that reviewer; open the request from **Review queue**. | Decision section shown. |
| 3 | Type `No budget` (9 characters); click **Reject**. | Message: "A rejection needs a reason of at least 10 characters". Status still `SUBMITTED`; history still has one entry. |
| 4 | Type `   ` (spaces only); click **Reject**. | Same message; nothing changes. |
| 5 | Type `No budget left` (14 characters); click **Reject**. | "Request rejected." Status `REJECTED`; new history entry "Rejected", `SUBMITTED → REJECTED`, Reason: No budget left. |
| 6 | Sign out; sign in as REQ-FIN1; open the request. | Status `REJECTED`; history shows "Reason: No budget left". |

### UAT-04 — Other users' requests and reviewer-only pages are protected

**Purpose:** a requester cannot use reviewer functions; nobody can open a request that is not theirs or assigned to them; the protected request is unchanged.
**Roles:** REQ-ENG1, REQ-FIN1, REV-FIN1, the assigned Engineering reviewer.
**Inputs:** Title `UAT-<team>-04 Monitor`; Category `Equipment`; Amount `5900`; Description `Second screen`.

| # | Action | Expected result |
|---|---|---|
| 1 | Sign in as REQ-ENG1; submit the request; write down the reviewer. Open it and **copy the page URL** (`…/requests/<id>`). Sign out. | Request `SUBMITTED`. |
| 2 | Sign in as REQ-FIN1 (another requester). Paste the copied URL. | "Request not found." No title, amount, description, or history is shown. |
| 3 | Still as REQ-FIN1: check the header, then type `<URL>/reviews` in the address bar. | Header has no "Review queue" link. The Review queue page shows an error message (role required) and **no** requests. |
| 4 | Change the end of the copied URL by one character and open it. | "Request not found." — the same page as step 2, so you cannot tell whether a request exists. |
| 5 | Sign out; sign in as REV-FIN1 (a reviewer in another department). Paste the copied URL. | "Request not found." No Decision section. |
| 6 | Open **Review queue**. | The `UAT-<team>-04` request is **not** listed. |
| 7 | Sign out; sign in as the assigned Engineering reviewer (step 1); open the request. | Status still `SUBMITTED`; history has only "Submitted". Nothing was changed by steps 2–6. Do **not** decide it (leave it for UAT-06, or decide it at the end of testing). |

### UAT-05 — A reviewer cannot decide their own request

**Purpose:** when a reviewer submits a request it goes to the other reviewer, and the submitter cannot approve it.
**Roles:** REV-ENG1, then REV-ENG2.
**Inputs:** Title `UAT-<team>-05 Keyboard`; Category `Equipment`; Amount `990`; Description `Replacement keyboard`.

| # | Action | Expected result |
|---|---|---|
| 1 | Sign in as REV-ENG1; **New request**; submit. | Success message; Reviewer: **rev.eng2@example.com** (never rev.eng1). |
| 2 | Open the request from **My requests**. | Status `SUBMITTED`. **No Decision section** (no Approve or Reject). |
| 3 | Open **Review queue**. | The request is **not** in REV-ENG1's queue. |
| 4 | Sign out; sign in as REV-ENG2; open **Review queue**. | The request is listed. |

### UAT-06 — A decided request stays decided, and history is kept

**Purpose:** once a request is decided it cannot be decided again; the history is complete and persists across sessions.
**Roles:** REQ-ENG2, then the assigned reviewer.
**Inputs:** Title `UAT-<team>-06 Course`; Category `Training`; Amount `2400`; Description `Online course`; approve comment `OK for Q4`; second attempt reason `Changed my mind`.

| # | Action | Expected result |
|---|---|---|
| 1 | Sign in as REQ-ENG2; submit; write down the reviewer; sign out. | `SUBMITTED`. |
| 2 | Sign in as the reviewer. Open the request in **two tabs** (A and B). | Both tabs show the Decision section. |
| 3 | In tab A: comment `OK for Q4`; **Approve**. | "Request approved." Status `APPROVED`. |
| 4 | In tab B (still showing the old page): reason `Changed my mind`; **Reject**. | Message "This request is already APPROVED". The page reloads and shows status `APPROVED`; the Decision section is gone. |
| 5 | Reload tab B. | Status `APPROVED`. History has exactly **two** entries: Submitted, Approved (OK for Q4). **No** "Rejected" entry. |
| 6 | Sign out; sign in as REQ-ENG2; open the request. | Same status and the same two history entries, oldest first, each with actor, `from → to` and time. |

### UAT-07 — Sign-in and sign-out

**Purpose:** wrong credentials are refused without revealing which part was wrong; sign-out really ends the session.
**Role:** REQ-ENG1.

| # | Action | Expected result |
|---|---|---|
| 1 | Open the URL signed out; try to open `<URL>/requests`. | The login page is shown instead. |
| 2 | Email `req.eng1@example.com`, password `wrong-password-1`; **Sign in**. | "Email or password is incorrect". The email stays in the field. |
| 3 | Email `nobody@example.com`, any password; **Sign in**. | The same message as step 2. |
| 4 | Email ` REQ.ENG1@Example.com ` (capitals, spaces around) with the correct password. | Signed in as Anan (Engineering requester). |
| 5 | **Sign out**. Then press the browser **Back** button, and reload. | The login page; My requests is not shown again. |

## 6. Recording results

For each case please record: case ID, tester name/team, date and time, tested version (`v0.2.0` / `1cbd8b4`), inputs used, actual result (what you saw, not a copy of the expected result), PASS / FAIL / BLOCKED (with the reason), and a screenshot ID. For FAIL, send a finding with the steps, expected, actual, severity, and screenshot, one finding per message, in the IG group by **Wed 25 Nov 12:00**. We copy each one into a GitHub issue on our repository and reply with its link. Do not put the password in screenshots or findings. We will send triage by Wed 25 Nov 20:00.

## 7. Agreed timeline

| When | What |
|---|---|
| Tue 24 Nov 12:00 | Handoffs exchanged |
| Wed 25 Nov 12:00 | Execution complete; findings sent |
| Wed 25 Nov 20:00 | Triage results returned |
| Thu 26 Nov | Re-test of fixed release; final decision recorded |
