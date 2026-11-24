# UAT results — LoungCheu Sprint 1 (Lab 6, Part B)

We are the **UAT Team** for this product. These are our own independent results.

| Item | Value |
|---|---|
| UAT Team | TH-005_P5 (ApprovalFlow) — Naphat Utabuawong (67070501015), Nantakorn Pinsupaporn (67070501028) |
| Product Team | TH-001_P3 (LoungCheu) — Jetanin Naitho, Paphangkorn Luanseng |
| Application | LoungCheu — event registration (Organizer publishes events; Participants register) |
| Tested release | tag `v1.0.1-uat`, commit `0b2cc804f298a28041d9ba9c7ec05d2cf64e4e08`, Cloud Run revision `scccd8b05-00009-vvq` |
| URL | <https://scccd8b05-4d7hbszvwq-as.a.run.app/> |
| Cases received | 7 cases, `docs/labs/lab-06/uat-cases.md` on branch `lab6-staging` at `0b2cc80`, received 23 Nov 2026 `<20:01>` |
| Accepted-for-test scope | F-01 to F-05 (log in/out, create and publish events, register, my registrations, organizer roster). Out of scope: F-06 to F-09. |
| Execution window | S1 Naphat Utabuawong (UAT-01, X-01, X-02, UAT-04, UAT-05): 24 Nov 2026 13:10–14:12 · S2 Nantakorn Pinsupaporn (UAT-06, UAT-07, UAT-02, UAT-03): `<date HH:MM–HH:MM>` (Asia/Bangkok) |
| Method | Manual, through the browser UI (`<Chrome 157>`) |

**Handoff check (before testing):** we confirmed that the tag `v1.0.1-uat` points to `0b2cc80` and that `/api/ready` returns this version. Since the Sprint 1 tag `v1.0.0-sprint-1`, the app code changes only the footer text, the `/api/ready` endpoint, and config/seed. No Sprint 2 behaviour is in the release.

## 1. Version check per session

The Product Team asked us to check `/api/ready` before each session.

| Session | Tester | Date-time (Bangkok) | `/api/ready` result (`status`, `db`, first 7 of `version`) | Same as `0b2cc80`? | Evidence |
|---|---|---|---|---|---|
| S1 | Naphat | 24 Nov 2026 13:10 (start) / 14:12 (end) | `ready`, `connected`, `0b2cc80` at both checks | Yes | EV-VER-S1, EV-VER-S1-end |
| S2 | Nantakorn | | | | EV-VER-S2 |
| S3 (retest) | | | | | EV-VER-S3 |

## 2. Summary

| Case | Category | AC | Tester | Result |
|---|---|---|---|---|
| UAT-01 | Normal journey | AC-06, 08, 09, 12, 18, 21, 24 | Naphat | PASS (deviation in step 3: list checked as Organizer A, see §4) |
| UAT-02 | Boundary (duplicate + capacity) | AC-13, 14, 21 | Nantakorn | |
| UAT-03 | Boundary (deadline) | AC-08, 15 | Nantakorn | |
| UAT-04 | Forbidden role / ownership | AC-10, 19, 22, 26 | Naphat | PASS |
| UAT-05 | State / persistence | AC-04, 18, 23 | Naphat | PASS |
| UAT-06 | Authentication | AC-01, 02 | Nantakorn | |
| UAT-07 | Input validation | AC-07, 11 | Nantakorn | |
| **Total** | | | | PASS `_` / FAIL `_` / BLOCKED `_` |

## 3. Results sheet (Product Team's format)

Tested version for every row: `v1.0.1-uat / 0b2cc80`, unless the column says otherwise.

