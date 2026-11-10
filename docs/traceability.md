# Traceability Matrix

Requirement → feature → sprint → acceptance criterion → planned test → actual test → result and commit.

| Requirement | Feature | Sprint | AC | Planned test | Actual test file / name | Result | Commit |
|---|---|---|---|---|---|---|---|
| FR-01 | F-01 | 1 | AC-01 | TEST-01 | _TODO_ | _not run_ | |
| BR-01 | F-04 | 1 | _TODO_ | _TODO_ | | | |
| NFR-01 | F-01 | 1 | _TODO_ | _TODO_ | | | |
| BR-04 | F-02 | 1 | AC-02-2 | T-02-01, T-02-02 | `server/tests/request-validation.test.ts` (amount cases) | PASS (unit) | f5a2020 |
| BR-04 | F-02 | 1 | AC-02-2 | T-02-09 | | _not run_ | |
| FR-02 | F-02 | 1 | AC-02-3, AC-02-8 | T-02-03, T-02-04 | `server/tests/request-validation.test.ts` (text, category, body cases) | PASS (unit) | f5a2020 |
| FR-02 | F-02 | 1 | AC-02-1, AC-02-8 | T-02-08, T-02-14 | | _not run_ | |
| FR-02 | F-02 | 1 | AC-02-9 | T-02-16, T-02-17 | | _not run_ | |
| FR-03 | F-02 | 1 | AC-02-5, AC-02-6, AC-02-7 | T-02-05, T-02-06, T-02-07 | `server/tests/assign-reviewer.test.ts` | PASS (unit) | f5a2020 |
| FR-03 | F-02 | 1 | AC-02-5, AC-02-6, AC-02-7 | T-02-11, T-02-12, T-02-13 | | _not run_ | |
| FR-07 | F-02 | 1 | AC-02-1 | T-02-08, T-02-15 | | _not run_ | |
| BR-06 | F-02 | 1 | AC-02-1 | T-02-08 | | _not run_ | |
| NFR-01 | F-02 | 1 | AC-02-4 | T-02-10 | | _not run_ | |

Do not mark a row PASS until the test has run on the stated commit.
