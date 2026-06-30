# Home Inventory Tracker — Requirements

## Overview

A premium single-page home asset and inventory management app for homeowners who want a clear financial picture of their household items. Users sign in with Google, view and manage inventory across 14 named rooms, scan paper lists with AI, and export data as CSV. All data is stored in Firestore, scoped to the signed-in user.

## Scope

**In scope:**
- Google Sign-In via Firebase Auth
- Full CRUD inventory management
- AI-powered document scanning (Gemini 2.5 Flash)
- Filtering, search, and analytics dashboard
- CSV export and data reset
- Firestore persistence with real-time sync
- First-run data seeding

**Out of scope:**
- Multi-user sharing or collaboration
- Photo attachments for items
- Push notifications
- Native mobile app (web only)

---

## Feature 1 — Google Sign-In

**User story:** As a homeowner, I want to sign in with my Google account so that my inventory is tied to my identity and accessible from any device.

**Acceptance Criteria:**
1. The app shall display a full-screen sign-in page when no authenticated user is detected.
2. The sign-in page shall show a "Sign in with Google" button using the Firebase Auth Google provider.
3. The app shall redirect the user to the main inventory view immediately after successful authentication.
4. The app shall display the signed-in user's name and profile photo in the header.
5. The header shall include a "Sign Out" button that clears the auth session and returns to the sign-in page.
6. The app must not display any inventory data to unauthenticated users.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Open the app without being signed in | Sign-in page displays with Google button |
| Click "Sign in with Google" | Google OAuth popup opens |
| Complete Google authentication | Redirected to inventory view; user name + photo visible in header |
| Click "Sign Out" | Returned to sign-in page; inventory hidden |
| Refresh the browser while signed in | App reloads straight to inventory (auth persisted) |

---

## Feature 2 — Pre-Populated Default Dataset

**User story:** As a new user, I want the app to start with a realistic sample dataset so that I can immediately see what the app looks like in use.

**Acceptance Criteria:**
1. The app shall seed the following 14 rooms and 72 items into a new user's Firestore on first sign-in: Laundry Room, Kids Room, Guest Room, Flex Room, Master Bed, Loft, Living Room, Dining Room, Kitchen, Garage, Backyard, Front Yard, Front Porch.
2. Each seeded item shall include a room name, item name, and estimated value (or `null` if unpriced).
3. The seeding shall use a Firestore batch write for atomicity.
4. A loading indicator shall be displayed while seeding is in progress.
5. The app must not re-seed if items already exist in the user's Firestore collection.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Sign in as a brand-new user | Loading indicator appears briefly, then 72 items visible across 14 rooms |
| Sign out and sign back in | No re-seed; same items visible (including any edits made) |
| Use "Reset to Defaults" then sign out/in | Items restored to original dataset |

---

## Feature 3 — Inventory Data Grid

**User story:** As a user, I want to see all my items in a clean, scannable list so that I can quickly find and assess any item.

**Acceptance Criteria:**
1. The grid shall display each item's room, name, and estimated value (or a "No Price" badge if null).
2. Unpriced items shall have a soft amber background (`bg-amber-50`) to draw attention.
3. Each row shall show Edit and Delete action buttons.
4. The grid shall update in real time when Firestore data changes.
5. The grid shall be responsive and readable on both desktop and mobile viewports.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Load app with items in Firestore | All items visible in grid with room, name, value |
| Identify an unpriced item | Row has amber background; "No Price" badge shown |
| Add an item in another browser tab | Grid updates without page refresh |

---

## Feature 4 — Manual CRUD

**User story:** As a user, I want to add, edit, and delete inventory items manually so that I can keep my records accurate over time.

**Acceptance Criteria:**
1. An "Add Item" button shall open a modal form with fields: item name (text), room (dropdown from the 14 defined rooms), and estimated value (number, optional).
2. The form shall validate that item name is not empty before saving.
3. Submitting the add form shall write the new item to Firestore and close the modal.
4. Each grid row's Edit button shall open a pre-filled modal allowing the user to change name, room, or value.
5. Saving edits shall update the Firestore document and close the modal.
6. Each grid row's Delete button shall open a confirmation modal asking the user to confirm before deletion.
7. Confirming deletion shall remove the item from Firestore permanently.
8. All modals shall be dismissible via a close button or pressing Escape.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Click "Add Item", fill form, submit | New item appears in grid; Firestore document created |
| Click "Add Item", leave name empty, submit | Validation error shown; item not saved |
| Click Edit on a row, change the room, save | Row updates with new room |
| Click Delete on a row, cancel in confirmation | Item remains in grid |
| Click Delete on a row, confirm | Item removed from grid and Firestore |

---

## Feature 5 — AI Document Scan

**User story:** As a user, I want to photograph a handwritten or printed item list and have the app extract the items automatically so that I don't have to type everything manually.

