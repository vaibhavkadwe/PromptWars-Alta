# SafeSignal — Safety-First First-Response Assistant

SafeSignal is an emergency, privacy-first first-response tool for people in India facing sextortion, digital blackmail, threats to distribute intimate images, non-consensual recording, and suspected AI-generated intimate imagery.

It is **NOT** a law-enforcement agency, legal adviser, forensic tool, image-authenticity detector, perpetrator investigator, automatic complaint filer, or evidence store. Its core promise is to help an individual move from a terrifying, confusing threat to an immediate safer action plan and, optionally, an editable, structured draft to prepare an official cybercrime complaint.

> **CRITICAL DISCLAIMER:** SafeSignal provides initial risk routing and generic complaint-preparation guidance. It does not provide legal advice, does not file complaints automatically, and cannot guarantee safety, content removal, or monetary recovery.

---

## 1. What Changed and Why (Safety-First v2)

In this v2 release, SafeSignal was overhauled from an experimental extraction MVP to a strict safety-first first-response system:
1. **Deterministic Client-Side Triage:** Immediate risk routing via 3 simple questions (money, age, danger) executing 100% in-browser with zero backend, zero network, and zero AI. Young people and physical danger are prioritized immediately.
2. **Conservative Minor Protection:** If a user is under 18 or skips age ("prefer not to say"), all AI features and screenshot pickers are disabled. Guidance routes exclusively through safe adult pathways (parent/guardian, trusted teacher, Childline 1098, ERSS 112, Take It Down) without ever unconditionally forcing parental disclosure.
3. **Server-Side Heuristic Minor Screen (`MINOR_SIGNAL`):** Even if triage answers say adult, any minor indicators in description or evidence (e.g. "I'm 15", "in school", "class 10") immediately halt processing with status 422 (`MINOR_SIGNAL`) without sending data to Google Gemini.
4. **Local-Only Screenshot OCR:** Adult users can extract text from message screenshots locally using self-hosted `tesseract.js` (worker, WASM core, and English trained data served from same-origin `/vendor/tesseract/`). Strictly verifies PNG/JPEG magic bytes and dimensions (≤4096×4096). Workers are terminated immediately; zero images or thumbnails are uploaded or saved.
5. **Pre-Flight PII Redaction:** Phone numbers, email addresses, and UPI/account identifiers are detected and replaced with tokens like `[PHONE_1]` before transmission, and re-inserted locally in the browser when viewing the complaint draft.
6. **Complaint-Drafting Assistant (`ComplaintDraft`):** Replaced legacy generic categorization with an editable, generic complaint draft, deterministic evidence checklist, and allowed resource referrals.
7. **Multi-Layer Server-Side Guards:**
   - URL, email, phone digit, and legal citation scrubbing.
   - Forbidden legal-conclusion and guarantee language rejection (`Section \d+`, IPC, BNS, POCSO, IT Act, guilty, perpetrator, guarantee, 100%).
   - Token grounding verification (concrete tokens not in user text are dropped with user notices).
   - Negation-aware safety linting.
8. **Universal State & Step Stack Navigation:** In-memory reducer state synchronized with `window.history.pushState({ step })` (storing only step names, no data). Visible Back button on every screen; Start Over uses inline two-step confirmation ("Tap again to clear everything").
9. **Elimination of Confirmed State & Auto-Downloads:** Replaced mark-confirmed workflows and automatic downloads with per-section Copy buttons and a clean Print / Save a copy view with print-only styling.

---

## 2. Implemented vs. Out of Scope