| Case | Tester (name / team) | Date-time (Bangkok) | Tested version | Inputs actually used | Actual result | PASS / FAIL / BLOCKED | Evidence ID |
|---|---|---|---|---|---|---|---|
| UAT-01 | Naphat / TH-005_P5 | 24 Nov 2026 13:19–13:49 | `v1.0.1-uat / 0b2cc80` | `organizer.a`, `participant.a`; title `[UAT-01-NU] Intro to Git`, description `UAT Normal Journey`, Room 301, 2 seats, closes 27/11/2026 10:00, starts 28/11/2026 09:00, ends 28/11/2026 12:00. EVENT-01 `da3407c5-b11d-43ac-823e-d05d6d1d28a2`, REG-01 `0fae718d-fed0-4088-814f-25fe0ba4e02d` | DRAFT created (ว่าง 2 / 2), not in the shared list, published, card "เปิดรับลงทะเบียน", registration succeeded with REG-01, listed ACTIVE in my registrations, roster ACTIVE 1 / 2 with one row (Participant A). Step 3 deviation: the shared list was checked as Organizer A, not participant.a; participant.a got "ไม่พบกิจกรรมนี้" for the DRAFT by direct URL | PASS (deviation noted) | EV-UAT01-1 … EV-UAT01-8 |
| UAT-02 | Nantakorn / TH-005_P5 | | | | | | |
| UAT-03 | Nantakorn / TH-005_P5 | | | | | | |
| UAT-04 | Naphat / TH-005_P5 | 24 Nov 2026 13:50–13:57 | `v1.0.1-uat / 0b2cc80` | `organizer.b`, `participant.b`, `participant.a`, `organizer.a`; EVENT-01 and REG-01 from UAT-01 | Every forbidden access showed a not-found or no-permission message and no data; roster afterwards still ACTIVE 1 / 2 with the same single row | PASS | EV-UAT04-1 … EV-UAT04-9 |
| UAT-05 | Naphat / TH-005_P5 | 24 Nov 2026 14:05–14:08 | `v1.0.1-uat / 0b2cc80` | `participant.a`, `organizer.a`; REG-01 ลงทะเบียนเมื่อ 24 พ.ย. 2569 13:45:34 | After logout only the login page was reachable; after re-login REG-01 was still ACTIVE with the same reference and time; roster unchanged after F5. Back button used in step 2; new browser window in step 3 | PASS | EV-UAT05-0 … EV-UAT05-5 |
| UAT-06 | Nantakorn / TH-005_P5 | | | | | | |
| UAT-07 | Nantakorn / TH-005_P5 | | | | | | |

## 4. Step-by-step record

Write what the screen showed. Do not copy the expected result. A case is PASS only if every step matches; one mismatched step makes the case FAIL. A step that cannot be run makes the case BLOCKED (with the reason).

### UAT-01 — Organizer publishes, participant registers, organizer sees roster

Tester: `Naphat` · Start `13:19` · End `13:49` (24 Nov 2026) · Title used `[UAT-01-NU] Intro to Git`
**EVENT-01** = `da3407c5-b11d-43ac-823e-d05d6d1d28a2` · **REG-01** = `0fae718d-fed0-4088-814f-25fe0ba4e02d`
Input note: description entered as `UAT Normal Journey` (capital letters); all other inputs as in the case.

| # | Actual result | Match? | Evidence |
|---|---|---|---|
| 1 | After login as `organizer.a`: URL `/events`, header "Organizer A", page "สวัสดี Organizer A" and "ผู้จัดกิจกรรม" | Yes | EV-UAT01-1 |
| 2 | Saved as DRAFT; URL `/organizer/events/da3407c5-…`; badge DRAFT; text "ตัวอย่างกิจกรรม · กิจกรรมนี้จะปรากฏในรายการทั่วไปหลังเผยแพร่"; "ว่าง 2 / 2 ที่นั่ง"; "ลงทะเบียน ACTIVE 0 คน" | Yes | EV-UAT01-2a, EV-UAT01-2b |
| 3 | **Deviation:** the shared list "กิจกรรมทั้งหมด" was checked as **Organizer A**, not as `participant.a` as the case says. Scrolled top to bottom: no `[UAT-01-NU]` card. The `participant.a` list was not viewed. As `participant.a`, opening the DRAFT event by direct URL showed "ไม่พบกิจกรรมนี้" with no event data (X-01) | Yes, with deviation | EV-UAT01-3a, EV-UAT01-3b, EV-X01-e |
| 4 | Clicked เผยแพร่กิจกรรม: badge changed to PUBLISHED, publish button gone, "ดูหน้ากิจกรรมทั่วไป" shown | Yes | EV-UAT01-4a, EV-UAT01-4b |
| 5 | Card in กิจกรรมทั้งหมด: PUBLISHED, "ว่าง 2 / 2 ที่นั่ง · เปิดรับลงทะเบียน" (header not in the screenshot) | Yes | EV-UAT01-5 |
| 6 | As `participant.a`: before, "ที่นั่งว่าง 2 ที่" and enabled ลงทะเบียน; after clicking, green box "ลงทะเบียนสำเร็จ เลขอ้างอิง: 0fae718d-fed0-4088-814f-25fe0ba4e02d" | Yes | EV-UAT01-6a, EV-UAT01-6b |
| 7 | `/my/registrations`: `[UAT-01-NU] Intro to Git`, ACTIVE, เลขอ้างอิง REG-01, ลงทะเบียนเมื่อ 24 พ.ย. 2569 13:45:34. Event page afterwards: "ว่าง 1 / 2 ที่นั่ง", "ลงทะเบียน ACTIVE 1 คน" | Yes | EV-UAT01-7a, EV-UAT01-7b |
| 8 | As `organizer.a`, roster: "ลงทะเบียน ACTIVE 1 / 2 คน"; one row: REG-01, Participant A, ACTIVE, 24 พ.ย. 2569 13:45:34 | Yes | EV-UAT01-8 |