**Acceptance Criteria:**
1. A "Scan Paper List" button shall open a file input accepting images and supporting live camera capture on mobile.
2. The app shall convert the selected image to base64 and send it to the Gemini 2.5 Flash API endpoint with the configured API key.
3. The Gemini request shall include a JSON schema in `generationConfig` specifying the output as an array of `{ room: string, item: string, value: number | null }` objects.
4. The app shall implement exponential backoff retrying up to 5 times (delays: 1s, 2s, 4s, 8s, 16s) on network or API errors.
5. A review modal shall display the extracted items before any data is saved, showing room, item name, and value fields that are all editable.
6. The user shall be able to delete individual extracted items from the review list before merging.
7. Clicking "Merge into Inventory" shall write all reviewed items to Firestore and close the modal.
8. If the API call fails after all retries, the app shall display a clear error message.
9. If the Gemini API key is empty, the app shall prompt the user to enter it before scanning.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Click "Scan Paper List", select a photo of a written list | Spinner shown while API processes |
| API responds successfully | Review modal opens with extracted items |
| Edit a room in the review modal | Room field updates inline |
| Delete one extracted item in the review modal | Item removed from the review list only |
| Click "Merge into Inventory" | All remaining reviewed items added to Firestore and grid |
| Disconnect network, attempt scan | App retries 5 times then shows error message |
| API key is empty | Prompt shown to enter the key before scanning |

---

## Feature 6 — Live Search and Room Filter

**User story:** As a user, I want to search and filter my inventory so that I can quickly find specific items or focus on one room.

**Acceptance Criteria:**
1. A search input shall filter the grid in real time to show only items whose name or room contains the search text (case-insensitive).
2. A room dropdown shall filter the grid to show only items in the selected room; the default value shall be "All Rooms".
3. Search and room filter shall work together (both applied simultaneously).
4. Clearing the search field and resetting the dropdown to "All Rooms" shall restore the full grid.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Type "sofa" in search | Only rows containing "sofa" in name or room shown |
| Select "Kitchen" from room dropdown | Only Kitchen items shown |
| Type "blender" with "Kitchen" room selected | Only Kitchen items matching "blender" shown |
| Clear search and set room to "All Rooms" | Full inventory grid restored |

---

## Feature 7 — Missing Prices Filter

**User story:** As a user, I want to filter for items with no price so that I can prioritise filling in missing values.

**Acceptance Criteria:**
1. A "Show missing prices only" checkbox shall filter the grid to display only items where value is `null`.
2. The checkbox filter shall combine with any active search text and room filter.
3. Unchecking the checkbox shall restore the previous filter state.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Check "Show missing prices only" | Grid shows only unpriced items |
| Check the box with "Kitchen" room also selected | Only unpriced Kitchen items shown |
| Uncheck the box | Grid returns to previous filtered/full state |

---

## Feature 8 — Financial Analytics Dashboard

**User story:** As a user, I want to see a financial summary of my inventory so that I understand the total value of my assets and where the bulk of it sits.

**Acceptance Criteria:**
1. The dashboard shall display four summary cards: Total Value, Total Item Count, Valued Items count, and Pending Prices count.
2. Total Value shall sum only items with a non-null value and display in USD format (e.g. `$142,500`).
3. A per-room value bar chart shall display one row per room showing the room name, total value for that room, and its percentage of the overall total.
4. Bar width shall be proportional to the room's share of total inventory value.
5. The dashboard shall update in real time as items are added, edited, or deleted.
6. Rooms with zero total value shall still appear in the chart with a zero bar if they contain items.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Load app with default dataset | Dashboard shows correct totals matching sum of seeded values |
| Add a new item with value $500 | Total Value and Item Count update immediately |
| Edit an item's value | Dashboard recalculates in real time |
| Delete a priced item | Dashboard totals decrease accordingly |

---

## Feature 9 — CSV Export

**User story:** As a user, I want to export my inventory to a CSV file so that I can use the data in a spreadsheet or share it with an insurance provider.

**Acceptance Criteria:**
1. An "Export CSV" button shall generate a CSV file containing all current inventory items (not filtered — the full dataset).
2. The CSV shall include columns: Room, Item Name, Estimated Value, Photo URL.
3. The file shall be named `home-inventory-[YYYY-MM-DD].csv` using the current date.
4. Clicking the button shall trigger an immediate browser download with no confirmation step needed.
5. Values that are `null` shall appear as an empty cell in the CSV.
6. Items with no photo shall have an empty Photo URL cell in the CSV.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Click "Export CSV" | Browser downloads a .csv file |
| Open the CSV in a spreadsheet app | All items present with Room, Item Name, Estimated Value, Photo URL columns |
| Verify null-value items | Corresponding Value cell is empty |
| Verify items with no photo | Photo URL cell is empty |
| Verify items with a photo | Photo URL cell contains the Firebase Storage download URL |
| Check filename | Named `home-inventory-YYYY-MM-DD.csv` with today's date |

---

## Feature 10 — Reset to Defaults

**User story:** As a user, I want to reset my inventory to the original default dataset so that I can start fresh if my data becomes messy.

