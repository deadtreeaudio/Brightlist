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

## Enable accounts, collaboration, and private-list backups

The packaged app includes password-based Supabase Authentication plus shared-list UI. Personal lists remain local by default; a signed-in user can make a verified, explicit backup after the reviewed database migration is run.

1. Confirm the existing production schema. `supabase-setup.sql` is the original shared-list schema; do not rerun it blindly.
2. Review then run `supabase-auth-migration.sql` in **SQL Editor**. It is additive: it adds a new-user profile trigger and RLS-protected `private_list_backups`, without replacing existing shared tables.
3. In **Authentication → Providers → Email**, enable email/password and require email confirmation.
4. In **Authentication → URL Configuration**, set Site URL and add this exact Redirect URL: `https://deadtreeaudio.github.io/Brightlist/`.
5. In **API Keys**, confirm the configured browser key is an active publishable/anon key. **Never place a service-role/secret key in this file or GitHub.**
4. Enable the `shared_items` table in the `supabase_realtime` publication via Supabase Dashboard.
6. Push your updated files to GitHub Pages; refresh or reopen the installed app.
7. Open **Shared Lists** to create an account, verify email, sign in, reset a password, or use a shared invite. Sessions persist in the browser. “Back up local lists” uploads only after confirmation, verifies the saved row, and never deletes local data.

**Privacy and limits:** Personal lists live in browser local storage unless their owner explicitly backs them up. Shared lists, profiles, and opted-in backups live in Supabase; RLS restricts each to authorized users or members. Invitation URLs are bearer tokens: anybody who receives a valid unexpired invite can join. Links expire after 14 days; avoid forwarding them publicly. Members can edit and delete shared items. Shared lists require an internet connection for writes.

### GitHub repository description (under 350 characters)

Brightlist is a free, installable checklist web app for personal to-dos, reminders, packing, shopping, and returns. Organize with custom categories, reusable templates, offline private lists, and optional real-time collaborative lists with personalized names, shared checkboxes, and invite links.
