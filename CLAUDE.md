# Home Inventory Tracker — Claude Context

## What this project is
A premium hybrid-input home asset and inventory management SPA. Users sign in with Google, then track every item in their home through manual CRUD or AI-powered document scanning (camera/image → Gemini API → structured JSON → review modal → merge).

## Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons
- **Auth:** Firebase Auth — Google Sign-In only
- **AI:** Gemini 2.5 Flash (`gemini-2.5-flash-preview-09-2025`) via REST API
- **Persistence:** Firestore — `users/{uid}/items/{itemId}`, real-time `onSnapshot` listener
- **Deploy:** Firebase Hosting via GitHub Actions

## Architecture Decisions
- Single-file component (`src/App.jsx`) — all state, logic, and UI in one file for simplicity
- Firestore-backed state — `users/{uid}/items/{itemId}`; real-time `onSnapshot` keeps UI live
- First-run seed: if Firestore is empty for a new user, the 60+ item default dataset is batch-written
- Gemini API key stored in `.env` as `VITE_GEMINI_API_KEY`; falls back to empty string (user can paste key in-app)
- Exponential backoff (5 retries: 1s, 2s, 4s, 8s, 16s) on Gemini API calls
- Firebase Auth only — no Firestore, no Functions

## Key Rules / Gotchas
- All ACs must use "shall" or "must" only — no other modal verbs
- Never commit `.env` — only `.env.example`
- GitHub Actions handles all deploys — never run `firebase deploy` locally
- Architecture diagram lives at `docs/architecture.drawio`
- Global rules file: `/Users/shuvajyotibardhan/Projects/.claude_rules.md`

## GitHub Repo
TBD — will be added after first push

## AC Language Rule
All Acceptance Criteria must use "shall" (expected behaviour) or "must" (mandatory constraint) only. No other modal verbs permitted.

## Reference
- Global rules: `/Users/shuvajyotibardhan/Projects/.claude_rules.md`
- Env vars: see `.env.example`
