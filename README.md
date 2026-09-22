# 🕉️ 108 Prasadam Naivedyam to Lord Vinayaka — Community Sign-up Site

A static website (GitHub Pages friendly) for residents to sign up for one of
the **108 Prasadam** items for the community's Ganesh Chaturthi celebration,
with a password-protected **Committee (Admin) view**, backed live by your
existing Google Sheet.

- **Event:** 108 Prasadam Naivedyam to Lord Vinayaka
- **Date/Time:** 24th September — Evening Pooja, 6:00 PM
- **Google Sheet (data store):**
  https://docs.google.com/spreadsheets/d/1u5SHfGktuudQCAsObrlX0yHn5DN0NGs8AWTRMVmNr_o/edit
- **Admin password:** `Ganesh2026`

---

## How it works

- The site is 100% static HTML/CSS/JS — perfect for **GitHub Pages**.
- Since GitHub Pages can't run a database, submissions are sent to a small
  **Google Apps Script Web App** bound to your Google Sheet. It:
  - Appends each submission as a new row in a `Submissions` tab.
  - Prevents two residents from picking the **same Prasadam item** (server-side check).
  - Prevents the **same mobile number** from submitting more than once.
  - Serves back the list of taken items (with flat/tower) for the public menu.
  - Serves the full submissions list to the Committee/Admin view, gated by
    the password `Ganesh2026`.

## Folder structure

```
ganesh-108-prasadam-site/
├── index.html              # Resident sign-up form + guidelines + 108-item menu
├── admin.html               # Password-protected committee dashboard
├── assets/
│   ├── style.css
│   ├── prasadam-data.js     # All 108 items, grouped into categories
│   ├── config.js            # <-- put your Apps Script Web App URL here
│   ├── app.js                # index.html logic
│   └── admin.js              # admin.html logic
└── apps-script/
    └── Code.gs               # Paste into Google Apps Script (bound to the Sheet)
```

---

## Setup — do this once

### 1. Deploy the Apps Script backend to your Google Sheet

1. Open your Sheet:
   https://docs.google.com/spreadsheets/d/1u5SHfGktuudQCAsObrlX0yHn5DN0NGs8AWTRMVmNr_o/edit
2. Menu: **Extensions → Apps Script**.
3. Delete the default `Code.gs` content and paste in the contents of
   `apps-script/Code.gs` from this repo.
4. Click **Deploy → New deployment**.
   - Select type: **Web app**
   - Description: `108 Prasadam Backend`
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, authorize the permissions when prompted (it needs access
   to your own Sheet).
6. Copy the **Web app URL** it gives you (looks like
   `https://script.google.com/macros/s/AKfycb.../exec`).
7. It will auto-create a `Submissions` tab in your Sheet on first use, with
   columns: `Timestamp | Name | Mobile | Tower | Flat | ItemNumber | ItemName`.

> Whenever you edit `Code.gs` later, you must **Deploy → Manage deployments →
> Edit (pencil) → New version → Deploy** for changes to go live.

### 2. Point the site at your Apps Script URL

Open `assets/config.js` and replace the placeholder:

```js
const API_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
```

with the URL you copied, e.g.:

```js
const API_URL = "https://script.google.com/macros/s/AKfycbXXXXXXXXXXXX/exec";
```

### 3. Push to GitHub & enable Pages

```bash
cd ganesh-108-prasadam-site
git init
git add .
git commit -m "108 Prasadam Naivedyam sign-up site"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source: `main` branch, root folder →
Save**. Your site will be live at
`https://<your-username>.github.io/<your-repo>/`.

---

## Using the site

### Residents (`index.html`)
1. Read the satvik guidelines.
2. Fill in **Name, Mobile Number, Tower (T1–T5), Flat Number** — placeholder
   text is light grey and disappears as soon as they start typing (native
   HTML `placeholder` behavior).
3. Tap any **available** Prasadam item from the 108-item menu below — it
   turns green as "selected by you."
4. Click **Submit My Prasadam Pledge**.
   - If someone else grabbed that item a moment earlier, the server rejects
     it and tells them who has it (flat/tower) — no duplicates possible.
   - Once submitted, the item shows as **taken** for everyone else, along
     with the claiming flat/tower number.
   - One submission per mobile number (one Prasadam per resident).

### Committee (`admin.html`)
1. Enter password: **`Ganesh2026`**
2. View live stats (items submitted / remaining / residents participated).
3. Search/filter by name, mobile, tower, flat, or item.
4. Click **↻ Refresh Data** to pull the latest from the Sheet.
5. All raw data also remains visible directly in the Google Sheet's
   `Submissions` tab at any time.

---

## Notes / customization

- The Prasadam menu (`assets/prasadam-data.js`) is a flat list of 122 items;
  the sign-up countdown tracks progress toward 108 distinct varieties claimed
  (sweets, payasams, savories, fruits, etc.). Edit names/order there anytime
  — no other file needs to change.
- To change the admin password, update `ADMIN_PASSWORD` in
  `apps-script/Code.gs` and redeploy (see step 1 above).
- The public menu refreshes automatically every 20 seconds so residents see
  near-real-time availability without reloading.
