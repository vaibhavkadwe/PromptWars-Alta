# SafeSignal

SafeSignal is a secure, privacy-first, Gemini-powered first-response web application designed for individuals in India (primarily young people) facing sextortion, digital blackmail, or intimate-image abuse. It transforms messy, confusing text and message excerpts into an organised incident summary, chronological timeline, evidence-preservation checklist, and prioritised safety and reporting plan.

> **CRITICAL DISCLAIMER:** SafeSignal provides first-response triage and organizational guidance. It is **NOT** legal counsel, law enforcement, or psychological crisis counselling.

---

## 1. What and Why

Digital blackmail and intimate image threats are traumatic, fast-moving crises. Victims are frequently disoriented, terrified of public humiliation, and unsure whether to pay, delete chats, or report. 

SafeSignal bridges this gap by providing an immediate, confidential triage workspace where a user can safely organize facts, preserve critical legal evidence before it disappears, and understand their official recourse options in India (such as 112, 1098, 1930, and cybercrime.gov.in) without requiring accounts, logins, or uploading private media.

---

## 2. Implemented vs. Out of Scope

### What Is Implemented
- **Deterministic Crisis & Minor Screening:** Instant pattern recognition for physical danger threats (`112`), self-harm ideation, and minors (`1098` Childline, Take It Down).
- **Delimiter-Guarded Prompt Engineering:** Untrusted input wrapped in strict delimiters (`<user_description>`, `<evidence_text>`, `<user_details>`) with delimiter-breaking attack neutralization.
- **Strict Structured Outputs:** Gemini structured output schema enforced via Pydantic v2 `IncidentReport` model with automated retry on bad output.
- **Scrubbing & Grounding Verification:** Deterministic scrubbing of raw URLs, email addresses, phone-like digit runs, and legal citations (`IPC`, `IT Act`, `Section 67`). Grounding checks downgrade ungrounded "stated" details to "inferred".
- **Guarantee Language Rejection:** Rejects model responses promising prosecution, content removal, or 100% safety.
- **Static Verified Resource Catalog:** 8 verified Indian emergency numbers and reporting portals (`NCRP`, `1930`, `112`, `1098`, `181`, `StopNCII`, `Take It Down`, `Meta NCII`).
- **Complete In-Memory State (`useReducer`):** Zero persistence. No database, no cookies, no `localStorage`, no `sessionStorage`, no `IndexedDB` for incident data.
- **Interactive Review & Redaction:** Users can confirm, edit inline, or remove any extracted detail, timeline event, evidence item, or action item before export.
- **Privacy-Preserving Metadata Logging:** Server logs strictly operational metadata (route, latency ms, status, input length buckets). Content is never logged.
- **Security Middlewares:** 64 KB hard request body cap (returns 413), strict CSP, nosniff, no-referrer, permissions policy disabling camera/mic/geo, and `Cache-Control: no-store` on all `/api` responses.
- **In-Memory Rate Limiting:** Sliding window limiter (6 req/min per IP, 300 req/day cap) returning 429 with `Retry-After`.
- **Text-Only Evidence Loader:** Validates `.txt` files (≤ 100 KB, UTF-8, no NUL/binary bytes). Strictly forbids image uploads.
- **Single Deployable Container:** Production FastAPI app serves the Vite React bundle at `/` and API routes at `/api`.

### What Is Explicitly Out of Scope (Not Built)
- Accounts, user registration, and authentication.
- Databases, cloud storage, and persistence.
- Image/video/screenshot uploads, OCR, and computer vision.
- Image authenticity checks, face recognition, and reverse image searches.
- Sender tracing, IP tracking, or doxxing.
- Free-form chat with the AI model.
- Automated police report submissions.
- Third-party analytics, tracking scripts, and CDNs.

---

## 3. Architecture & Data Flow

```
[ User Input (Text Only) ]
            │
            ▼
[ Input Sanitization & 64 KB Cap ]
            │
            ▼
[ Deterministic Safety Screen (Regex) ] ──► Flags: Physical Danger / Self-Harm / Minor
            │
            ▼
[ Delimiter-Guarded Prompt Assembly ]
            │
            ▼
[ Google Gemini 2.5 Flash (Structured JSON) ]
            │
            ▼
[ Pydantic v2 IncidentReport Validation ] (1 Retry on failure)
            │
            ▼
[ Post-Processing: Scrubbing & Grounding Check ]
            │
            ▼
[ Deterministic Resource Selection ] ──► Allowlisted Static Catalog
            │
            ▼
[ Ephemeral In-Memory State (React useReducer) ]
            │
            ▼
[ User Review: Edit / Confirm / Exclude ]
            │
            ▼
[ Reviewed Plaintext Export (.txt) / Print ]
```

