# Home Inventory Tracker — Tasks

Each task maps to one atomic commit. Tasks are ordered by dependency.

---

## T01 — Vite + React project scaffold
- [ ] Run `npm create vite@latest . -- --template react`
- [ ] Install deps: `npm install firebase lucide-react`
- [ ] Install dev deps: `npm install -D tailwindcss postcss autoprefixer`
- [ ] Run `npx tailwindcss init -p`
- [ ] Configure `tailwind.config.js` content paths (`./index.html`, `./src/**/*.{js,jsx}`)
- [ ] Add Tailwind directives to `src/index.css`
- [ ] Confirm `npm run dev` starts without errors

**Commit:** `chore: vite + react + tailwind + firebase scaffold`

---

## T02 — Firebase project config files
- [ ] Create `firebase.json` (hosting: public `dist`, SPA rewrite; firestore; storage)
- [ ] Create `.firebaserc` with project alias placeholder
- [ ] Create `firestore.rules` (per-user UID-scoped read/write)
- [ ] Create `firestore.indexes.json` (empty)
- [ ] Create `storage.rules` (per-user UID-scoped read/write)

**Commit:** `chore: firebase config files and security rules`

---

## T03 — GitHub Actions deploy workflow
- [ ] Create `.github/workflows/deploy.yml`
  - Trigger: push to `main`
  - Steps: checkout → setup Node 20 → `npm ci` → `npm run build` → deploy hosting via `FirebaseExtended/action-hosting-deploy@v0` → deploy firestore rules → deploy storage rules
- [ ] Add `VITE_*` env vars as secrets placeholders (documented in MANUAL_STEPS.md)

**Commit:** `chore: github actions deploy workflow`

---

## T04 — Manual steps doc
- [ ] Create `docs/MANUAL_STEPS.md` listing every step the user must do by hand:
  - Create Firebase project (Console URL)
  - Enable Firestore, Storage, Authentication (Google provider)
  - Generate service account JSON → add as `FIREBASE_SERVICE_ACCOUNT` GitHub Secret
  - Add all `VITE_*` secrets to GitHub Actions
  - Add Gemini API key as `VITE_GEMINI_API_KEY` secret

**Commit:** `docs: manual setup steps`

---

## T05 — Firebase initialisation + Google Auth (F1)
- [ ] In `src/App.jsx`: initialise Firebase app, Auth, Firestore, Storage from `import.meta.env`
- [ ] Implement `onAuthStateChanged` listener — sets `user` state and `authLoading`
- [ ] Build sign-in page: full-screen centered card, "Sign in with Google" button using `signInWithPopup` + `GoogleAuthProvider`
- [ ] Build signed-in header: user avatar, display name, "Sign Out" button
- [ ] Implement `handleSignOut` via `signOut`
- [ ] Auth gate: render sign-in page if `!user`, spinner if `authLoading`, main view if `user`

**Commit:** `feat(F1): google sign-in with firebase auth`

---

## T06 — Firestore real-time listener + first-run seeding (F11, F12)
- [ ] On `user` change, subscribe `onSnapshot` to `users/{uid}/items` → set `items` state
- [ ] Unsubscribe on cleanup
- [ ] Implement `seedDefaultData(uid)`:
  - Check snapshot size; skip if > 0
  - Batch-write all 70 default items with `serverTimestamp()`
  - Show full-screen "Setting up your inventory…" overlay while `seeding === true`
- [ ] Trigger seeding when snapshot returns empty on first load

**Commit:** `feat(F11,F12): firestore listener and first-run seeding`

---

## T07 — Inventory data grid (F3)
- [ ] Render `filteredItems` as a responsive table/grid
- [ ] Columns: checkbox (for multi-photo), Room, Item Name, Estimated Value, Photo (thumbnail), Actions (Edit, Delete)
- [ ] Amber row background (`bg-amber-50`) + "No Price" badge for null-value items
- [ ] "No items match" empty state message

**Commit:** `feat(F3): inventory data grid`

---

## T08 — Manual CRUD — Add + Edit (F4)
- [ ] "Add Item" button → modal with name (text, required), room (dropdown), value (number, optional)
- [ ] Validation: block submit if name is empty, show inline error
- [ ] `addItem`: `addDoc` to Firestore with `serverTimestamp()`
- [ ] Edit button on each row → pre-filled modal
- [ ] `updateItem`: `updateDoc` with `serverTimestamp()` on `updatedAt`
- [ ] Both modals dismissible via close button or Escape key

**Commit:** `feat(F4a): add and edit item modals`

---

## T09 — Manual CRUD — Delete (F4)
- [ ] Delete button on each row → confirmation modal with item name
- [ ] `deleteItem`: `deleteDoc` from Firestore
- [ ] Cancel closes modal without changes

**Commit:** `feat(F4b): delete item with confirmation modal`

---

## T10 — Search, room filter, missing prices filter (F6, F7)
- [ ] Search text input — live filter on item name and room (case-insensitive)
- [ ] Room dropdown — "All Rooms" default + 13 room options
- [ ] "Show missing prices only" checkbox
- [ ] `filteredItems` useMemo combining all three filters

**Commit:** `feat(F6,F7): search, room filter, missing prices filter`

---

## T11 — Analytics dashboard (F8)
- [ ] Four summary cards: Total Value, Total Items, Valued Items, Pending Prices
- [ ] `dashboardStats` useMemo
- [ ] Per-room bar chart: `roomStats` useMemo — one row per room, bar width proportional to share of total value, percentage label
- [ ] Dashboard updates reactively with `items`