### Implemented Controls
- **Client-Side Deterministic Safety Triage:** 27-combination invariant test matrix covering danger, age, and financial demands.
- **Header on Every Screen:** Urgent help static sheet (112, 1098, safety rules, portal link), Privacy & limits modal, Quick exit button (`location.replace` to neutral site).
- **Single-Source Reporting Resources (`shared/resources.json`):** 7 verified emergency and reporting resources in India.
- **Local OCR Worker Isolation:** Dynamic import of Tesseract.js, self-hosted WASM core/lang assets, magic byte verification, 5 MB and 4096px caps, worker termination.
- **Client PII Redaction & Re-Insertion:** Toggles for phone, email, and UPI/account numbers.
- **ComplaintDraft Schema & Prompt Injection Hardening:** Delimited user data with tag neutralization (`</user_description>`).
- **Comprehensive Server Guards:** Scrubbing, grounding, legal term rejection, negation-aware safety linting, allowlisted resource IDs.
- **Zero Persistent Storage:** No `localStorage`, `sessionStorage`, `IndexedDB`, or cookies for incident data.
- **Strict Middlewares:** 64 KB request body cap (413 Payload Too Large), security headers (CSP with `wasm-unsafe-eval` and `blob:` workers), in-memory sliding window rate limiter (6 req/min, 300 req/day).

### Explicitly Out of Scope
- Accounts, user registration, passwords, and sessions.
- Databases, cloud storage, and persistent incident stores.
- Sending screenshots or images to any server or AI model.
- Image authenticity detection, deepfake forensics, or face recognition.
- Perpetrator tracing, phone lookup, or doxxing.
- Direct automated filing with police or cybercrime portals.

---

## 3. Architecture & User Journey

```
                     ┌──────────────────┐
                     │       Home       │
                     └─────────┬────────┘
                               │ Start Triage
                               ▼
                     ┌──────────────────┐
                     │  Safety Triage   │ ◄── 100% In-Browser (3 Questions)
                     └─────────┬────────┘
                               │ Deterministic ActionCard
                               ▼
                     ┌──────────────────┐
                     │   Action Card    │ ◄── Urgent 112 / Safe Adult / Checklist
                     └─────────┬────────┘
             Minor /           │ Adult Option
             Offline Path      ▼
             ┌───────────►┌──────────┐
             │            │ AI Intro │ ◄── Explains Data Flow & Terms
             │            └────┬─────┘
             │                 │ Choose AI
             │                 ▼
             │            ┌──────────┐
             │            │  Input   │ ◄── Description, Details, Local OCR
             │            └────┬─────┘
             │                 │ Next (AI Path)
             │                 ▼
             │      ┌─────────────────────┐
             │      │   Review Outgoing   │ ◄── Inspect Redaction Tokens ([PHONE_1])
             │      └──────────┬──────────┘
             │                 │ Send to AI Service
             │                 ▼
             │      ┌─────────────────────┐
             │      │      Analyzing      │ ◄── AbortController with Cancel
             │      └──────────┬──────────┘
             │                 │ Success
             │                 ▼
             └───────────►┌──────────┐
                          │  Draft   │ ◄── Editable Textareas, Copy, Print CSS
                          └──────────┘
```

---

## 4. Privacy & Data Flow to Google Gemini

1. **What is sent:** Only the text the user types or extracted text they review in the Input screen (description, optional evidence text, platform, incident time, money status).
2. **What is NEVER sent:** Intimate photos/videos, screenshots, images, files, user accounts, IP logs, or unconfirmed personal details.
3. **When it is sent:** Only after the user confirms they are 18+, checks explicit consent, reviews the redacted text on the Review Outgoing screen, and clicks the explicit **"Send to AI service"** button.
4. **Offline Alternative:** Users can skip AI entirely at `actionCard`, `aiIntro`, or `input` to create a local preparation draft in memory without sending any data over the network.

### Tier-Dependent Privacy Copy
All Gemini terms disclosures are centralized in `frontend/src/content/privacyCopy.ts` (`lastChecked: "2026-10-23"`, source `https://ai.google.dev/gemini-api/terms`):
- **Paid Tier (`GEMINI_PAID_TIER=true`):** "Google's paid-service terms say it doesn't use this content to improve its products, and describe how it processes the data under its terms. We still can't promise absolute confidentiality."
- **Free/Unpaid Tier (`GEMINI_PAID_TIER=false`):** "This prototype uses Google's free tier. Under Google's terms for free use, submitted content may be used to improve Google products and may be reviewed by people. Please enter only fictional details."