---

## 4. Stack & Pinned Versions

### Backend
- **Python:** 3.11+
- **fastapi:** `0.161.1`
- **uvicorn:** `0.54.0`
- **pydantic:** `2.14.1`
- **pydantic-settings:** `2.16.1`
- **google-genai:** `2.33.0`
- **python-dotenv:** `1.2.4`
- **pytest:** `9.1.1`
- **pytest-asyncio:** `1.4.0`
- **httpx:** `0.28.1`
- **ruff:** `0.17.2`

### Frontend
- **React:** `19.3.1`
- **React DOM:** `19.3.1`
- **Vite:** `8.3.4`
- **TypeScript:** `6.0.3`
- **Vitest:** `4.1.12`
- **@testing-library/react:** `16.3.2`
- **ESLint:** `10.13.0` (with custom AST rule forbidding `dangerouslySetInnerHTML`)

---

## 5. Environment Variables

All settings are configured via environment variables or `.env`:

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | *(None)* | Google Gemini API Key. App starts without key (returns 503 `AI_NOT_CONFIGURED`). |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model identifier used for analysis. |
| `GEMINI_PAID_TIER` | `false` | Set to `true` if using paid commercial API key (changes privacy notices). |
| `GEMINI_TIMEOUT_SECONDS` | `30` | Timeout in seconds for Gemini API generation. |
| `MAX_DESCRIPTION_CHARS` | `4000` | Maximum character length allowed for user description. |
| `MAX_EVIDENCE_CHARS` | `20000` | Maximum character length allowed for evidence text excerpts. |
| `RATE_LIMIT_PER_MINUTE` | `6` | Maximum requests per minute per IP address. |
| `DAILY_ANALYSIS_CAP` | `300` | Maximum requests allowed globally per day. |
| `TRUST_PROXY` | `false` | Set `true` only when behind a trusted reverse proxy (reads `X-Forwarded-For`). |
| `APP_ENV` | `development` | Set to `production` to disable `/docs` and enable production protections. |

---

## 6. How to Run Locally

### Prerequisites
- Python 3.11+
- Node.js 20+ and npm

### Local Development Setup

1. **Clone repository and configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and optionally add GEMINI_API_KEY
   ```

2. **Set up Python backend:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r backend/requirements.txt
   ```

3. **Set up Node frontend:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Run in Development Mode:**
   - Terminal 1 (Backend on `http://127.0.0.1:8000`):
     ```bash
     source .venv/bin/activate
     uvicorn backend.app.main:app --reload --port 8000
     ```
   - Terminal 2 (Frontend with Vite proxy on `http://localhost:5173`):
     ```bash
     cd frontend
     npm run dev
     ```

5. **Run in Production Mode (Single Service):**
   ```bash
   # 1. Build frontend bundle
   cd frontend
   npm run build
   cd ..

   # 2. Run backend serving built bundle at /
   source .venv/bin/activate
   uvicorn backend.app.main:app --port 8000
   ```
   Open `http://localhost:8000` in your browser.

---

## 7. Linting, Type Checking & Tests

Run all validation checks with:

```bash
# Backend linting & tests
source .venv/bin/activate
ruff check backend
PYTHONPATH=. pytest backend/tests -v

# Frontend linting, type checking & tests
cd frontend
npm run lint
npx tsc --noEmit
npm run test
npm run build
```

---

## 8. Deployment (Docker / Cloud Run / Render)

SafeSignal is packaged as a lightweight, multi-stage Docker container running as a non-root user and listening on `$PORT`:

```bash
# Build Docker image
docker build -t safesignal:latest .

# Run Docker container
docker run -p 8000:8000 -e GEMINI_API_KEY="your-api-key" safesignal:latest
```

### Cloud Run / Render Deployment Notes
- **HTTPS:** Ensure your host terminates TLS/HTTPS.
- **Environment Variables:** Set `GEMINI_API_KEY`, `GEMINI_PAID_TIER`, `APP_ENV=production`, and `TRUST_PROXY=true` in your host management dashboard.
- **Port:** The container automatically binds to the `$PORT` provided by the cloud runtime.

---

## 9. Security Controls & Guarantees

### Implemented Controls
- **Zero In-Memory Storage of Sensitive Logs:** The backend logging configuration strips all descriptions, evidence text, user details, prompts, and model outputs from log streams. Coarse buckets (e.g. `<100`, `1k-5k`) are used for length.
- **No Browser Persistence:** All client-side incident state is managed in a React `useReducer` lifecycle. If the tab is closed, refreshed, or the "Start a new report" button is clicked, all data is dropped from memory.
- **Hard Request Body Cap:** 64 KB payload cap enforced on all incoming POST requests before parsing.
- **Delimiter Injection Hardening:** Delimiter tags like `</user_description>` or `<evidence_text>` inside user submissions are sanitized to `[sanitized_tag]`.
- **Automated Scrubbing:** Report outputs are scrubbed for external URLs, phone-like digit sequences, email addresses, and legal citations.
- **Content-Security-Policy:** Enforces `default-src 'self'`, `frame-ancestors 'none'`, and disables browser access to microphone, camera, and geolocation via `Permissions-Policy`.

