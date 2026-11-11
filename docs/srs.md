# Software Requirements Specification: ApprovalFlow

> DRAFT. Everything below is a starting proposal. Review it as a team, change it, and record decisions in Section 6.

## 1. Stakeholder problem and context

A university department needs controlled approval of expense reimbursement requests. Staff submit requests; assigned reviewers approve, reject, or return them with recorded reasons. Today this is done by email and the history is lost.

## 2. Actors

| Actor | Responsibilities |
|---|---|
| Requester | Submits requests and tracks their own requests. |
| Reviewer | Decides on requests assigned to them. May also submit their own requests. |
| Admin (Sprint 2) | Manages users and reviewer assignment. |

## 3. Scope and exclusions

In scope: request submission, assignment, review decisions, state history, filtering, decision summaries.
Excluded: real payments, email notifications, self-registration, password recovery, multiple roles per account.

## 4. Functional requirements

| ID | Requirement | Sprint |
|---|---|---|
| FR-01 | A user can log in, log out, and see their current identity. | 1 |
| FR-02 | A requester can submit a request (title, category, amount, description). | 1 |
| FR-03 | The system assigns a reviewer to each submitted request. | 1 |
| FR-04 | A requester can list their own requests and see each status. | 1 |
| FR-05 | A reviewer can list requests assigned to them. | 1 |
| FR-06 | A reviewer can approve or reject an assigned request. | 1 |
| FR-07 | Every state change is recorded in the request history. | 1 |
| FR-08 | A requester can save a draft and edit it before submitting. | 2 |
| FR-09 | A reviewer can return a request for changes; the requester can resubmit. | 2 |
| FR-10 | Requests above a threshold need a second approval stage. | 2 |
| FR-11 | Users can filter requests by status, category, and date. | 2 |
| FR-12 | Reviewers can see a summary of decisions. | 3 |

## 5. Business rules

| ID | Rule | Sprint |
|---|---|---|
| BR-01 | Nobody can approve or reject their own request. | 1 |
| BR-02 | Only allowed state transitions succeed; any other transition is rejected (409). | 1 |
| BR-03 | Reject and return require a reason of at least 10 characters. | 1 |
| BR-04 | Amount must be greater than 0 and at most 100,000 THB. | 1 |
| BR-05 | A request can be edited only in DRAFT or RETURNED. | 2 |
| BR-06 | History entries are append-only. | 1 |
| BR-07 | If two decisions arrive at the same time, only one is stored. | 1 |

## 6. Non-functional requirements

| ID | Requirement | Verification | Sprint |
|---|---|---|---|
| NFR-01 | Unauthenticated requests to protected endpoints return 401 with no private data. | API test | 1 |
| NFR-02 | Passwords are stored only as bcrypt hashes. | Unit test + DB inspection | 1 |
| NFR-03 | A user cannot read or act on another user's request unless assigned (403/404). | API test | 1 |
| NFR-04 | Data survives an application restart and redeploy. | Lab 5 check C-05 | 1 (Lab 5) |

## 7. Assumptions, decisions, and open questions

| ID | Item | Status |
|---|---|---|
| D-01 | Reviewer assignment: round-robin among reviewers in the requester's department, never the requester; 409 if nobody is eligible (see F-02) | Accepted (PR #10 review, 2026-11-06) |
| D-02 | Second-stage threshold amount: _TODO_ | Open |
| D-03 | Request categories: TRAVEL, SUPPLIES, EQUIPMENT, TRAINING, OTHER (see F-02) | Accepted (PR #10 review, 2026-11-06) |
| D-04 | Title (1–200 characters) and description (1–2000 characters) are both required (see F-02) | Accepted (PR #10 review, 2026-11-06) |