**Acceptance Criteria:**
1. A "Reset to Defaults" button shall open a confirmation modal warning the user that all current items will be deleted and replaced.
2. Confirming the reset shall delete all items in the user's Firestore collection and re-seed the 72 default items.
3. A loading indicator shall be displayed during the reset and re-seed operation.
4. Cancelling the confirmation modal shall leave all data unchanged.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Click "Reset to Defaults", then cancel | No data changed |
| Click "Reset to Defaults", then confirm | Loading shown; all items replaced with original 72 dataset |
| Check Firestore after reset | Old custom items gone; default items present |

---

## Feature 11 — Firestore Persistence

**User story:** As a user, I want my inventory to be saved to the cloud so that it's available on any device I sign into.

**Acceptance Criteria:**
1. All item writes (create, update, delete) shall be persisted to Firestore immediately.
2. The app shall use a real-time `onSnapshot` listener on `users/{uid}/items` to keep the UI in sync with Firestore.
3. Firestore security rules must enforce that users can only read and write documents under their own UID path.
4. The app shall display a loading state while the initial Firestore data is being fetched.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Add an item on Device A | Item appears on Device B without reload |
| Open Firestore Console and inspect data | Items stored at `users/{uid}/items/{itemId}` |
| Attempt to access another user's data via Firestore REST | Request denied by security rules |

---

## Feature 12 — Initial Data Seeding

**User story:** As a new user, I want the app to automatically populate a realistic default dataset so that the app is immediately useful and I can see how it works.

**Acceptance Criteria:**
1. On first sign-in, the app shall check whether the user's `users/{uid}/items` collection is empty.
2. If empty, the app shall batch-write all 72 default items to Firestore before showing the inventory view.
3. The seed data shall exactly match the dataset specified in the project brief (14 rooms, 72 items, with correct values and nulls).
4. A full-screen loading overlay shall be shown during seeding with a "Setting up your inventory…" message.
5. The app must not seed data if items already exist, regardless of how many items there are.
6. The "Reset to Defaults" action (F10) shall use the same seed dataset and logic as the first-run seed.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Sign in as a new user | Loading overlay shows "Setting up your inventory…"; then full grid appears |
| Sign out and sign back in | No re-seed; existing items shown |
| Add 5 items, sign out, sign back in | No re-seed; all items (original + added) shown |
| Use "Reset to Defaults" | Original 72 items restored exactly |

---

## Feature 13 — Photo Gallery and Item Linking

**User story:** As a user, I want to upload photos to a central gallery and link them to inventory items so that I have a visual record of my assets for insurance or reference purposes.

**Acceptance Criteria:**
1. A dedicated "Photos" tab shall display a drag-and-drop upload zone accepting multiple image files at once (JPEG, PNG, WEBP, HEIC).
2. Uploaded photos shall be stored in Firebase Storage at `users/{uid}/photos/{timestamp}.{ext}` and their metadata (URL, filename, upload timestamp) shall be saved to the `users/{uid}/photos` Firestore collection.
3. The Photos tab shall display all uploaded photos in a responsive grid, showing a thumbnail, filename, and count of items currently linked to each photo.
4. Each photo in the gallery shall have a delete button that removes the metadata document from Firestore (the Storage file and any existing `photoUrl` links on items are left unchanged).
5. Each item row in the inventory grid shall display a "Link" button if no photo is linked, or a thumbnail if a photo is already linked.
6. Clicking "Link" on an item row shall open a photo picker modal showing all gallery photos; clicking a photo in the picker shall set that photo's URL as the item's `photoUrl`.
7. The user shall be able to select multiple items via checkboxes and click "Link Photo to X selected" to link one gallery photo to all selected items at once.
8. The photo picker modal shall include an "Upload new photo" option that uploads directly and links the result to the target item(s).
9. Clicking a thumbnail in the inventory grid shall open a full-size viewer modal with options to change or unlink the photo.
10. Unlinking a photo shall set the item's `photoUrl` to `null`; the photo remains in the gallery.
11. An upload progress bar shall be shown at the top of the page while a file is being uploaded.
12. The app must not allow uploads larger than 10 MB; it shall display an error if the file exceeds this limit.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Navigate to Photos tab | Upload zone and (initially empty) gallery shown |
| Drag two images onto the upload zone | Both upload sequentially; progress bar visible; thumbnails appear in gallery |
| Click the upload zone and select a file | File uploads; thumbnail added to gallery |
| Check gallery card for a photo linked to 2 items | Card shows "2 items linked" |
| Click "Link" on an item with no photo | Photo picker modal opens showing gallery thumbnails |
| Click a photo in the picker | Modal closes; thumbnail appears on the item row |
| Select 3 items via checkboxes, click "Link Photo to 3 selected" | Picker opens; clicking a photo links it to all 3 rows |
| Click a thumbnail in inventory grid | Full-size viewer modal opens |
| Click "Unlink photo" in viewer | Thumbnail gone from row; `photoUrl` null in Firestore; photo still in gallery |
| Attempt to upload a file over 10 MB | Error message shown; no upload attempted |
