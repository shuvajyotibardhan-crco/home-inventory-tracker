# Home Inventory Tracker — Requirements

## Overview

A premium single-page home asset and inventory management app for homeowners who want a clear financial picture of their household items. Users sign in with Google, then manage one or more houses. Each house has its own inventory, and houses can be shared with other users by email. Inventory is managed across 14 named rooms per house. Photo uploads, CSV export, and a financial analytics dashboard round out the feature set. All data lives in Firestore, scoped to houses rather than individual users.

## Scope

**In scope:**
- Google Sign-In via Firebase Auth
- Full CRUD inventory management per house
- Multi-house management (create, switch, edit address)
- House sharing — invite collaborators by email; pending invite flow for unregistered users
- Filtering, search, and analytics dashboard
- CSV export
- Firestore persistence with real-time sync
- Silent one-time migration of legacy data for the original user

**Out of scope:**
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

## Feature 2 — First-Run House Creation and Legacy Migration

**User story:** As a user signing in for the first time after the multi-house upgrade, I want my existing inventory to be carried over automatically so that I don't lose any data.

**Acceptance Criteria:**
1. On first sign-in, if the user has no `houseIds` in their profile, the app shall automatically create their first house with no prompt.
2. If the user has existing items at the legacy `users/{uid}/items` path, the app shall delete them and write the correct `MIGRATION_ITEMS` inventory (69 real items for 158 N Edge Cliff St, Castle Rock, CO 80104) into `houses/{houseId}/items`. This migration must run exactly once.
3. The migration must use a Firestore batch write for atomicity on each collection (items, then photos).
4. A full-screen loading overlay shall be shown during migration with a "Setting up your home…" message.
5. New users with no legacy data shall receive an empty house — no default dataset shall be seeded.
6. The first-house creation must be guarded by an `initRan` ref so it cannot execute more than once per session, even if the auth listener fires multiple times.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Sign in as a brand-new user (no legacy data) | House "My Home" created; inventory is empty |
| Sign in as the original user (has legacy items) | Migration runs once; all items appear under the new house |
| Refresh after migration | No re-migration; same items shown |

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
1. An "Add Item" button shall open a modal form with fields: item name (text), room (combobox — shows existing room names as autocomplete suggestions but also accepts free-text for new rooms), and estimated value (number, optional).
2. The form shall validate that item name is not empty before saving.
3. Submitting the add form shall write the new item to Firestore and close the modal.
4. Each grid row's Edit button shall open a pre-filled modal allowing the user to change name, room, or value.
5. Saving edits shall update the Firestore document and close the modal.
6. Each grid row's Delete button shall open a confirmation modal asking the user to confirm before deletion.
7. Confirming deletion shall remove the item from Firestore permanently.
8. All modals shall be dismissible via a close button or pressing Escape.
9. Each inventory row shall have a checkbox. Checking one or more rows shall reveal a "Delete X selected" button in the toolbar.
10. A "Select All" checkbox in the table header shall select or deselect all currently visible (filtered) rows at once.
11. Clicking "Delete X selected" shall open a confirmation modal; confirming shall batch-delete all selected items in a single Firestore batch write and clear the selection.
12. A room name typed in the room combobox that does not exist in the predefined list shall be accepted and saved as-is; it shall also appear as a suggestion in future item forms for this house.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Click "Add Item", fill form, submit | New item appears in grid; Firestore document created |
| Click "Add Item", leave name empty, submit | Validation error shown; item not saved |
| Click Edit on a row, change the room, save | Row updates with new room |
| Click Delete on a row, cancel in confirmation | Item remains in grid |
| Click Delete on a row, confirm | Item removed from grid and Firestore |

---

## Feature 5 — *(Removed — AI document scan feature retired)*

The AI-powered document scan feature (Gemini API) has been removed. The app now supports manual CRUD and photo uploads only — there is no automated item extraction from images.

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

## Feature 10 — *(Removed — Reset to Defaults feature retired)*

The "Reset to Defaults" feature has been removed. There is no longer a universal default dataset — each house holds its owner's real inventory data, and resetting to a shared template is not meaningful in a multi-house, multi-user context.

---

## Feature 11 — Firestore Persistence

**User story:** As a user, I want my inventory to be saved to the cloud so that it's available on any device I sign into.

**Acceptance Criteria:**
1. All item writes (create, update, delete) shall be persisted to Firestore immediately.
2. The app shall use a real-time `onSnapshot` listener on `houses/{houseId}/items` for the active house to keep the UI in sync with Firestore.
3. Firestore security rules must enforce that only members of a house can read or write documents under that house's path.
4. The app shall display a loading state while the initial Firestore data is being fetched.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Add an item on Device A | Item appears on Device B without reload |
| Open Firestore Console and inspect data | Items stored at `houses/{houseId}/items/{itemId}` |
| Attempt to access another user's data via Firestore REST | Request denied by security rules |

