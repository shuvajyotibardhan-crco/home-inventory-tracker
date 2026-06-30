# Home Inventory Tracker — Design

## High-Level Overview

A React single-page application with no traditional backend. Firebase handles auth, data storage, and file storage. The entire UI and application logic lives in `src/App.jsx`. Data is organized around houses rather than users — each house has its own items, photos, and member list, and a user can belong to multiple houses. Gemini 2.5 Flash processes scanned document images and returns structured JSON via a REST call made directly from the browser. The app is hosted on Firebase Hosting and deployed automatically via GitHub Actions on every push to `main`.

---

## Architecture Diagram

![Architecture Diagram](architecture.svg)

> Source file for editing: [architecture.drawio](architecture.drawio)

---

## Module Design

### `src/App.jsx`

The entire application. It is divided into logical sections within a single file:

**Auth layer**
- Initialises Firebase App, Auth, Firestore, and Storage on module load.
- `useEffect` subscribes to `onAuthStateChanged`. While loading, a full-screen spinner renders. If no user, the sign-in page renders. If authenticated, the main inventory view renders.
- On sign-in, `setDoc(..., { merge: true })` upserts the user's profile doc at `users/{uid}` with their display name, email, and photo URL. This keeps the directory current for invite email lookups.
- `handleSignIn` calls `signInWithPopup` with `GoogleAuthProvider`. `handleSignOut` calls `signOut`.

**Firestore layer — houses**
- A single `useEffect` (triggered when `user` changes) subscribes to `onSnapshot` on `users/{uid}`. When the `houseIds` array changes, it reconciles per-house `onSnapshot` listeners stored in a `houseListeners` ref map.
- Each per-house listener watches `houses/{houseId}` and writes the house document into the `houses` state array. If a listener fires a permission error (user was removed from the house), it cleans itself up and removes the stale `houseId` from `users/{uid}/houseIds` via `arrayRemove`.
- If `houseIds` is empty on first read and `initRan.current` is `false`, `initFirstHouse(user)` runs once: checks for legacy `users/{uid}/items` data, migrates it (or seeds defaults), creates the `houses/{houseId}` document and `members` subcollection, and appends the new house ID to `users/{uid}/houseIds`. The `initRan` ref prevents double-execution.
- Items and photos are read from `houses/{activeHouseId}/items` and `houses/{activeHouseId}/photos` via separate `onSnapshot` listeners that restart whenever `activeHouseId` changes.
- `addItem`, `updateItem`, `deleteItem` target `houses/{activeHouseId}/items/{itemId}`.

**Storage layer**
- `uploadPhoto(file, itemIds)` uploads to `houses/{activeHouseId}/photos/{timestamp}.{ext}` via `uploadBytesResumable`, tracks progress, calls `getDownloadURL`, then writes a metadata document to `houses/{activeHouseId}/photos`. Optionally links to specified item IDs immediately.
- Legacy photos stored at `users/{uid}/photos/` remain readable (backwards-compat Storage rule) but new uploads always use the house-scoped path.
- `handleLinkPhoto(photoUrl, itemIds)` writes the chosen URL to each item's `photoUrl` field.
- `handleUnlinkPhoto(itemId)` calls `updateDoc` to set `photoUrl` to `null`; the Storage file and gallery record are left intact.
- `handleDeletePhoto(photoId)` deletes the Firestore metadata document from `houses/{activeHouseId}/photos`; the Storage file and any item `photoUrl` links remain.

**AI scan layer**
- `handleScanImage(file)` reads the file as base64, builds the Gemini API request body (with JSON schema in `generationConfig`), and calls `callGeminiWithBackoff`.
- `callGeminiWithBackoff` wraps the fetch in a retry loop: up to 5 attempts, delays `[1000, 2000, 4000, 8000, 16000]` ms.
- On success, parsed items are placed in `scannedItems` state and the review modal opens.

**Sharing / invite layer**
- `sendInvite(email)` queries `users` by email. If found, adds the user directly to `houses/{houseId}/members` and appends the house to their `houseIds`. If not found, creates an `invites/{inviteId}` document (`inviterUid`, `houseId`, `houseName`, `inviteeEmail`).
- On sign-in, the app queries `invites` where `inviteeEmail == user.email` and stores results in `pendingInvites` state.
- `acceptInvite(invite)` adds the user to the house members subcollection, appends the house ID to their `houseIds`, and deletes the invite document.
- `declineInvite(invite)` deletes the invite document only.

**State**
- `items` — live array from Firestore items snapshot for the active house.
- `photos` — live array from Firestore photos snapshot for the active house.
- `houses` — array of house documents the user belongs to.
- `housesLoaded` — boolean, true once the initial house listener has resolved.
- `activeHouseId` — ID of the currently selected house (persisted in `localStorage`).
- `houseMembers` — live array of member documents for the active house.
- `pendingInvites` — array of `invites` docs addressed to the current user's email.
- `user` — Firebase Auth user object or `null`.
- `authLoading` — boolean, true while `onAuthStateChanged` is resolving.
- `seeding` — boolean, true while the first-run batch write is in progress.
- `searchText`, `roomFilter`, `missingPricesOnly` — filter state.
- `selectedItemIds` — Set of item IDs checked for multi-item photo linking.
- `linkingItemIds` — array of item IDs awaiting a photo selection in the picker modal; `null` when closed.
- `isDragging` — boolean, true while a drag is active over the Photos tab upload zone.
- `scannedItems` — array of items parsed from Gemini, held pending review.
- `uploadProgress` — number 0–100 for the active upload, or `null` when idle.
- `viewerUrl` / `viewerItemId` — URL and item ID for the full-size photo viewer modal.
- Modal states: `showAddModal`, `showResetModal`, `showProfileModal`, `showCreateHouseModal`, `showShareModal`, `deletingItem`, `linkingItemIds`, `viewerUrl`.

