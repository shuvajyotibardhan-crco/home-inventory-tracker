# Home Inventory Tracker — Claude Context

## What this project is
A premium home asset and inventory management SPA. Users sign in with Google, then track every item in their home through manual CRUD and photo uploads.

## Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons
- **Auth:** Firebase Auth — Google Sign-In only
- **Persistence:** Firestore — `users/{uid}/items/{itemId}`, real-time `onSnapshot` listener
- **Storage:** Firebase Storage — `users/{uid}/photos/{timestamp}.{ext}`
- **Deploy:** Firebase Hosting via GitHub Actions

## Architecture Decisions
- Single-file component (`src/App.jsx`) — all state, logic, and UI in one file for simplicity
- Firestore-backed state — `users/{uid}/items/{itemId}`; real-time `onSnapshot` keeps UI live
- First-run seed: if Firestore is empty for a new user, 72 default items are batch-written
- Photo uploads via Firebase Storage; only the download URL is stored in Firestore

## Key Rules / Gotchas
- All ACs must use "shall" or "must" only — no other modal verbs
- Never commit `.env` — only `.env.example`
- Never commit `*-firebase-adminsdk-*.json` — covered by .gitignore
- GitHub Actions handles all deploys — never run `firebase deploy` locally
- Architecture diagram lives at `docs/architecture.drawio`
- Global rules file: `/Users/shuvajyotibardhan/Projects/.claude_rules.md`
- Firestore/Storage rules deploy requires "Firebase Admin" IAM role on the service account — see `docs/MANUAL_STEPS.md` step 10
- `storage.rules` uses cross-service `firestore.exists()` for house-membership checks — needs two one-time grants since `--non-interactive` deploys skip the CLI's normal consent flow: (1) "Firebase Rules Firestore Service Agent" IAM role on the `gcp-sa-firebasestorage` service agent, and (2) the project-level "cross-service calls" toggle, which only appears as a banner in Firebase Console → Storage → Rules and has no CLI equivalent — see `docs/MANUAL_STEPS.md` step 11

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