*Note: This copy must be re-checked against Google's current terms and approved by project owner/legal counsel before unrestricted public deployment.*

---

## 5. Concise Legal & Regulatory Note (India)

- **Digital Personal Data Protection (DPDP) Act & Rules 2025:**
  - Phased commencement is scheduled, with core compliance duties expected around 13 May 2027 (no accelerating amendments discovered as of late September/October 2026).
  - Verifiable parental consent mechanisms for processing children's personal data remain legally complex and unresolved for unauthenticated emergency first-response tools. SafeSignal addresses this by disabling AI processing, accounts, and server transmission for minors.
- **Protection of Children from Sexual Offences (POCSO) Act:** Mandatory reporting obligations (Section 19/21) apply when knowledge of child sexual abuse material exists. SafeSignal never collects, hosts, or stores images or child sexual abuse material, and routes minors directly to Childline 1098 and 112.
- **Information Technology Act & Intermediary Guidelines:** SafeSignal does not act as a host or publisher of intimate content.
- **Cross-Border Processing:** Transmission of text to Google's Gemini servers involves cross-border cloud processing governed by Google's terms.
- **Status:** SafeSignal is an experimental hackathon/buildathon prototype. It is **NOT** certified child-safe, does not claim regulatory compliance, and is **NOT** approved for unrestricted public deployment without specialized legal counsel.

---

## 6. Security Controls

| Category | Control | Status |
|---|---|---|
| **Storage** | Zero persistent storage (no cookies, localStorage, sessionStorage, IndexedDB) | Implemented |
| **Logging** | Operational metadata only (`request_id`, status, latency, length buckets); zero input text | Implemented |
| **OCR Isolation** | Magic byte validation (PNG/JPEG), 4096px limit, self-hosted assets, worker termination | Implemented |
| **Injection Defense** | Delimiter tag neutralization (`[sanitized_tag]`), strict Pydantic parsing | Implemented |
| **Output Guards** | Scrubbing (URLs/emails/phones/citations), grounding token validation, safety lint | Implemented |
| **Transport** | HTTPS termination | Hosting-dependent |
| **Proxy Headers** | Trusted proxy validation (`TRUST_PROXY=true` only behind sanitized load balancer) | Hosting-dependent |
| **Confidentiality** | Absolute secrecy across third-party AI infrastructure | Not guaranteed |
| **Client Cleanliness** | Erasing browser history, cache, or external downloads | Not guaranteed |

---

## 7. Reporting Resource Maintenance Procedure

SafeSignal maintains verified Indian reporting and emergency helplines in `shared/resources.json`:
1. `ERSS_112`: Emergency Response Support System (112) — Primary verified.
2. `CHILDLINE_1098`: Childline (1098) — Primary verified (Lok Sabha answer 29 Nov 2024).
3. `NCRP`: National Cyber Crime Reporting Portal (`cybercrime.gov.in`) — Partial verified.
4. `HELPLINE_1930`: National Cyber Crime Helpline (1930, financial fraud scope) — Primary verified.
5. `STOPNCII`: StopNCII.org (18+ intimate image hashing) — Primary verified.
6. `TAKE_IT_DOWN`: Take It Down NCMEC (<18 image hashing) — Primary verified.
7. `META_NCII`: Meta Harassment & NCII Reporting Page — Primary verified.

### Maintenance Workflow
1. Re-verify every entry periodically: click every link, dial helplines, and review government gazette/directory updates.
2. If an entry cannot be verified, set `"verificationLevel": "needs_review"`; the UI will automatically hide it.
3. Update `"lastChecked"` (ISO date `YYYY-MM-DD`, never in the future) and `"verificationSource"`.
4. Run `npm test -- src/__tests__/resources.test.ts` to validate schema and UI hiding invariants.

---

## 8. Evaluation & Regression Benchmarks

SafeSignal includes a comprehensive 20-case synthetic evaluation suite (`eval/cases/cases.json`) and controlled replay fixtures (`eval/replays/`).

