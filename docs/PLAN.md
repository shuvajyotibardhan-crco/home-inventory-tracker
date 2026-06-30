# Home Inventory Tracker — Plan

## Overview

A premium, single-page home asset and inventory management app. Users sign in with Google, then track every item in their home across 14 named rooms. Data lives in localStorage. Two input paths exist: manual CRUD and AI-powered document scanning via Gemini 2.5 Flash.

---

## Feature Set

| # | Feature | Priority |
|---|---------|----------|
| F1 | Google Sign-In (Firebase Auth) | P0 |
| F2 | Pre-populated default inventory dataset | P0 |
| F3 | View inventory — filterable data grid | P0 |
| F4 | Manual CRUD — add, edit, delete items | P0 |
| F5 | AI document scan — image/camera → Gemini → review modal → merge | P0 |
| F6 | Live search and room filter | P0 |
| F7 | "Show missing prices only" filter | P1 |
| F8 | Financial analytics dashboard (totals + per-room bar chart) | P1 |
| F9 | CSV export | P1 |
| F10 | Reset to default dataset | P1 |
| F11 | Firestore persistence (per-user, real-time sync) | P0 |
| F12 | Initial data seeding — batch-write 60+ item default dataset on first sign-in | P0 |
| F13 | Item photo upload — upload one photo and link it to one or more selected items | P1 |

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | React 18 + Vite | Fast dev, JSX, modern tooling |
| Styling | Tailwind CSS | Utility-first, no extra CSS files |
| Icons | Lucide Icons | Clean, consistent icon set |
| Auth | Firebase Auth (Google) | One-click Google Sign-In, no backend needed |
| AI | Gemini 2.5 Flash REST API | Structured JSON output, multimodal image input |
| Persistence | Firebase Firestore | Per-user cloud storage, cross-device sync |
| Storage | Firebase Storage | Photo uploads scoped per user; free tier |
| Hosting | Firebase Hosting | Free tier, fast CDN, integrates with Actions |
| CI/CD | GitHub Actions | Reliable, automated deploy on push to main |

---

## Architecture

```
Browser
 ├── Firebase Auth (Google Sign-In)
 ├── App.jsx (single-file SPA)
 │    ├── Auth gate (show login if no user)
 │    ├── Inventory state (Firestore real-time listener)
 │    ├── Manual CRUD (add / edit / delete modals)
 │    ├── AI Scan flow (upload → base64 → Gemini API → review modal → merge)
 │    ├── Filter / search bar
 │    ├── Analytics dashboard (totals + bar chart)
 │    └── Export CSV / Reset defaults
 ├── Firebase Storage (photo uploads at users/{uid}/photos/{filename})
 └── External: Gemini REST API (generativelanguage.googleapis.com)
```

---

## Key Constraints

- **Single file:** All React code lives in `src/App.jsx` — no component split-outs.
- **Firestore:** Data stored at `users/{uid}/items/{itemId}` — one document per item, scoped to the signed-in user's UID.
- **Real-time sync:** `onSnapshot` listener keeps the UI live with Firestore changes.
- **First-run seed (F12):** On first sign-in, the app checks if `users/{uid}/items` is empty. If so, it batch-writes all 60+ default items to Firestore. A loading state covers the UI during seeding. Users can trigger a manual re-seed at any time via "Reset to Defaults" (clears all items, then re-seeds).
- **Gemini API key:** Stored in `.env` as `VITE_GEMINI_API_KEY`; app falls back gracefully if empty (user pastes key in-app).
- **Retry logic:** Exponential backoff — 5 attempts, delays 1s / 2s / 4s / 8s / 16s.
- **Firestore rules:** Deployed via GitHub Actions alongside hosting; users can only read/write their own data.
- **Never deploy locally:** All deploys via GitHub Actions on push to `main`.

---

## Delivery Strategy

| Stage | Deliverable | Gate |
|-------|-------------|------|
| 1 | docs/PLAN.md | User approval |
| 2 | docs/REQUIREMENTS.md | User approval |
| 3 | docs/DESIGN.md + architecture diagram | User approval |
| 4 | docs/SPECS.md | User approval |
| 5 | docs/TASKS.md | User approval |
| 6 | Implementation (App.jsx + config files) | Functional review |
| 7 | GitHub Actions deploy.yml | CI passes |
| 8 | Live Firebase Hosting URL | User sign-off |

---

## Immediate Next Actions

1. Await PLAN.md approval.
2. Write docs/REQUIREMENTS.md (all 11 features, full ACs + test plans).
3. Write docs/DESIGN.md with architecture diagram.
4. Write docs/SPECS.md (data models, localStorage schema, Gemini API spec).
5. Write docs/TASKS.md (atomic tasks in dependency order).
6. Implement App.jsx end-to-end.
7. Set up GitHub Actions deploy workflow.
8. Push to GitHub and watch CI to green.
