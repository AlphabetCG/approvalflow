# Feature Inventory

> DRAFT. Keep IDs stable once published; record changes instead of deleting rows.

| ID | Feature | Requirements | Depends on | Sprint |
|---|---|---|---|---|
| F-01 | Authentication and session (login, logout, me) | FR-01, NFR-01, NFR-02 | – | 1 |
| F-02 | Submit request with reviewer assignment | FR-02, FR-03, BR-04 | F-01 | 1 |
| F-03 | My requests list and detail with history | FR-04, FR-07, NFR-03 | F-02 | 1 |
| F-04 | Reviewer queue and decision (approve/reject) | FR-05, FR-06, FR-07, BR-01, BR-02, BR-03, BR-06, BR-07 | F-02 | 1 |
| F-05 | Drafts and editing rules | FR-08, BR-05 | F-02 | 2 |
| F-06 | Return and resubmit | FR-09 | F-04 | 2 |
| F-07 | Multi-stage approval | FR-10 | F-04 | 2 |
| F-08 | Filtering and search | FR-11 | F-03 | 2 |
| F-09 | Decision summary report | FR-12 | F-04 | 3 |