**Derived values (useMemo)**
- `filteredItems` — `items` filtered by `searchText`, `roomFilter`, `missingPriceOnly`.
- `roomStats` — per-room total value and percentage of grand total.
- `dashboardStats` — total value, total count, valued count, pending count.

**CSV export**
- `exportCSV` builds a string with columns Room, Item Name, Estimated Value, Photo URL, creates a Blob, and triggers a download via a transient `<a>` element.

---

## Design Decisions

### Single file (`App.jsx`)
The user spec explicitly required a single-file app. Keeping all logic in one file avoids any import graph complexity and makes the app trivially portable.

### Firestore over localStorage
localStorage is device-local and lost on browser clear. Firestore gives per-user cloud persistence and real-time sync across tabs and devices with minimal code (`onSnapshot`).

### Firebase Storage for photos
Firestore documents have a 1 MB size limit — base64 images can't be stored inline. Firebase Storage is the natural pairing: photos live in Storage, only the download URL lives in the Firestore item document.

### House-scoped data model
All inventory data (items, photos, members) is stored under `houses/{houseId}/` rather than `users/{uid}/`. This lets multiple users share a house without duplicating data, and it cleanly separates the identity layer (`users/`) from the asset layer (`houses/`). The cost is a slightly more complex listener setup: a top-level `users/{uid}` listener drives a dynamic map of per-house `onSnapshot` listeners. The complexity is contained in a single `useEffect` and a `houseListeners` ref.

### Central photo gallery with item linking
Photos are uploaded to a dedicated Photos tab and stored in two places: the file in Firebase Storage at `houses/{houseId}/photos/` and a lightweight metadata document in `houses/{houseId}/photos`. Items don't own photos — they hold a reference URL. The same photo can link to any number of items, and deleting a gallery record doesn't cascade to items.

### Gemini JSON schema enforcement
Setting `response_mime_type: "application/json"` and `response_schema` in `generationConfig` removes the need for fragile regex parsing. The model is constrained to return a valid array of `{ room, item, value }` objects.

### Exponential backoff
Mobile networks and the Gemini API are both susceptible to transient errors. Five retries with doubling delays handle temporary outages without bombarding the API.

### No backend / no Cloud Functions
Auth, storage, and database are all handled by Firebase client SDKs. There's nothing server-side to maintain, scale, or secure beyond Firestore rules.

---

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| UI framework | React 18 + Vite | Fast dev, JSX, modern build |
| Styling | Tailwind CSS | Utility-first, no extra CSS files |
| Icons | Lucide Icons | Consistent, tree-shakeable icon set |
| Auth | Firebase Auth (Google provider) | One-click Google Sign-In |
| Database | Firebase Firestore | Real-time sync, per-user security rules |
| File storage | Firebase Storage | Photo uploads, UID-scoped access rules |
| AI | Gemini 2.5 Flash REST API | Multimodal image input, structured JSON output |
| Hosting | Firebase Hosting | CDN-backed, integrates with GitHub Actions |
| CI/CD | GitHub Actions | Automated build + deploy on push to `main` |

---

## Deployment

Every push to `main` triggers `.github/workflows/deploy.yml`:
1. Checkout code
2. Install dependencies (`npm ci`)
3. Build (`npm run build`) — Vite outputs to `dist/`
4. Deploy `dist/` to Firebase Hosting via `FirebaseExtended/action-hosting-deploy@v0`
5. Deploy `firestore.rules` and `storage.rules` via `firebase-tools`

All Firebase config values are stored as GitHub Actions Secrets and injected as `VITE_*` env vars at build time.

---

## Constraints & Known Limitations

| Constraint | Detail |
|-----------|--------|
| Single file | All UI and logic in `App.jsx` — no component split-outs per spec |
| 10 MB photo limit | Enforced client-side; Firebase Storage has no hard cap but large files hurt UX |
| Gemini API key | Must be set in `.env`; the app degrades gracefully (prompts user) if missing |
| Photo deletion from Storage | Removing a photo from an item only clears the URL in Firestore — the file remains in Storage (avoids accidental deletion when same photo is linked to multiple items) |
| Offline support | No offline mode; Firestore `onSnapshot` requires connectivity for the initial load |
| Browser compatibility | Requires a modern browser with ES2020 support; no IE11 |
| Invite email lookup | `sendInvite` queries `users` by email — works only if the invitee has signed in at least once. For new users, a pending `invites` doc is created and picked up on their first sign-in. |
| House ownership transfer | Not currently supported — the original creator is permanently the owner. |
| Legacy data migration | Runs automatically and silently for any user whose `users/{uid}/items` collection has data. It runs exactly once (guarded by `initRan` ref); if it fails mid-way, the user doc won't have the new `houseId` and migration will not retry. |