### UAT-02 — Duplicate and capacity

Tester: `Nantakorn` · Start / End · Title used `[UAT-02-NP] Capacity check` · Event id `<id>`

| # | Actual result | Match? | Evidence |
|---|---|---|---|
| 1 | | | EV-UAT02-1 |
| 2 | | | EV-UAT02-2 |
| 3 | | | EV-UAT02-3 |
| 4 | | | EV-UAT02-4 |
| 5 | | | EV-UAT02-5 |
| 6 | | | EV-UAT02-6 |
| 7 | | | EV-UAT02-7 |

### UAT-03 — Registration deadline

Tester: `Nantakorn` · T = `<HH:MM>` · Event A closes `<HH:MM>` · Event B closes `<HH:MM>`
Titles used `[UAT-03A-NP] Deadline register`, `[UAT-03B-NP] Deadline publish`

| # | Actual result | Match? | Evidence |
|---|---|---|---|
| 1 | | | EV-UAT03-1 |
| 2 | | | EV-UAT03-2 |
| 3 | | | EV-UAT03-3 |
| 4 | Clicked **รีเฟรชที่นั่ง** at `<HH:MM:SS>` | | EV-UAT03-4 |
| 5 | | | EV-UAT03-5 |
| 6 | Clicked **เผยแพร่กิจกรรม** at `<HH:MM:SS>` | | EV-UAT03-6 |

### UAT-04 — Other people's records are protected

Tester: `Naphat` · Start `13:50` · End `13:57` (24 Nov 2026) · Uses EVENT-01 / REG-01 from UAT-01

| # | Actual result | Match? | Evidence |
|---|---|---|---|
| 1 | `organizer.b` → กิจกรรมของฉัน: only "[DEMO] Design Thinking สำหรับนักศึกษา"; no `[UAT-01-NU]` | Yes | EV-UAT04-1 |
| 2 | `/organizer/events/da3407c5-…`: "ไม่พบกิจกรรมนี้" with ลองใหม่; no event details, no publish button | Yes | EV-UAT04-2 |
| 3 | `/organizer/events/da3407c5-…/registrations`: heading รายชื่อผู้ลงทะเบียน, then "ไม่พบกิจกรรมนี้"; no names, references or count | Yes | EV-UAT04-3 |
| 4 | `participant.b` → `/my/registrations/0fae718d-…`: "ไม่พบรายการลงทะเบียนนี้"; no Participant A data | Yes | EV-UAT04-4 |
| 5 | Participant B's list: [DRY-02-PL-1858] Capacity check, [DEMO] React Workshop, [DEMO] เวิร์กช็อปถ่ายภาพ; no `[UAT-01-NU]` / REG-01 | Yes | EV-UAT04-5 |
| 6 | `participant.a` → `/organizer/events`: heading "ไม่มีสิทธิ์ใช้งาน"; menu shows only รายการลงทะเบียนของฉัน and กิจกรรมทั้งหมด | Yes | EV-UAT04-6 |
| 7 | `participant.a` → `/organizer/events/da3407c5-…/registrations`: heading "เฉพาะผู้จัดกิจกรรมเท่านั้นที่ดูรายชื่อได้"; no roster | Yes | EV-UAT04-7 |
| 8 | `organizer.a` → `/my/registrations`: heading "เฉพาะผู้เข้าร่วมเท่านั้นที่ดูรายการลงทะเบียนได้" | Yes | EV-UAT04-8 |
| 9 | State check: count `1 / 2`, rows: REG-01, Participant A, ACTIVE, 24 พ.ย. 2569 13:45:34 (same as UAT-01 step 8) | Yes | EV-UAT04-9 |

