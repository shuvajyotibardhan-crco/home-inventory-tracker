# Home Inventory Tracker — Specs

## Data Models

### InventoryItem (Firestore document)
```
{
  id: string          // Firestore auto-generated doc ID
  room: string        // One of the 14 defined rooms
  name: string        // Item name, non-empty
  value: number|null  // Estimated value in USD, null if unknown
  photoUrl: string|null  // Firebase Storage download URL, null if no photo linked
  createdAt: Timestamp   // Firestore server timestamp, set on create
  updatedAt: Timestamp   // Firestore server timestamp, set on update
}
```

### Photo (Firestore document — `users/{uid}/photos/{photoId}`)
```
{
  id: string          // Firestore auto-generated doc ID
  url: string         // Firebase Storage download URL
  name: string        // Original filename (e.g. "living-room.jpg")
  uploadedAt: Timestamp  // Firestore server timestamp, set on upload
}
```

### ScannedItem (transient — review modal state only, never persisted directly)
```
{
  room: string        // Parsed from Gemini response
  name: string        // Parsed item name
  value: number|null  // Parsed value or null
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
  {uid}/
    items/
      {itemId}/     ← one document per InventoryItem
    photos/
      {photoId}/    ← one document per uploaded Photo (gallery metadata)
```

Security rules enforce `request.auth.uid == uid` for all reads and writes.

### Firebase Storage
```
users/
  {uid}/
    photos/
      {timestamp}.{ext}
```

Security rules enforce `request.auth.uid == uid`. Max file size enforced client-side at 10 MB.

---

## Defined Rooms (canonical list — used in dropdowns and seeding)
```
Living Room | Kitchen | Master Bedroom | Bedroom 2 | Bedroom 3 |
Bathroom | En-suite | Dining Room | Study / Office | Garage |
Utility Room | Loft / Attic | Garden / Shed | Hallway
```
14 rooms total.

---

## Default Seed Dataset (72 items)

72 items spread across all 14 rooms. One item (`Christmas Decorations`) has a null value. All values are in USD.