---

## Feature 12 — *(Merged into Feature 2 — First-Run House Creation and Legacy Migration)*

The original seeding feature has been superseded by Feature 2. New users start with an empty house; there is no default dataset.

---

## Feature 13 — Photo Gallery and Item Linking

**User story:** As a user, I want to upload photos to a central gallery and link them to inventory items so that I have a visual record of my assets for insurance or reference purposes.

**Acceptance Criteria:**
1. A dedicated "Photos" tab shall display a drag-and-drop upload zone accepting multiple image files at once (JPEG, PNG, WEBP, HEIC).
2. Uploaded photos shall be stored in Firebase Storage at `houses/{houseId}/photos/{timestamp}.{ext}` and their metadata (URL, filename, upload timestamp) shall be saved to the `houses/{houseId}/photos` Firestore collection.
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

---

## Feature 14 — House Management

**User story:** As a user, I want to create and manage multiple houses, each with its own address and inventory, so that I can track assets across different properties.

**Acceptance Criteria:**
1. The header shall display the name of the currently active house along with a dropdown arrow.
2. Clicking the house name shall open a dropdown listing all houses the user belongs to, plus a "Create new house" option.
3. Selecting a house from the dropdown shall switch the active house; the inventory grid and photos gallery shall update immediately to reflect that house's data.
4. The active house ID shall be persisted in `localStorage` so that the user's last-selected house is restored on page reload.
5. A "Profile" button shall open a profile modal showing the user's display name, email, all houses they belong to (with addresses), and pending incoming invitations.
6. From the profile modal, the owner of a house shall be able to edit the house name and address inline and save changes to Firestore.
7. Clicking "Create new house" shall open a modal where the user can enter a house name and optional address; submitting shall create a new `houses/{houseId}` document, add the user as owner in `houses/{houseId}/members`, and add the house ID to `users/{uid}/houseIds`.
8. A newly created house must start with an empty inventory — no seed data shall be applied.
9. The house switcher dropdown shall always show the currently active house as selected.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Open house dropdown | All user's houses listed, plus "Create new house" |
| Select a different house | Inventory switches to that house's items |
| Reload the page | Previously active house is restored |
| Click "Create new house", submit with a name | New house appears in dropdown; inventory is empty |
| Open profile modal, edit house address, save | Updated address visible in modal and header bar |

---

## Feature 15 — House Sharing

**User story:** As a house owner, I want to invite other users to access my house inventory so that family members or co-owners can view and manage the same list.

**Acceptance Criteria:**
1. A "Share" button on the active house shall open a share modal displaying current members (name, email, role) and any pending invitations.
2. The share modal shall include an email input to invite a new collaborator.
3. Submitting an invite email shall check whether that email matches an existing `users` document. If the user exists, they shall be added directly to `houses/{houseId}/members` with role `member` and the house ID appended to their `users/{uid}/houseIds`. If the user does not yet have an account, a pending `invites/{inviteId}` document shall be created.
4. The inviting user must not be able to invite themselves or a user already a member of the house.
5. On sign-in, the app shall query `invites` for documents where `inviteeEmail` matches the signed-in user's email and display each as a notification in the profile modal.
6. The invitee shall be able to accept an invite, which shall add them to the house's `members` subcollection, append the house ID to their `houseIds`, and delete the invite document.
7. The invitee shall be able to decline an invite, which shall delete the invite document with no other changes.
8. The owner shall be able to remove any non-owner member from the house; this shall delete their entry from `members` and remove the house ID from their `users/{uid}/houseIds`.
9. Firestore security rules must prevent non-members from reading or writing any path under `houses/{houseId}`.
10. Only the house owner shall be able to update or delete the top-level `houses/{houseId}` document.

**Test Plan:**

| Step | Expected Result |
|------|----------------|
| Click "Share" on a house | Share modal shows current members and invite form |
| Invite a registered user by email | User immediately added as member; house appears in their switcher |
| Invite an unregistered email | Pending invite record created; shown in share modal |
| Sign in as the invited user | Invite notification appears in profile modal |
| Accept the invite | House added to the user's house switcher; invite notification gone |
| Decline the invite | Invite gone; house not added |
| Owner removes a member | Member removed from the house; house no longer in their switcher |
| Non-member attempts direct Firestore access | Request denied by security rules |
