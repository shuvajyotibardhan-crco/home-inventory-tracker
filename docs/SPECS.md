# Home Inventory Tracker — Specs

## Data Models

### House (Firestore document — `houses/{houseId}`)
```
{
  id: string          // Firestore auto-generated doc ID
  name: string        // Display name (e.g. "My Home")
  address: string     // Street address (may be empty string)
  ownerId: string     // UID of the user who created the house
  createdAt: Timestamp
}
```

### HouseMember (Firestore document — `houses/{houseId}/members/{uid}`)
```
{
  uid: string         // Firebase Auth UID (same as doc ID)
  role: "owner" | "member"
  displayName: string
  email: string
  joinedAt: Timestamp
}
```

### Invite (Firestore document — `invites/{inviteId}`)
```
{
  id: string          // Firestore auto-generated doc ID
  inviterUid: string  // UID of the user who sent the invite
  houseId: string     // Target house ID
  houseName: string   // Display name of the house (denormalised for UI)
  inviteeEmail: string  // Email address the invite was sent to
  createdAt: Timestamp
}
```

### UserProfile (Firestore document — `users/{uid}`)
```
{
  email: string
  displayName: string
  photoURL: string
  houseIds: string[]  // Array of house IDs the user belongs to
  updatedAt: Timestamp
}
```

### InventoryItem (Firestore document — `houses/{houseId}/items/{itemId}`)
```
{
  id: string          // Firestore auto-generated doc ID
  room: string        // One of the 14 defined rooms
  name: string        // Item name, non-empty
  value: number|null  // Estimated value in USD, null if unknown
  photoUrls: string[]  // Firebase Storage download URLs, [] if no photos attached
  photoUrl: string|null  // LEGACY single-photo field, kept for items written before the multi-photo change; read as a 1-element fallback via getItemPhotos() when photoUrls is absent
  createdAt: Timestamp   // Firestore server timestamp, set on create
  updatedAt: Timestamp   // Firestore server timestamp, set on update
}
```

### Photo (Firestore document — `houses/{houseId}/photos/{photoId}`)
```
{
  id: string          // Firestore auto-generated doc ID
  url: string         // Firebase Storage download URL, full-resolution original
  thumbUrl: string     // Firebase Storage download URL, downscaled (max 400px) JPEG for grid views;
                        // equal to `url` when client-side thumbnail generation fails (e.g. undecodable HEIC)
  name: string        // Original filename (e.g. "living-room.jpg")
  uploadedAt: Timestamp  // Firestore server timestamp, set on upload
}
```

### RoomStat (derived — computed in useMemo, never stored)
```
{
  room: string
  total: number       // Sum of all non-null values in this room
  count: number       // Total item count in this room
  pct: number         // total / grandTotal * 100
}
```

### DashboardStats (derived — computed in useMemo)
```
{
  totalValue: number    // Sum of all non-null item values
  totalCount: number    // Total item count
  valuedCount: number   // Items where value !== null
  pendingCount: number  // Items where value === null
}
```

---

## Storage Schema

### Firestore
```
users/
  {uid}/                  ← UserProfile (email, displayName, houseIds[])
    items/                ← LEGACY — migrated users only; read during initFirstHouse
    photos/               ← LEGACY — migrated users only

houses/
  {houseId}/              ← House (name, address, ownerId)
    members/
      {uid}/              ← HouseMember (role, displayName, email)
    items/
      {itemId}/           ← InventoryItem
    photos/
      {photoId}/          ← Photo (gallery metadata)

invites/
  {inviteId}/             ← Invite (inviterUid, houseId, inviteeEmail)
```

Security rules use `isMember(houseId)` and `isOwner(houseId)` helper functions (see Security Rules section). User profiles are world-readable to signed-in users (needed for invite email lookup).

### Firebase Storage
```
houses/
  {houseId}/
    photos/
      {timestamp}.{ext}     ← full-resolution original (membership checked via Firestore)
      thumbs/
        {timestamp}.jpg     ← downscaled (max 400px) JPEG thumbnail for grid views

users/
  {uid}/
    photos/
      {allPaths}          ← LEGACY migrated photos (UID-scoped, read-only for backwards compat)
```

Max file size enforced client-side at 10 MB.

---

## Defined Rooms (default list for 158 N Edge Cliff St — used in dropdowns)
```
Laundry Room | Kids Room | Guest Room | Flex Room | Master Bed |
Loft | Living Room | Dining Room | Kitchen | Garage |
Backyard | Front Yard | Front Porch
```
13 rooms. The room dropdown also accepts free-text input so users can add rooms not in this list.

---

## Algorithms

