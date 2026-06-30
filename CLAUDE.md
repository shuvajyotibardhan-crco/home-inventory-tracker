# Home Inventory Tracker — Claude Context

## What this project is
A premium hybrid-input home asset and inventory management SPA. Users sign in with Google, then track every item in their home through manual CRUD or AI-powered document scanning (camera/image → Gemini API → structured JSON → review modal → merge).

## Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons
- **Auth:** Firebase Auth — Google Sign-In only
- **AI:** Gemini 2.5 Flash (`gemini-2.5-flash-preview-05-20`) via REST API
- **Persistence:** Firestore — `users/{uid}/items/{itemId}`, real-time `onSnapshot` listener
- **Storage:** Firebase Storage — `users/{uid}/photos/{timestamp}.{ext}`
- **Deploy:** Firebase Hosting via GitHub Actions

## Architecture Decisions
- Single-file component (`src/App.jsx`) — all state, logic, and UI in one file for simplicity
- Firestore-backed state — `users/{uid}/items/{itemId}`; real-time `onSnapshot` keeps UI live
- First-run seed: if Firestore is empty for a new user, 72 default items are batch-written
- Gemini API key stored in `.env` as `VITE_GEMINI_API_KEY`; falls back to empty string (user can paste key in-app)
- Exponential backoff (5 retries: 1s, 2s, 4s, 8s, 16s) on Gemini API calls
- Photo uploads via Firebase Storage; only the download URL is stored in Firestore

## Key Rules / Gotchas
- All ACs must use "shall" or "must" only — no other modal verbs
- Never commit `.env` — only `.env.example`
- Never commit `*-firebase-adminsdk-*.json` — covered by .gitignore
- GitHub Actions handles all deploys — never run `firebase deploy` locally
- Architecture diagram lives at `docs/architecture.drawio`
- Global rules file: `/Users/shuvajyotibardhan/Projects/.claude_rules.md`
- Firestore/Storage rules deploy requires "Service Usage Consumer" IAM role on the service account — see `docs/MANUAL_STEPS.md` step 10

## GitHub Repo
https://github.com/shuvajyotibardhan-crco/home-inventory-tracker

## Live URL
https://home-inventory-tracker-f94b1.web.app

## Firebase Project
- Project ID: `home-inventory-tracker-f94b1`
- Auth domain: `home-inventory-tracker-f94b1.firebaseapp.com`
- Storage bucket: `home-inventory-tracker-f94b1.firebasestorage.app`

## AC Language Rule
All Acceptance Criteria must use "shall" (expected behaviour) or "must" (mandatory constraint) only. No other modal verbs permitted.

## Reference
- Global rules: `/Users/shuvajyotibardhan/Projects/.claude_rules.md`
- Env vars: see `.env.example`
- Manual setup steps: `docs/MANUAL_STEPS.md`
