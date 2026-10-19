# Brightlist

A subscription-free, offline-first checklist PWA with optional real-time shared lists. Separate **Things to do** and **Things to remember**, plus **Packing** categories: Toiletries, Clothes, Electronics, Returns (with optional recipient), and Music gear. Add unlimited custom lists/categories, reorder/rename/delete items, track completion, reuse packing templates, export/import JSON backups.

## Use it on an iPhone (no Xcode)

Browsers will not install a PWA correctly from a ZIP or a `file://` address. Upload the **contents** of this folder to an HTTPS static host first.

### Easiest free hosting via GitHub Pages

1. Create a free GitHub account if needed. Create a new **public** repository named `brightlist` (GitHub Pages on GitHub Free supports public repositories).
2. Upload **all files from this folder** into the repository root, not a nested subfolder.
3. Go to **Settings → Pages → Build and deployment**, select **Deploy from a branch**, **main** branch and **/(root)** folder, and save.
4. Visit `https://YOUR-USERNAME.github.io/brightlist/` on your iPhone in **Safari** once the site is live.
5. Tap **Share → Add to Home Screen → Add** (enable **Open as Web App** if Safari offers it).
6. Open the new icon at least once with internet. Subsequent visits work offline thanks to the service worker.

You can also deploy the folder to another HTTPS static host. No API keys or backend needed.

## Privacy and important backup caveat

All list data is kept in browser **localStorage on the device**, not on a server. Lists are not automatically synchronized between iPhones, Macs or browsers. Removing website data, removing the installed web app, or switching devices may erase stored lists. Use **Settings → Export backup** regularly and save the JSON file in iCloud Drive or Files. **Import backup** replaces existing data and is not a merge.

Because persistence is tied to the web app's origin/storage context, always use the same installed app and host URL. Do not use Private Browsing for regular use.

## Project structure

- `index.html` App shell
- `styles.css` Responsive chartreuse/charcoal/cream UI
- `app.js` Vanilla JS data model and UI
- `manifest.webmanifest` Install metadata
- `sw.js` Offline app-shell caching
- `icon.svg` + PNG icons

## Run locally for development

From inside the folder, run `python3 -m http.server 8000`, then open `http://localhost:8000`. For installation on your phone, use an HTTPS deployment, not a LAN HTTP URL.

## Editing

Everything is written in vanilla HTML, CSS and JS. No dependencies, builds, accounts, analytics, in-app purchases or external libraries.

## Enable collaboration and personalized names

The packaged app includes the shared-list UI, but **collaboration is inactive until you configure a Supabase backend**. Personal lists work without any account.

1. Create a free project at https://supabase.com and open **SQL Editor**. Run `supabase-setup.sql`.
2. In Authentication settings, enable email OTP/magic links and add your GitHub Pages URL to the allowed redirect URLs. Set the Site URL to your hosted app URL.
3. Find **Project URL** and **publishable/anon key** in Supabase project API settings. Set both in `cloud-config.js`. **Never place the service-role/secret key in this file or GitHub.**
4. Enable the `shared_items` table in the `supabase_realtime` publication via Supabase Dashboard.
5. Push your updated files to GitHub Pages; refresh or reopen the installed app.
6. Open **Shared Lists**, sign in with your email, and enter your display name (such as Clint). Create a shared list titled `Packing List` and invite Steve with the Share button. After Steve signs in, sets his name, and accepts the link, the list appears as **Clint and Steve’s Packing List**. Each account can also have its own locally saved private lists.

**Privacy and limits:** Personal lists live in browser local storage; they are not transferred across devices or synced to your account. Shared lists and names live in Supabase; database RLS restricts list access to members. Invitation URLs are bearer tokens: anybody who receives a valid unexpired invite can join. Links expire after 14 days; avoid forwarding them publicly. Members can edit and delete shared items. The free Supabase tier is subject to its own usage limits and may change. Shared lists require an internet connection for writes. You can customize shared-list titles; the app automatically prepends participant names.

### GitHub repository description (under 350 characters)

Brightlist is a free, installable checklist web app for personal to-dos, reminders, packing, shopping, and returns. Organize with custom categories, reusable templates, offline private lists, and optional real-time collaborative lists with personalized names, shared checkboxes, and invite links.