### initFirstHouse (first sign-in migration/creation)
```
async function initFirstHouse(u):
  if initRan.current: return
  initRan.current = true
  set seeding = true
  oldItemsSnap = await getDocs(collection(db, "users", u.uid, "items"))
  oldPhotosSnap = await getDocs(collection(db, "users", u.uid, "photos"))
  hasOldData = !oldItemsSnap.empty
  houseRef = await addDoc(collection(db, "houses"), {
    name: "My Home",
    address: hasOldData ? "<configured address>" : "",
    ownerId: u.uid,
    createdAt: serverTimestamp()
  })
  houseId = houseRef.id
  await setDoc(doc(db, "houses", houseId, "members", u.uid), {
    uid: u.uid, role: "owner", displayName: u.displayName,
    email: u.email, joinedAt: serverTimestamp()
  })
  if hasOldData:
    // Delete incorrect placeholder data from old path
    deleteBatch = writeBatch(db)
    for snap in oldItemsSnap.docs: deleteBatch.delete(snap.ref)
    await deleteBatch.commit()
    // Write real inventory (MIGRATION_ITEMS — 69 items for 158 N Edge Cliff St)
    seedBatch = writeBatch(db)
    for item in MIGRATION_ITEMS:
      ref = doc(collection(db, "houses", houseId, "items"))
      seedBatch.set(ref, { ...item, photoUrl: null, createdAt: serverTimestamp() })
    await seedBatch.commit()
    // Migrate any existing photo metadata
    if !oldPhotosSnap.empty:
      photoBatch = writeBatch(db)
      for snap in oldPhotosSnap.docs:
        photoBatch.set(doc(collection(db, "houses", houseId, "photos")), snap.data())
        photoBatch.delete(snap.ref)
      await photoBatch.commit()
  // else: new user — empty house, no items written
  await updateDoc(doc(db, "users", u.uid), { houseIds: arrayUnion(houseId) })
  setActiveHouseId(houseId)
  set seeding = false
```

### createHouse
```
async function createHouse(name, address, u):
  houseRef = await addDoc(collection(db, "houses"), {
    name, address, ownerId: u.uid, createdAt: serverTimestamp()
  })
  houseId = houseRef.id
  await setDoc(doc(db, "houses", houseId, "members", u.uid), {
    uid: u.uid, role: "owner", displayName: u.displayName,
    email: u.email, joinedAt: serverTimestamp()
  })
  await updateDoc(doc(db, "users", u.uid), { houseIds: arrayUnion(houseId) })
  setActiveHouseId(houseId)
  // New house starts empty — no seeding
```

### sendInvite
```
async function sendInvite(email, houseId, houseName, u):
  // Check if the invitee already has an account
  q = query(collection(db, "users"), where("email", "==", email))
  snap = await getDocs(q)
  if snap.empty:
    await addDoc(collection(db, "invites"), {
      inviterUid: u.uid, houseId, houseName, inviteeEmail: email, createdAt: serverTimestamp()
    })
  else:
    invitee = snap.docs[0]
    await setDoc(doc(db, "houses", houseId, "members", invitee.id), {
      uid: invitee.id, role: "member", displayName: invitee.data().displayName,
      email: invitee.data().email, joinedAt: serverTimestamp()
    })
    await updateDoc(doc(db, "users", invitee.id), { houseIds: arrayUnion(houseId) })
```

### acceptInvite
```
async function acceptInvite(invite, u):
  await setDoc(doc(db, "houses", invite.houseId, "members", u.uid), {
    uid: u.uid, role: "member", displayName: u.displayName,
    email: u.email, joinedAt: serverTimestamp()
  })
  await updateDoc(doc(db, "users", u.uid), { houseIds: arrayUnion(invite.houseId) })
  await deleteDoc(doc(db, "invites", invite.id))
```

### declineInvite
```
async function declineInvite(invite):
  await deleteDoc(doc(db, "invites", invite.id))
```

### Photo Upload (to gallery)
```
async function createThumbnailBlob(file, maxDimension = 400):
  try:
    bitmap = await createImageBitmap(file)
    scale = min(1, maxDimension / max(bitmap.width, bitmap.height))
    canvas = new canvas sized (bitmap.width * scale, bitmap.height * scale)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return await canvas.toBlob('image/jpeg', quality=0.75)
  catch:
    return null  // undecodable source (e.g. some HEIC files) — caller falls back to the original

async function uploadPhoto(file, activeHouseId):
  if file.size > 10_485_760: show error; return null
  timestamp = Date.now()
  filename = `${timestamp}.${ext}`
  // Path is keyed by activeHouseId — Storage rules gate read/write to house members only,
  // so this file can never be reached from a different house's gallery or picker.
  storageRef = ref(storage, `houses/${activeHouseId}/photos/${filename}`)
  uploadTask = uploadBytesResumable(storageRef, file)
  uploadTask.on('state_changed',
    snapshot => set uploadProgress = (bytes / total) * 100
  )
  await uploadTask
  url = await getDownloadURL(storageRef)

  thumbUrl = url
  thumbBlob = await createThumbnailBlob(file)
  if thumbBlob:
    thumbRef = ref(storage, `houses/${activeHouseId}/photos/thumbs/${timestamp}.jpg`)
    await uploadBytesResumable(thumbRef, thumbBlob)
    thumbUrl = await getDownloadURL(thumbRef)

  await addDoc(collection(db, "houses", activeHouseId, "photos"), {
    url, thumbUrl, name: file.name, uploadedAt: serverTimestamp()
  })
  set uploadProgress = null
  return url
```

