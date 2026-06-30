# Project State
- **Last Updated:** 2026-06-30
- **Current Branch:** main

## Architecture (current)
- Stack: React 18 + Vite + Tailwind + Firebase Auth/Firestore/Storage
- Single `src/App.jsx` — all state/logic/UI
- Data scoped to houses: `houses/{houseId}/items`, `houses/{houseId}/photos`, `houses/{houseId}/members`
- User profiles: `users/{uid}` with `houseIds[]`
- Pending invites: `invites/{inviteId}`
- Storage: `houses/{houseId}/photos/{timestamp}.{ext}`
- Firestore rules: `isMember` / `isOwner` helper functions
- Deploy: GitHub Actions → Firebase Hosting on push to `main`

## Completed Features
- F1 Google Sign-In
- F2 First-run house creation + one-time migration (deletes placeholder data, writes 69 real items for 158 N Edge Cliff St)
- F3 Inventory data grid
- F4 Manual CRUD with room combobox (select existing or type new room)
- F6 Live search + room filter
- F7 Missing prices filter
- F8 Financial analytics dashboard
- F9 CSV export
- F11 Firestore real-time persistence (house-scoped)
- F13 Photo gallery + item linking
- F14 House management (create, switch, edit address, profile modal)
- F15 House sharing (invite by email, pending invites, accept/decline)
- Multi-select deletion (checkbox per row, Select All, bulk delete with confirmation)

## Rooms for 158 N Edge Cliff St
Laundry Room, Kids Room, Guest Room, Flex Room, Master Bed, Loft,
Living Room, Dining Room, Kitchen, Garage, Backyard, Front Yard, Front Porch

## Known Issues / Pending
- Firestore + Storage rules deploy in CI failing: service account needs
  "Service Usage Consumer" IAM role (GCP Console → IAM → firebase-adminsdk).
  Until added, **manually publish Firestore rules in Firebase Console** before
  first sign-in so initFirstHouse can create the houses/ collection.
  See docs/MANUAL_STEPS.md step 10.
- AI document scanning (Gemini) has been removed from the app. The app is now manual CRUD plus photo upload only.

## Next Immediate Step
- Publish Firestore rules in Firebase Console (paste firestore.rules content → Publish)
- Refresh app → migration runs → 69 real items appear