### How to Run Evaluation
```bash
# 1. Run backend pipeline evaluation runner (writes eval/results/pipeline.json)
PYTHONPATH=. .venv/bin/pytest backend/tests/test_eval_pipeline.py -v

# 2. Run frontend triage evaluation runner (writes eval/results/triage.json)
npm --prefix frontend test -- src/__tests__/evalTriage.test.ts

# 3. Aggregate metrics and print evaluation report
python3 eval/summarize.py
```

### Actual Evaluation Results
```
========================================================================
SafeSignal Synthetic Evaluation Summary Report
========================================================================
Evaluation Date: 2026-10-23 08:06 UTC
Git Commit Hash: f95dc85
Evaluation Mode: PIPELINE (Deterministic, zero network)
Manual Review Status: manual review: not performed
------------------------------------------------------------------------
Metric A: Hallucinated-Detail Rate: 0.0% (0/14)
          - Unsupported factual claims in final draft: 0
          - Automated token grounding applied (does not catch semantic fabrication)
          - Server Guard Interventions: 1
          - Adversarial-Replay Catch Rate: 100.0% (9/9)
------------------------------------------------------------------------
Metric B: Unsafe-Advice Rate: 0.0% (0/20)
          - Negation-aware lint violations across triage cards & drafts: 0
------------------------------------------------------------------------
Metric C: Minor-Routing Accuracy: 100.0% (4/4)
          - Evaluated cases: 09 (triage minor), 10 (text minor), 11 (age skipped), 20 (unsafe guardian)
          - All required routing, conservative items, and Gemini-block enforced: 4/4
------------------------------------------------------------------------
Deterministic Triage Suites: 20/20 synthetic cases passed
                              27/27 3x3x3 combination matrix invariant tests passed
========================================================================
```

*Note: Automated token grounding catches invented handles, numbers, and amounts, but cannot detect nuanced semantic fabrication. These 20 synthetic cases provide regression testing, not clinical or legal safety certification.*

---

## 9. Known Limitations

1. **Local OCR Imperfections:** Mobile screenshots with unusual fonts, dark mode artifacts, or compression may yield partial OCR transcripts. Users can edit or paste text manually.
2. **English Language Only:** Safety lint, heuristic minor patterns, and system prompts currently target English.
3. **Heuristic Minor Detection:** The server-side minor guard uses conservative keyword heuristics; it is an additional safety backstop, not an age verification system.
4. **In-Memory Rate Limiting:** Per-instance sliding window in RAM resets on restart and is not distributed across clusters without a shared store.
5. **Generative Model Nuances:** AI can misinterpret ambiguous text; the draft must always be reviewed by the user.
6. **Portal Fields Unverified:** Draft sections are generic complaint-preparation organizers; the official portal's exact internal form schema is not guaranteed.

---

## 10. Local Setup & Testing Instructions

### Prerequisites
- Python 3.11+
- Node.js 20+ and npm

### 1. Installation
```bash
# Clone & enter directory
cd PromptWars-Alta

# Backend virtualenv
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# Frontend dependencies (automatically copies Tesseract self-hosted assets)
cd frontend
npm install
cd ..
```

### 2. Running Locally
```bash
# Option A: Development (Dual Process)
# Terminal 1: Backend
source .venv/bin/activate
uvicorn backend.app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
# Open http://localhost:5173

# Option B: Production (Unified Server)
cd frontend && npm run build && cd ..
source .venv/bin/activate
uvicorn backend.app.main:app --port 8000
# Open http://localhost:8000
```

### 3. Running All Tests & Validation
```bash
# Backend pytest suite (unit + eval pipeline + lint parity)
PYTHONPATH=. .venv/bin/pytest backend/tests -v

# Backend ruff linter
.venv/bin/ruff check backend

# Frontend vitest suite (unit + triage + eval)
npm --prefix frontend test

# Frontend ESLint & TypeScript compilation
npm --prefix frontend run lint
npm --prefix frontend run build
```