# Deploy OrbTap Web to Hostinger (www.orbtap.com)

Easiest way to get your OrbTap web app live on Hostinger: **build locally**, then **upload the built files** to your domain’s `public_html`.

## What you need

- Hostinger account with your domain (e.g. orbtap.com) attached
- Node 18+ on your computer
- Project with deps installed (`npm install`)

---

## Step 1: Set production URL (one-time)

In the project root, create or edit `.env`:

```bash
EXPO_PUBLIC_APP_LINK=https://www.orbtap.com
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://www.orbtap.com/legal/privacy
EXPO_PUBLIC_TERMS_URL=https://www.orbtap.com/legal/terms
```

Use `https://orbtap.com` if your domain has no `www`.

---

## Step 2: Build the web app

In the project root:

```bash
npm run export:web
```

This runs `expo export --platform web` and creates a **`dist`** folder with the static site.

---

## Step 3: Add SPA redirect file (for Hostinger)

So that routes like `/legal/privacy` and `/auth/login` work when someone opens them directly or refreshes, Hostinger (Apache) needs to serve `index.html` for all paths.

1. In the **`dist`** folder (same level as `index.html`), create a file named **`.htaccess`**.
2. Put this inside it:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

There is also a copy in the repo: **`hostinger.htaccess`**. After building, run (from project root):

```bash
cp hostinger.htaccess dist/.htaccess
```

Then upload the contents of `dist` (including `.htaccess`) to Hostinger.

---

## Step 4: Upload to Hostinger

1. Log in to **Hostinger** → **hPanel** → **Websites** → your site (orbtap.com).
2. Open **File Manager** and go to **`public_html`** (this is the web root for your domain).
3. **Remove** any old files in `public_html` you don’t need (or back them up).
4. **Upload** the **contents** of your local **`dist`** folder into `public_html`:
   - Upload **all** files and folders from `dist` (e.g. `index.html`, `_expo/`, assets, **and** `.htaccess`).
   - Do **not** upload the `dist` folder itself; only what’s **inside** it.

**Option A – File Manager (small sites)**  
Select “Upload”, then choose all files/folders from `dist` (including `.htaccess`).

**Option B – ZIP (easier for many files)**  
1. On your computer, zip the **contents** of `dist` (so `index.html` and `.htaccess` are at the root of the zip).  
2. Upload the zip to `public_html`.  
3. In File Manager, right‑click the zip → **Extract**.  
4. Delete the zip if you want.

---

## Step 5: Point your domain (if not already)

- In Hostinger, make sure the domain (e.g. **www.orbtap.com** or **orbtap.com**) is pointed to this hosting account and that the document root is **`public_html`** (default).
- If you use **www**, you can add a redirect from **orbtap.com** → **https://www.orbtap.com** in Hostinger’s “Redirects” or domain settings.

---

## Step 6: Check the site

- Open **https://www.orbtap.com** (or your chosen URL).
- Try: home, login/signup, **/legal/privacy**, **/legal/terms**, and a few in-app links.
- If you see a blank page, open the browser’s Developer Tools (F12) → Console and fix any errors (often a wrong base URL or missing `.htaccess`).

---

## Updating the site later

1. Change code or `.env` as needed.
2. Run again: `npm run export:web`.
3. Add `.htaccess` inside `dist` again if it’s not there (or keep a copy and paste it back after each export).
4. Re-upload the **contents** of `dist` to `public_html` (overwrite existing files), or upload a new zip and extract as in Step 4.

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| 404 on `/legal/privacy` or other routes | Ensure `.htaccess` is in `public_html` (same level as `index.html`) with the rewrite rules above. |
| Blank page | Check browser console; confirm `EXPO_PUBLIC_APP_LINK` in `.env` matches your live URL and you rebuilt after changing it. |
| Wrong links (e.g. localhost) | Rebuild after setting `.env` and re-upload the new `dist` contents. |
| Map / Scan not “working” | On web they show placeholders and “Get the app”; full map/scan are in the mobile app. |

---

## Summary

1. Set **.env** with `EXPO_PUBLIC_APP_LINK=https://www.orbtap.com` (or your URL).  
2. Run **`npm run export:web`**.  
3. Put **.htaccess** (SPA rewrites) inside **`dist`** (use **`hostinger.htaccess`** from the repo).  
4. Upload **everything inside `dist`** into Hostinger’s **`public_html`**.  
5. Visit **https://www.orbtap.com** and test.

That’s the easiest way to add the OrbTap web app to Hostinger.
