# Deploy OrbTap Web to Hostinger

Build the web app and upload the `dist` folder to Hostinger for static hosting.

## 1. Build the web bundle

From the project root:

```bash
npm run build:web
```

This runs `expo export --platform web` and copies `hostinger.htaccess` into `dist/.htaccess` so all routes (e.g. `/intent`, `/orbpass`) serve `index.html` and the SPA router works.

## 2. What to upload

Upload **everything inside** the `dist` folder to your Hostinger **public_html** (or the domain’s document root):

- `index.html` (at the root of public_html)
- `favicon.ico`
- `_expo/` (folder with JS and assets)
- `.htaccess` (so deep links and refresh work)

So after build, `dist/` will look like:

```
dist/
  .htaccess
  index.html
  favicon.ico
  _expo/
    static/
      js/web/...
  assets/   (if any)
```

Upload the **contents** of `dist/` into public_html, not the `dist` folder itself.

## 3. Hostinger steps (summary)

1. **hPanel** → **File Manager** → open `public_html` (or your domain’s root).
2. Delete or back up existing files if this is a fresh deploy.
3. Upload all contents of `dist/` (drag and drop or “Upload”).
4. Ensure `index.html` and `.htaccess` are in the root of public_html.
5. Visit your domain; the app should load. Navigate and refresh a deep link (e.g. `/legal/privacy`) to confirm SPA fallback works.

## 4. Environment variables (optional)

If you use a custom app URL or other env vars (e.g. `EXPO_PUBLIC_APP_LINK`), set them **before** building. The values are inlined at build time:

```bash
EXPO_PUBLIC_APP_LINK=https://yourdomain.com npm run build:web
```

Then upload the new `dist` contents as in step 2.

## 5. Subdirectory (e.g. yourdomain.com/app)

If you host at a path like `https://yourdomain.com/orbtap/`, you need a base path. Set it before building (Expo/Metro may need `web.output` or asset prefix). For root domain hosting, no change is needed.

## Troubleshooting

- **404 on refresh or direct URL**  
  Ensure `.htaccess` is in the same directory as `index.html` and that Hostinger has `mod_rewrite` enabled (usually on by default).

- **Blank page**  
  Open the browser console. If scripts are 404, check that `_expo/static/js/web/` was uploaded and that you didn’t rename or move `index.html` so script paths no longer match.

- **Wrong domain in links**  
  Rebuild with `EXPO_PUBLIC_APP_LINK=https://yourdomain.com` and redeploy.