### UAT-05 — Persistence after logout, re-login and reload

Tester: `Naphat` · Start `14:05` · End `14:08` (24 Nov 2026) · **ลงทะเบียนเมื่อ** of REG-01 before step 1: `24 พ.ย. 2569 13:45:34` (EV-UAT05-0)

| # | Actual result | Match? | Evidence |
|---|---|---|---|
| 1 | Clicked ออกจากระบบ on `/my/registrations/0fae718d-…`; went to the login page `/login` | Yes | EV-UAT05-0, EV-UAT05-1-2 |
| 2 | Used: **Back button**. Still the login page `/login` (empty form); no registration data shown. One screenshot covers steps 1–2 (taken after Back; the Forward button is active) | Yes | EV-UAT05-1-2 |
| 3 | Closed the browser and opened a **new window**; typed `/my/registrations` → redirected to `/login` | Yes | EV-UAT05-3a, EV-UAT05-3b |
| 4 | After login as `participant.a`: `[UAT-01-NU] Intro to Git` ACTIVE, เลขอ้างอิง 0fae718d-fed0-4088-814f-25fe0ba4e02d, ลงทะเบียนเมื่อ 24 พ.ย. 2569 13:45:34 (same as before) | Yes | EV-UAT05-4 |
| 5 | As `organizer.a`, roster, then **pressed F5**: "ACTIVE 1 / 2 คน"; row REG-01, Participant A, ACTIVE, 13:45:34 (unchanged) | Yes | EV-UAT05-5 |

### UAT-06 — Login rules

Tester: `Nantakorn`

| # | Actual result | Match? | Evidence |
|---|---|---|---|
| 1 | | | EV-UAT06-1 |
| 2 | | | EV-UAT06-2 |
| 3 | | | EV-UAT06-3 |
| 4 | | | EV-UAT06-4 |
| 5 | | | EV-UAT06-5 |
| 6 | | | EV-UAT06-6 |

### UAT-07 — Event input validation

Tester: `Nantakorn` · Title used `[UAT-07-NP] Validation`

| # | Actual result | Match? | Evidence |
|---|---|---|---|
| 1 | | | EV-UAT07-1 |
| 2 | | | EV-UAT07-2 |
| 3 | | | EV-UAT07-3 |
| 4 | | | EV-UAT07-4 |
| 5 | | | EV-UAT07-5 |
| 6 | | | EV-UAT07-6 |
| 7 | | | EV-UAT07-7 |

## 5. Additional checks (outside the 7 cases)

These are our own checks against the Sprint 1 contract. They are recorded separately and do not change the case results above.

| ID | AC | Check | Expected (from contract) | Actual | Result | Evidence |
|---|---|---|---|---|---|---|
| X-01 | AC-09, AC-15 | As `participant.a`, open a DRAFT event by direct URL `<URL>/events/<id>`. Tried on the Product Team's DRAFT `[DRY-07-PL-1858] Validation` (13:28) and on EVENT-01 while still DRAFT (13:38). URL pattern confirmed on a public event (EV-X01-d) | Not found; no event details; no register button | Both times: heading รายละเอียดกิจกรรม, "ไม่พบกิจกรรมนี้" with ลองใหม่; no title, details, seats or register button | PASS | EV-X01-a … EV-X01-e |
| X-02 | AC-11 | On EVENT-01 (UAT-01), compare the shown times with the inputs (27/11 10:00, 28/11 09:00–12:00) | Same times, Bangkok | Shown: ปิดรับ 27 พ.ย. 2569 10:00:00, เริ่ม 28 พ.ย. 2569 09:00:00, สิ้นสุด 28 พ.ย. 2569 12:00:00, label "เวลาประเทศไทย (Asia/Bangkok)"; same on the participant view and in my registrations | PASS | EV-UAT01-2b, EV-UAT01-6a, EV-UAT01-7a |
| X-03 | – (observation) | Before testing, logged in once with each of the 6 accounts | All active accounts log in; `inactive.x` refused | Organizer A, Organizer B, Participant A/B/C reached `/events`; `inactive.x` got "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" | PASS | EV-PRE-1 … EV-PRE-6 |

