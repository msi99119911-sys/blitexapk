# 🚀 Launch on Netlify (free)

The repo is deployment-ready. Connect it once and every `git push` auto-deploys.

---

## Step 1 — Put the project on GitHub

1. Create a new repository on github.com (name it anything, e.g. `blitex-apks`).
2. Upload/push this project folder to it.

## Step 2 — Get your Convex URL

Your site needs the address of its backend (where APKs, screenshots and accounts live).

1. Go to [dashboard.convex.dev](https://dashboard.convex.dev) and sign in.
2. Click your deployment (e.g. `clean-lemming-287`).
3. **Settings → URL** — copy the URL, it looks like `https://clean-lemming-287.convex.cloud`.

## Step 3 — Create the Netlify site

1. Go to [app.netlify.com](https://app.netlify.com) and sign in with GitHub.
2. **Add new site → Import an existing project → GitHub** and pick the repo.
3. Netlify reads `netlify.toml` automatically — build command `npm run build`, publish folder `dist`, SPA routing — so click **Deploy**.

## Step 4 — Add the backend URL

The first deploy will show a "Setup needed" screen. That's expected.

1. In your new Netlify site: **Site configuration → Environment variables → Add a variable**
2. Key: `VITE_CONVEX_URL` — Value: the URL you copied in Step 2
3. **Deploys → Trigger deploy → Deploy site** (redeploys with the variable baked in).

Your site is now live at `https://<your-site-name>.netlify.app`.

## Step 5 — Become the admin

1. Visit `https://<your-site-name>.netlify.app/admin`
2. Sign in with your email (a 6-digit code arrives by email — check spam too).
3. Click **Become the admin** — one time only, the first account to claim it wins.

You now control the whole catalog: upload APK files, add MediaFire links, add
screenshots, rename, hide, delete.

---

## Keeping it running (all free)

| What | Limit | Notes |
|---|---|---|
| Netlify hosting | 100 GB/mo bandwidth, 300 build minutes | Plenty for a catalog site |
| Convex free tier | 1 GB file storage | ~200–400 APKs; big files → use MediaFire links |
| Convex free tier | 1 GB database, 1M requests/mo | Far more than the catalog needs |

**Bandwidth tip:** APK downloads don't use Netlify bandwidth — they stream
directly from Convex storage. Only the website pages count against Netlify's
100 GB, so you're effectively unlimited for downloads.

**Updates:** every `git push` to the repo redeploys automatically. If you edit
the backend (`src/convex/`), also run `npx convex dev --once` locally once to
push those changes to Convex.

## Custom domain (optional)

In Netlify: **Domain management → Add a domain**. Netlify gives you a free
HTTPS certificate automatically. Point your domain's DNS at Netlify and it
replaces the `netlify.app` address everywhere.

## Troubleshooting

- **"Setup needed" screen on the live site** → `VITE_CONVEX_URL` is missing or
  misspelled in Netlify's environment variables; fix it and redeploy.
- **Downloads fail after deploy** → the Convex deployment was likely paused for
  inactivity; run any `npx convex` command locally to wake it, then refresh.
- **Admin page says "Admin only"** → someone already claimed admin with a
  different email. Use that account, or start a fresh Convex deployment.