| Room | Item | Value ($) |
|------|------|-----------|
| Living Room | Sofa (3-seater) | 1200 |
| Living Room | Coffee Table | 250 |
| Living Room | TV (65") | 900 |
| Living Room | TV Stand | 180 |
| Living Room | Bookcase | 150 |
| Living Room | Floor Lamp | 80 |
| Living Room | Rug | 200 |
| Living Room | Armchair | 450 |
| Living Room | Curtains | 120 |
| Living Room | Gaming Console | 500 |
| Kitchen | Refrigerator | 800 |
| Kitchen | Washing Machine | 600 |
| Kitchen | Dishwasher | 550 |
| Kitchen | Microwave | 120 |
| Kitchen | Toaster | 40 |
| Kitchen | Kettle | 35 |
| Kitchen | Coffee Machine | 180 |
| Kitchen | Air Fryer | 90 |
| Kitchen | Blender | 60 |
| Kitchen | Stand Mixer | 350 |
| Kitchen | Knife Set | 100 |
| Dining Room | Dining Table | 700 |
| Dining Room | Dining Chairs (×6) | 480 |
| Dining Room | Sideboard | 350 |
| Master Bedroom | King Bed Frame | 900 |
| Master Bedroom | King Mattress | 1100 |
| Master Bedroom | Wardrobe (2-door) | 600 |
| Master Bedroom | Chest of Drawers | 280 |
| Master Bedroom | Bedside Tables (×2) | 200 |
| Master Bedroom | Dressing Table | 220 |
| Master Bedroom | Full-length Mirror | 90 |
| Bedroom 2 | Double Bed Frame | 500 |
| Bedroom 2 | Double Mattress | 600 |
| Bedroom 2 | Single Wardrobe | 300 |
| Bedroom 2 | Chest of Drawers | 180 |
| Bedroom 3 | Single Bed Frame | 250 |
| Bedroom 3 | Single Mattress | 300 |
| Bedroom 3 | Wardrobe | 280 |
| Bedroom 3 | Desk | 150 |
| Bedroom 3 | Desk Chair | 120 |
| Bathroom | Shower Enclosure | 400 |
| Bathroom | Bathroom Cabinet | 100 |
| Bathroom | Towel Rail | 60 |
| Bathroom | Scales | 30 |
| En-suite | Electric Toothbrush | 80 |
| En-suite | Hair Dryer | 60 |
| En-suite | Straighteners | 90 |
| Study / Office | Desktop PC | 1200 |
| Study / Office | Monitor (27") | 350 |
| Study / Office | Office Desk | 300 |
| Study / Office | Office Chair | 400 |
| Study / Office | Printer | 150 |
| Study / Office | Bookcase | 120 |
| Study / Office | Shredder | 50 |
| Garage | Lawnmower | 280 |
| Garage | Power Drill Set | 120 |
| Garage | Workbench | 200 |
| Garage | Tool Cabinet | 180 |
| Garage | Bicycle (×2) | 700 |
| Garage | Pressure Washer | 180 |
| Utility Room | Tumble Dryer | 500 |
| Utility Room | Vacuum Cleaner | 250 |
| Utility Room | Iron + Ironing Board | 80 |
| Loft / Attic | Storage Shelving | 120 |
| Loft / Attic | Christmas Decorations | null |
| Loft / Attic | Suitcases (×3) | 300 |
| Garden / Shed | Garden Furniture Set | 450 |
| Garden / Shed | BBQ Grill | 200 |
| Garden / Shed | Garden Tools Set | 120 |
| Hallway | Coat Rack | 60 |
| Hallway | Hall Table | 120 |
| Hallway | Mirror | 80 |

---

## API Endpoints

### Gemini 2.5 Flash — Document Scan

**URL:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`

**Method:** POST

**Request body:**
```json
{
  "contents": [
    {
      "parts": [
        {
          "inlineData": { "mimeType": "<file.type>", "data": "<base64-image>" }
        },
        {
          "text": "Extract every item visible in this image. Return ONLY a JSON array with objects: {\"name\": string, \"room\": string (one of the 14 canonical rooms), \"value\": number|null}"
        }
      ]
    }
  ],
  "generationConfig": {
    "responseMimeType": "application/json"
  }
}
```

**Success response:** HTTP 200 — `candidates[0].content.parts[0].text` contains a JSON string matching the schema above.

**Error handling:** Non-200 responses trigger the retry loop. After 5 failures, surface an error message to the user.

---

## Algorithms

### Exponential Backoff (Gemini API calls)
```
async function callGeminiWithBackoff(requestBody):
  delays = [1000, 2000, 4000, 8000, 16000]
  for attempt in 0..4:
    try:
      response = await fetch(GEMINI_URL, { method: POST, body: requestBody })
      if response.ok:
        return await response.json()
      else:
        throw Error(response.status)
    catch error:
      if attempt == 4: throw error
      await sleep(delays[attempt])
```

### First-Run Seeding
```
async function seedDefaultData(uid):
  set seeding = true
  snapshot = await getDocs(collection(db, "users", uid, "items"))
  if snapshot.size > 0: return   // already seeded
  batch = writeBatch(db)
  for item in DEFAULT_ITEMS:
    ref = doc(collection(db, "users", uid, "items"))
    batch.set(ref, { ...item, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  await batch.commit()
  set seeding = false
```

### Reset to Defaults
```
async function resetToDefaults(uid):
  show confirmation modal
  on confirm:
    set seeding = true
    existing = await getDocs(collection(db, "users", uid, "items"))
    deleteBatch = writeBatch(db)
    for doc in existing.docs: deleteBatch.delete(doc.ref)
    await deleteBatch.commit()
    await seedDefaultData(uid)   // reuses seeding logic, size check skipped on reset path
    set seeding = false
```

### Photo Upload (to gallery)
```
async function uploadPhoto(file, itemIds = [], uid):
  if file.size > 10_485_760: show error; return null
  filename = `${Date.now()}.${ext}`
  storageRef = ref(storage, `users/${uid}/photos/${filename}`)
  uploadTask = uploadBytesResumable(storageRef, file)
  uploadTask.on('state_changed',
    snapshot => set uploadProgress = (bytes / total) * 100
  )
  await uploadTask
  url = await getDownloadURL(storageRef)
  // Save metadata to photos gallery collection
  await addDoc(collection(db, "users", uid, "photos"), { url, name: file.name, uploadedAt: serverTimestamp() })
  // Optionally link to specific items immediately
  for itemId in itemIds:
    await updateDoc(doc(db, "users", uid, "items", itemId), { photoUrl: url })
  set uploadProgress = null
  return url
```

### Link Photo to Items
```
async function handleLinkPhoto(photoUrl, itemIds, uid):
  for itemId in itemIds:
    await updateDoc(doc(db, "users", uid, "items", itemId), { photoUrl: url })
  close link modal
```

### Unlink Photo from Item
```
async function handleUnlinkPhoto(itemId, uid):
  await updateDoc(doc(db, "users", uid, "items", itemId), { photoUrl: null })
  // Photo file remains in Storage and gallery — no cascading delete
```

### CSV Export
```
function exportCSV(items):
  header = ["Room", "Item Name", "Estimated Value", "Photo URL"]
  rows = items.map(i => [
    i.room,
    i.name,
    i.value ?? "",
    i.photoUrl ?? ""
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
| `VITE_GEMINI_API_KEY` | `.env` | Gemini API key (falls back to empty string; user prompted in-app) |

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
    match /users/{uid}/items/{itemId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## Firebase Storage Security Rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{uid}/photos/{allPaths=**} {
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

- Firestore rules prevent any user from reading or writing another user's items — the UID in the path must match `request.auth.uid`.
- Storage rules apply the same UID check — users can only upload/read their own photos.
- The Gemini API key is injected at build time via `VITE_GEMINI_API_KEY`. It is visible in the built JS bundle. This is acceptable for a personal-use app; for production multi-tenant use, proxy calls through a Cloud Function.
- `.env` is in `.gitignore` — credentials are never committed.
- Photo files remain in Storage when `photoUrl` is cleared from Firestore (no cascading delete). For a personal-use app this is acceptable; Storage costs remain negligible.