### Deployment-Dependent Controls
- **HTTPS Transport Encryption:** Must be enforced at the reverse proxy or cloud load balancer.
- **Reverse Proxy Header Security:** `TRUST_PROXY` must only be set to `true` when the proxy correctly sanitizes `X-Forwarded-For`.

### What Is NOT Guaranteed
- **Server Memory During Active Analysis:** While an analysis is running, the text is held in server RAM for the duration of the request.
- **OS-Level Crash Dumps:** If the host OS crashes during processing, residual memory may appear in system core dumps.
- **Google Data Terms:** If run on a free-tier key (`GEMINI_PAID_TIER=false`), Google's standard terms permit human reviewers to examine anonymized inputs. Users are warned with an upfront banner to enter fictional data only.
- **Client Machine Artifacts:** The "Quick exit" and "Start a new report" features clear in-app React memory; they cannot erase browser history, router logs, or files downloaded to the user's hard drive.

---

## 10. Resource Catalog Maintenance

The resource catalog in `backend/app/resources.py` and `frontend/src/components/UrgentHelp.tsx` contains 8 verified official resources in India.

### How to Re-Verify & Update
1. Test each URL in a browser and verify the helpline phone numbers:
   - `cybercrime.gov.in` (NCRP)
   - `1930` (Financial Cyber Fraud Helpline)
   - `112` (Emergency Response Support System)
   - `1098` (Childline India)
   - `181` (Women Helpline)
   - `stopncii.org` (StopNCII)
   - `takeitdown.ncmec.org` (Take It Down)
   - `meta.com/.../ncii` (Meta NCII Reporting)
2. Update the `last_checked` field in `backend/app/resources.py` to the verification date (e.g. `2026-10-23`).
3. Commit and run backend tests (`pytest backend/tests`).

---

## 11. Known Limitations

- **Text Only:** SafeSignal strictly rejects image and video files. It cannot perform OCR on screenshots.
- **Language:** Analysis prompt and UI are currently in English.
- **In-Memory Rate Limits:** Rate limits are tracked in server memory and reset when the service restarts. In multi-instance deployments, each instance maintains its own sliding window.
- **AI Probabilistic Outputs:** While bounded by schema validation, grounding checks, and scrubbing, generative AI can misinterpret nuanced slang or regional terminology.

---

## 12. Judge / Evaluator Demo Script

Follow these steps to evaluate SafeSignal end-to-end:

1. **Launch the application:**
   - In production mode: `python -m uvicorn backend.app.main:app --port 8000`
   - Visit `http://localhost:8000`.
2. **Observe Zero-Auth Home Screen:**
   - Notice no login, sign-up, or tracking cookies exist.
   - Click **"Privacy & limits"** in the top navigation to inspect the privacy guarantees.
   - Click **"Urgent help"** to verify immediate access to 112, 1098, 1930, and cybercrime.gov.in.
3. **Try Fictional Example:**
   - Click **"Try a fictional example"**.
   - Notice the form is filled with the fictional scenario (`rhea_travels_22`, 15,000 INR demand, UPI ID).
   - Check the **"I understand my text will be sent to Google's Gemini API..."** consent box.
4. **Offline / Fallback Evaluation (No Key Needed):**
   - Click **"Load fictional example"** or navigate to error fallback.
   - Click **"View fictional sample"** to inspect a pre-validated report fixture with source label `"Sample — not live AI"`.
5. **Inspect Sections A–D:**
   - **Section A:** Review summary, threat category badges (`stated`), and extracted details. Click **"Looks right"** or **"Edit"** on a detail to verify inline review state.
   - **Section B:** Inspect the chronological timeline and certainty badges.
   - **Section C:** Check items in the evidence preservation checklist with suggested filenames.
   - **Section D:** View prioritized next steps with urgency badges (`NOW`, `TODAY`) and clickable verified contact cards (`1930`, `NCRP`).
6. **Review and Export:**
   - Click **"Review and export report"**.
   - Toggle sections in the export checklist. Notice removed items are omitted and confirmed items are tagged `[Confirmed by you]`.
   - Click **"Download .txt"** to receive the formatted plain text report.
7. **Clean Reset:**
   - Click **"Start a new report"**.
   - Verify that all incident data in React state is immediately cleared.