**Commit:** `feat(F8): analytics dashboard and per-room bar chart`

---

## T12 — AI document scan (F5)
- [ ] "Scan Paper List" button → hidden file input (`accept="image/*"`, `capture="environment"`)
- [ ] If `geminiApiKey` is empty, show inline prompt for user to paste key; save to component state
- [ ] `fileToBase64(file)` — FileReader → base64 string
- [ ] `callGeminiWithBackoff(requestBody)` — fetch with exponential backoff (5 retries, delays 1s/2s/4s/8s/16s)
- [ ] Spinner overlay while API call is in progress
- [ ] On success: parse JSON from `candidates[0].content.parts[0].text` → set `scannedItems`

**Commit:** `feat(F5a): gemini api scan with exponential backoff`

---

## T13 — Scan review modal (F5)
- [ ] Review modal showing extracted items: room (dropdown, editable), item name (text, editable), value (number, editable)
- [ ] "Remove" button per row to discard individual extracted items
- [ ] "Merge into Inventory" button: `addDoc` each item to Firestore, close modal
- [ ] "Cancel" button discards all scanned items

**Commit:** `feat(F5b): scan review modal and merge into firestore`

---

## T14 — Photo upload — single item (F13)
- [ ] Camera icon button on each grid row
- [ ] File input (`accept="image/jpeg,image/png,image/webp,image/heic"`, max 10 MB check)
- [ ] `uploadPhoto(file, [itemId], uid)` — `uploadBytesResumable` with progress state
- [ ] Upload progress bar shown during upload
- [ ] On completion: write `photoUrl` to item's Firestore doc
- [ ] Thumbnail rendered in grid row if `photoUrl` is set
- [ ] Click thumbnail → `photoViewerUrl` state → full-size image viewer modal
- [ ] "Remove photo" option in viewer modal — sets `photoUrl` to `null`

**Commit:** `feat(F13a): single-item photo upload with thumbnail viewer`

---

## T15 — Photo upload — multi-item (F13)
- [ ] Checkbox column in grid — selecting rows populates `selectedItemIds` Set
- [ ] "Attach Photo to Selected" button appears when `selectedItemIds.size > 0`
- [ ] Clicking it triggers file input → `uploadPhoto(file, [...selectedItemIds], uid)`
- [ ] Same Storage upload + progress + URL write to all selected items
- [ ] Clear `selectedItemIds` after successful upload

**Commit:** `feat(F13b): multi-item photo attach`

---

## T16 — CSV export (F9)
- [ ] "Export CSV" button
- [ ] `exportCSV(items)` — builds CSV string (all items, not filtered) with columns: Room, Item Name, Estimated Value, Photo URL
- [ ] Null values → empty cell; null photoUrl → empty cell
- [ ] Filename: `home-inventory-YYYY-MM-DD.csv`
- [ ] Triggers browser download via transient `<a>` element

**Commit:** `feat(F9): csv export with photo url column`

---

## T17 — Reset to defaults (F10)
- [ ] "Reset to Defaults" button → confirmation modal with clear warning
- [ ] On confirm: delete all docs in `users/{uid}/items`, then call `seedDefaultData` (skip-if-exists check bypassed on reset path)
- [ ] Loading overlay during operation
- [ ] Cancel closes modal without changes

**Commit:** `feat(F10): reset to defaults with confirmation`

---

## T18 — Polish: loading states, error handling, empty states
- [ ] Auth loading spinner (full-screen)
- [ ] Seeding overlay "Setting up your inventory…"
- [ ] Upload progress bar (dismisses at 100%)
- [ ] Gemini API error toast/banner
- [ ] Empty inventory state (no items message + "Add Item" prompt)
- [ ] Responsive layout check (mobile + desktop)

**Commit:** `feat: loading states, error handling, empty states`

---

## T19 — Final integration + smoke test
- [ ] Sign in → seeding → grid renders all 70 items
- [ ] Add / edit / delete items
- [ ] Search, room filter, missing prices filter
- [ ] Analytics dashboard totals correct
- [ ] Scan a test image → review modal → merge
- [ ] Upload a photo to one item → thumbnail visible
- [ ] Select 3 items → attach photo → all 3 show thumbnail
- [ ] Export CSV → verify 4 columns including Photo URL
- [ ] Reset to defaults → items restored
- [ ] Sign out → sign back in → data persists

**Commit:** `test: integration smoke test sign-off`

---

## T20 — First push + deployment verification
- [ ] `git push origin main`
- [ ] Watch GitHub Actions run to completion (`gh run watch`)
- [ ] Verify Firebase Hosting URL loads and sign-in works
- [ ] Update `CLAUDE.md` with live hosting URL

**Commit:** `chore: update CLAUDE.md with live hosting url`

---

## Manual Steps (user must do — not automated)

These are documented in full in `docs/MANUAL_STEPS.md`:

1. Create Firebase project at console.firebase.google.com
2. Enable Firestore (Native mode), Storage, and Authentication (Google provider)
3. Generate service account JSON → add as `FIREBASE_SERVICE_ACCOUNT` GitHub Secret
4. Add all `VITE_FIREBASE_*` values as GitHub Secrets
5. Add `VITE_GEMINI_API_KEY` as GitHub Secret (or leave empty and paste in-app)
6. Add Firebase project ID to `.firebaserc`
