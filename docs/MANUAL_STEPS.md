# Manual Setup Steps

These are the one-time steps you must complete by hand before the GitHub Actions deployment can run.

---

## 1. Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it (e.g. `home-inventory-tracker`) → disable Google Analytics if not needed → **Create project**

---

## 2. Enable Firebase Services

In the Firebase Console for your project:

**Authentication**
- Build → Authentication → Get started
- Sign-in method → Google → Enable → add your support email → Save

**Firestore**
- Build → Firestore Database → Create database → choose **Native mode** → pick a region → Done

**Storage**
- Build → Storage → Get started → accept rules → choose a region → Done

---

## 3. Get Your Firebase Web Config

- Project Settings (gear icon) → General → scroll to **Your apps**
- Click **Add app** → Web → register (no Firebase Hosting setup here) → copy the config values

You'll need:
- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

---

## 4. Create a Service Account for GitHub Actions

- Project Settings → Service accounts → **Generate new private key** → Download JSON
- Keep this file safe — it's never committed to git

---

## 5. Update `.firebaserc`

Replace `your-firebase-project-id` in `.firebaserc` with your actual project ID.

---

## 6. Create a GitHub Repository

```bash
gh repo create home-inventory-tracker --public --source=. --remote=origin --push
```

Or create via github.com and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/home-inventory-tracker.git
git push -u origin main
```

---

## 7. Add GitHub Actions Secrets

Go to your GitHub repo → Settings → Secrets and variables → Actions → **New repository secret**.

Add each of these:

| Secret name | Where to find the value |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase web app config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase web app config |
| `VITE_FIREBASE_PROJECT_ID` | Firebase web app config |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase web app config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase web app config |
| `VITE_FIREBASE_APP_ID` | Firebase web app config |
| `VITE_GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) — or leave empty and paste in-app |
| `FIREBASE_SERVICE_ACCOUNT` | Paste the entire contents of the service account JSON file |

---

## 8. Add Firebase Hosting to the Console (for action-hosting-deploy)

- Firebase Console → Hosting → Get started → follow the prompts (you don't need to run `firebase deploy` locally)
- This registers the hosting site so GitHub Actions can deploy to it

---

## 9. Local Development

Create a `.env` file at the project root (copy from `.env.example` and fill in real values):

```
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_GEMINI_API_KEY=your-gemini-api-key
```

Then run:
```bash
npm install
npm run dev
```

---

## 10. Grant Service Account the "Service Usage Consumer" Role (required for rules deploy)

Firebase's CLI checks whether APIs are enabled before deploying Firestore and Storage rules. The default Firebase Admin SDK service account doesn't have permission to do that check, so the rules deploy step will be skipped until you add this role.

1. Go to [console.cloud.google.com/iam-admin/iam](https://console.cloud.google.com/iam-admin/iam)
2. Make sure the right project (`home-inventory-tracker-f94b1`) is selected in the top bar
3. Find the row for `firebase-adminsdk-fbsvc@home-inventory-tracker-f94b1.iam.gserviceaccount.com`
4. Click the pencil (Edit) icon on that row
5. Click **+ Add another role**
6. Search for **Service Usage Consumer** and select it
7. Click **Save**

After saving, the next push to `main` will deploy Firestore and Storage rules automatically.

---

## 11. Trigger First Deployment

Once all secrets are set:
```bash
git push origin main
```

Watch the Actions tab on GitHub — the workflow runs build + deploy automatically.