### Bulk Delete
```
async function handleBulkDelete(selectedItemIds, activeHouseId):
  batch = writeBatch(db)
  for id in selectedItemIds:
    batch.delete(doc(db, "houses", activeHouseId, "items", id))
  await batch.commit()
  setSelectedItemIds(new Set())
  setConfirmBulkDelete(false)
```

### allRooms (useMemo)
```
allRooms = [
  ...ROOMS,
  ...new Set(items.map(i => i.room).filter(r => !ROOMS.includes(r)))
]
```
Combines the predefined room list with any custom rooms the user has added. Used as the `<datalist>` source in the Add/Edit item form.

### Add Photo to Items (multi-photo)
```
function getItemPhotos(item):
  return item.photoUrls ?? (item.photoUrl ? [item.photoUrl] : [])

async function handleLinkPhoto(photoUrl, itemIds, activeHouseId):
  batch = writeBatch(db)
  for itemId in itemIds:
    batch.update(doc(db, "houses", activeHouseId, "items", itemId), { photoUrls: arrayUnion(photoUrl) })
  await batch.commit()
  // Picker modal is left open — arrayUnion is idempotent, so re-clicking an
  // already-added photo is a harmless no-op and the user can add several in one pass
```

### Remove Photo from Item
```
async function handleRemovePhotoFromItem(itemId, url, activeHouseId):
  await updateDoc(doc(db, "houses", activeHouseId, "items", itemId), { photoUrls: arrayRemove(url) })
  // Only this URL is removed — other photos on the item and the gallery record are untouched
```

### Delete Photo (from gallery, with reference cleanup)
```
async function handleDeletePhoto(photoId, url, activeHouseId):
  await deleteDoc(doc(db, "houses", activeHouseId, "photos", photoId))
  linkedItems = await getDocs(query(
    collection(db, "houses", activeHouseId, "items"),
    where("photoUrls", "array-contains", url)
  ))
  if linkedItems not empty:
    batch = writeBatch(db)
    for item in linkedItems.docs:
      batch.update(item.ref, { photoUrls: arrayRemove(url) })
    await batch.commit()
```

### CSV Export
```
function exportCSV(items):
  header = ["Room", "Item Name", "Estimated Value", "Photo URLs"]
  rows = items.map(i => [
    i.room,
    i.name,
    i.value ?? "",
    getItemPhotos(i).join("; ")
  ])
  csv = [header, ...rows].map(r => r.map(cell => `"${cell}"`).join(",")).join("\n")
  blob = new Blob([csv], { type: "text/csv" })
  a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `home-inventory-${today}.csv`
  a.click()
```

### Filtered Items (useMemo)
```
filteredItems = items
  .filter(i => missingPriceOnly ? i.value === null : true)
  .filter(i => roomFilter === "All Rooms" ? true : i.room === roomFilter)
  .filter(i => searchText === "" ? true :
    i.name.toLowerCase().includes(searchText.toLowerCase()) ||
    i.room.toLowerCase().includes(searchText.toLowerCase())
  )
```

---

## Configuration

| Variable | Source | Description |
|----------|--------|-------------|
| `VITE_FIREBASE_API_KEY` | `.env` | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `.env` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | `.env` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `.env` | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `.env` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | `.env` | Firebase app ID |

---

## File Inventory