## 6. Findings reported

One GitHub issue per finding, form **UAT finding (Lab 6)** on `jetanin/LoungCheu`, link posted in the IG group.

| Our ID | Issue | Case / step | AC | Type (defect / feature request) | Our severity | Summary | Sent (date-time) | Product Team triage | Status |
|---|---|---|---|---|---|---|---|---|---|
| F-01 | `#` | | | | | | | | |

If there are no findings, write: **No findings. All 7 cases passed on `v1.0.1-uat / 0b2cc80`.**

**Severity we use (the Product Team's scale):**
- **Critical:** data leak, wrong permission, or data lost or corrupted
- **Major:** a main journey cannot be completed, or it gives a wrong result against an AC
- **Minor:** the result is correct, but the text, layout or usability is off

## 7. Retest of corrected release (Thu 26 Nov)

Fill in only if the Product Team deploys a fix.

| Item | Value |
|---|---|
| Corrected release | tag `<tag>`, commit `<sha>`, revision `<revision>` |
| `/api/ready` version seen | `<first 7>` at `<date-time>` (EV-VER-S3) |
| Announced by Product Team | `<date-time, IG message>` |

| Finding / Issue | Original case + steps re-run | Tester | Date-time | Actual result | Result | Evidence |
|---|---|---|---|---|---|---|
| | | | | | | |

**Affected cases re-run (regression):**

| Case | Tester | Date-time | Result | Evidence |
|---|---|---|---|---|
| | | | | |

## 8. Final Sprint 1 UAT decision

| Item | Value |
|---|---|
| Decision | ☐ Accepted ☐ Accepted with documented minor limitations ☐ Not Accepted |
| Release accepted | tag `<tag>`, commit `<sha>`, revision `<revision>` |
| Scope | LoungCheu Sprint 1, F-01 to F-05, as in the Product Team's handoff |
| Date | `<date>` |
| UAT testers | Naphat Utabuawong (67070501015), Nantakorn Pinsupaporn (67070501028), TH-005_P5 |
| Basis | `<n>`/7 cases PASS on the release above; findings `<list>` closed by retest |
| Accepted minor limitations | `<none / list each, with issue link>` |
| Reasons (if Not Accepted) | `<open critical/major issues, or BLOCKED cases>` |

Rules: we do not accept while a critical or major finding is open or any case is BLOCKED. Minor findings must be fixed or listed above as accepted limitations.

Recorded by: `<name>` · Sent to Product Team: `<date-time, IG link/screenshot>`

## 9. Evidence index

File name pattern (Product Team's convention): `EV-<case>-<step>_<short-note>_<YYYY-MM-DDTHHMM>.png`, for example `EV-UAT04-9_state-unchanged_2026-11-25T1010.png`.

| Evidence ID | File | Case / step | What it shows | Time | Version |
|---|---|---|---|---|---|
All files are in `evidence/`. Tester: Naphat unless stated. Version for all: `v1.0.1-uat / 0b2cc80`.

| Evidence ID | File | Case / step | What it shows | Time (24 Nov 2026) |
|---|---|---|---|---|
| EV-VER-S1 | `EV-VER-S1_api-ready-start_2026-11-24T1310.png` | – | `/api/ready`: ready, connected, `0b2cc804…` | 13:10 |
| EV-PRE-1…6 | `EV-PRE-1_login-organizer-a_…T1314.png` … `EV-PRE-6_inactive-x-rejected_…T1317.png` | X-03 | Account check: 5 logins succeed, `inactive.x` refused | 13:14–13:17 |
| EV-UAT01-1 | `EV-UAT01-1_organizer-a-events_2026-11-24T1319.png` | UAT-01 / 1 | Organizer A on `/events` | 13:19 |
| EV-X01-a | `EV-X01-a_dry-draft-owner-view_2026-11-24T1322.png` | X-01 | Owner view of DRAFT `[DRY-07-PL-1858]` (id `4ee11d7a-…`) | 13:22 |
| EV-X01-b | `EV-X01-b_organizer-a-my-events_2026-11-24T1323.png` | X-01 | Organizer A's own list (DRAFT and PUBLISHED events) | 13:23 |
| EV-X01-c | `EV-X01-c_dry-draft-participant-not-found_2026-11-24T1328.png` | X-01 | Participant A, DRAFT by URL → "ไม่พบกิจกรรมนี้" | 13:28 |
| EV-X01-d | `EV-X01-d_event-url-pattern_2026-11-24T1329.png` | X-01 | Public event page, URL pattern `/events/<id>` | 13:29 |
| EV-UAT01-2a | `EV-UAT01-2a_create-form-inputs_2026-11-24T1335.png` | UAT-01 / 2 | Create form with the inputs | 13:35 |
| EV-UAT01-2b | `EV-UAT01-2b_draft-created-event01_2026-11-24T1335.png` | UAT-01 / 2, X-02 | DRAFT EVENT-01, ว่าง 2 / 2, times | 13:35 |
| EV-UAT01-3a/3b | `EV-UAT01-3a_shared-list-top_…T1336.png`, `EV-UAT01-3b_shared-list-bottom_…T1336.png` | UAT-01 / 3 (deviation) | Shared list without `[UAT-01-NU]`, viewed as Organizer A | 13:36 |
| EV-X01-e | `EV-X01-e_event01-draft-participant-not-found_2026-11-24T1338.png` | X-01, UAT-01 / 3 | Participant A, EVENT-01 (DRAFT) by URL → "ไม่พบกิจกรรมนี้" | 13:38 |
| EV-UAT01-4a/4b | `EV-UAT01-4a_before-publish_…T1340.png`, `EV-UAT01-4b_published_…T1341.png` | UAT-01 / 4 | Before and after publish | 13:40–13:41 |
| EV-UAT01-5 | `EV-UAT01-5_card-published-open_2026-11-24T1343.png` | UAT-01 / 5 | Card PUBLISHED, ว่าง 2 / 2 · เปิดรับลงทะเบียน | 13:43 |
| EV-UAT01-6a/6b | `EV-UAT01-6a_before-register_…T1345.png`, `EV-UAT01-6b_registered-reg01_…T1345.png` | UAT-01 / 6 | Before register; success with REG-01 | 13:45 |
| EV-UAT01-7a | `EV-UAT01-7a_my-registrations_2026-11-24T1348.png` | UAT-01 / 7 | My registrations, REG-01 ACTIVE | 13:48 |
| EV-UAT01-7b | `EV-UAT01-7b_event-after-register_2026-11-24T1349.png` | UAT-01 / 7 | Event page: ว่าง 1 / 2, ACTIVE 1 คน | 13:49 |
| EV-UAT01-8 | `EV-UAT01-8_roster-1-of-2_2026-11-24T1349.png` | UAT-01 / 8 | Roster ACTIVE 1 / 2 | 13:49 |
| EV-UAT04-1 … 9 | `EV-UAT04-1_organizer-b-my-events_…T1350.png` … `EV-UAT04-9_state-unchanged_…T1357.png` | UAT-04 / 1–9 | One file per step (see §4) | 13:50–13:57 |
| EV-UAT05-0 | `EV-UAT05-0_reg01-before-logout_2026-11-24T1405.png` | UAT-05 / pre | REG-01 detail, ลงทะเบียนเมื่อ 13:45:34 | 14:05 |
| EV-UAT05-1-2 | `EV-UAT05-1-2_login-after-logout_2026-11-24T1405.png` | UAT-05 / 1–2 | Login page after logout | 14:05 |
| EV-UAT05-3a/3b | `EV-UAT05-3a_new-window-typed-url_…T1407.png`, `EV-UAT05-3b_redirected-to-login_…T1407.png` | UAT-05 / 3 | Typed `/my/registrations` → `/login` | 14:07 |
| EV-UAT05-4 | `EV-UAT05-4_my-registrations-after-relogin_2026-11-24T1407.png` | UAT-05 / 4 | REG-01 still ACTIVE, same time | 14:07 |
| EV-UAT05-5 | `EV-UAT05-5_roster-after-relogin_2026-11-24T1408.png` | UAT-05 / 5 | Roster ACTIVE 1 / 2 unchanged | 14:08 |
| EV-VER-S1-end | `EV-VER-S1-end_api-ready_2026-11-24T1412.png` | – | `/api/ready` at end of session 1: same version | 14:12 |
