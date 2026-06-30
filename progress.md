# Project State
- **Last Updated:** 2026-06-30
- **Current Branch:** main
- **Current Task:** T20 — push to GitHub, set secrets, verify deployment

## Kickoff Checklist
- [x] Root files created (CLAUDE.md, progress.md, .gitignore, .env.example, README.md)
- [x] docs/PLAN.md — committed
- [x] docs/REQUIREMENTS.md — committed
- [x] docs/DESIGN.md — committed
- [x] docs/SPECS.md — committed
- [x] docs/TASKS.md — committed
- [x] docs/MANUAL_STEPS.md — committed
- [x] docs/architecture.drawio + .svg — committed
- [x] .github/workflows/deploy.yml — committed
- [x] src/App.jsx — full implementation committed (all F1–F13)
- [x] Git init + first commit (ccb9e35)
- [ ] GitHub remote created and pushed
- [ ] Firebase project created + services enabled
- [ ] GitHub Secrets set
- [ ] First GitHub Actions deploy verified

## Completed Actions
1. [x] All docs written (PLAN, REQUIREMENTS, DESIGN, SPECS, TASKS, MANUAL_STEPS)
2. [x] Vite + React + Tailwind + Firebase scaffold
3. [x] Full App.jsx implementation (F1–F13, all features)
4. [x] Firebase config files (firebase.json, .firebaserc, firestore.rules, storage.rules)
5. [x] GitHub Actions deploy workflow
6. [x] First commit — 28 files, ccb9e35

## Current Logic Context
- Stack: React 18 + Vite + Tailwind + Firebase Auth/Firestore/Storage + Gemini 2.5 Flash
- Single src/App.jsx, all state/logic/UI in one file
- 72 default items seeded on first sign-in
- Gemini model: gemini-2.5-flash-preview-05-20
- Firestore path: users/{uid}/items/{itemId}
- Storage path: users/{uid}/photos/{timestamp}.{ext}

## Next Immediate Step
- Create GitHub repo → push → set 8 GitHub Secrets → watch first deploy
- See docs/MANUAL_STEPS.md for the full checklist