```
Home Inventory Tracker/
├── CLAUDE.md                     # Project context for future Claude sessions
├── README.md                     # Setup and feature overview
├── .gitignore                    # Excludes node_modules, dist, .env, .DS_Store
├── .env.example                  # Placeholder env vars
├── .env                          # Local secrets (never committed)
├── progress.md                   # Session-level task tracking
├── docs/MANUAL_STEPS.md          # One-time manual setup steps (IAM, secrets)
├── package.json                  # Vite + React + Firebase + Tailwind deps
├── vite.config.js                # Vite config (React plugin)
├── tailwind.config.js            # Tailwind content paths
├── postcss.config.js             # Tailwind/PostCSS integration
├── index.html                    # Vite entry point
├── firebase.json                 # Hosting (dist), Firestore, Storage config
├── .firebaserc                   # Default Firebase project alias
├── firestore.rules               # Per-user read/write security rules
├── firestore.indexes.json        # Empty indexes (none needed)
├── storage.rules                 # UID-scoped storage security rules
├── src/
│   ├── main.jsx                  # React root render
│   └── App.jsx                   # Entire application (auth, UI, logic)
├── docs/
│   ├── PLAN.md
│   ├── REQUIREMENTS.md
│   ├── DESIGN.md
│   ├── SPECS.md
│   ├── TASKS.md
│   ├── architecture.drawio
│   └── architecture.svg
└── .github/
    └── workflows/
        └── deploy.yml            # Build + deploy to Firebase Hosting on push to main
```

---

## Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isMember(houseId) {
      return request.auth != null &&
        exists(/databases/$(database)/documents/houses/$(houseId)/members/$(request.auth.uid));
    }

    function isOwner(houseId) {
      return request.auth != null &&
        get(/databases/$(database)/documents/houses/$(houseId)/members/$(request.auth.uid)).data.role == 'owner';
    }

    // User profiles — any signed-in user can read (needed for invite email lookup)
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }

    // Legacy subcollections — migration path reads old items/photos
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // Pending invitations
    match /invites/{inviteId} {
      allow read, list: if request.auth != null;
      allow create: if request.auth != null;
      allow delete: if request.auth != null && (
        resource.data.inviteeEmail == request.auth.token.email ||
        resource.data.inviterUid == request.auth.uid
      );
    }

    // Houses
    match /houses/{houseId} {
      allow read: if isMember(houseId);
      allow create: if request.auth != null;
      allow update, delete: if isOwner(houseId);

      match /members/{memberId} {
        allow read: if isMember(houseId);
        allow create, update: if isOwner(houseId) || request.auth.uid == memberId;
        allow delete: if isOwner(houseId) || request.auth.uid == memberId;
      }

      match /items/{itemId} { allow read, write: if isMember(houseId); }
      match /photos/{photoId} { allow read, write: if isMember(houseId); }
    }
  }
}
```

## Firebase Storage Security Rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // House-scoped photos — membership verified via Firestore.
    // {allPaths=**} covers both the original file and the derived thumbs/ subfolder.
    match /houses/{houseId}/photos/{allPaths=**} {
      allow read, write: if request.auth != null &&
        firestore.exists(/databases/(default)/documents/houses/$(houseId)/members/$(request.auth.uid));
    }
    // Legacy user-scoped photos — backwards compat for migrated photo URLs
    match /users/{uid}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

---

## Browser Compatibility

| Feature | Minimum requirement |
|---------|-------------------|
| ES2020 (optional chaining, nullish coalescing) | Chrome 80+, Firefox 74+, Safari 13.1+ |
| `FileReader` API (base64 encoding) | All modern browsers |
| `URL.createObjectURL` (CSV download) | All modern browsers |
| Camera capture (`capture="environment"`) | Chrome for Android, Safari for iOS |
| Firebase SDK v10 (ESM) | Requires bundler (Vite handles this) |

---

## Security Notes

- Firestore rules use `isMember(houseId)` and `isOwner(houseId)` helpers that verify membership via a Firestore `exists()`/`get()` call inside the rule expression. No user can access another house's data unless explicitly added as a member.
- The `invites` collection is readable by all signed-in users so the app can query by `inviteeEmail`. The delete rule limits who can remove an invite to the invitee or the inviter.
- User profile documents (`users/{uid}`) are readable by all signed-in users. This is intentional — `sendInvite` must look up invitees by email. Only the owner can write their own profile doc.
- Storage rules for house-scoped photos call `firestore.exists()` to verify membership — this cross-service check ensures photo access and Firestore membership stay in sync.
- Photo isolation between houses is enforced at three layers: (1) Storage paths are keyed by `houseId` and the Storage rule only grants access to members of that house; (2) the Firestore `photos` and `items` subcollections live under `houses/{houseId}` and are gated by `isMember(houseId)`; (3) the client's photo picker only ever lists `photos` from the currently active house's `onSnapshot` listener, so no UI path can surface or attach another house's photo URL to an item.
- `.env` is in `.gitignore` — credentials are never committed.
- Photo files remain in Storage when removed from an item's `photoUrls` array (no cascading delete). Deleting a photo from the gallery does strip it from every item's `photoUrls` (via an `array-contains` query + batch update) so thumbnails never point at a missing file. Storage costs remain negligible for personal use.
- The Firebase service account used in CI must have the "Service Usage Consumer" IAM role to deploy Firestore and Storage rules — see `docs/MANUAL_STEPS.md` step 10.
