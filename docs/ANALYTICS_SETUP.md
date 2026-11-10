# Setting up historical visitor stats on the dashboard

> **STATUS (as of 2026-07-30): Currently disabled.**
>
> The dashboard widgets that displayed historical visitor counts and
> visitors-by-country have been **removed** to keep the dashboard simple
> while GA credentials are not yet configured. The backend infrastructure
> (Python script + GitHub Actions workflow + this doc) is **preserved**
> so the feature can be re-enabled at any time by following the steps
> below.
>
> To re-enable:
> 1. Complete the one-time Google Cloud setup in this guide (Steps 1–7).
> 2. Uncomment the `schedule:` block in
>    `.github/workflows/update-analytics.yml`.
> 3. Re-add the dashboard widgets by reverting commit `<TBD>` (or by
>    re-running `scripts/patch_dashboards_with_ga.py`).
>
> The current dashboard (without GA widgets) shows:
> - Top row: Total Downloads / GitHub Stars / Total Releases (live from GitHub API)
> - Visitor row: per-browser visitor counter + geolocation (the "Site
>   Visitors" card)
> - Per-project breakdown: Downloads by Project (top 6 repos)

---

This guide walks you through the one-time setup required to display
**historical visitor counts** and **visitors-by-country** on the Live
Statistics dashboard at `waleedmandour.org/` and `waleedmandour.org/projects/`.

Once configured AND the widgets are re-enabled, the dashboard will show:

- All-time visitors (since the GA tag was first installed)
- Visitors in the last 30 days
- Visitors in the last 7 days
- Top 5 countries with flag emojis + visitor counts (all-time)

These numbers come from Google Analytics 4 (GA4) via the GA Data API,
fetched hourly by a GitHub Actions workflow and committed to the repo
as `analytics.json`.

---

## Why this requires setup

The dashboard already shows a per-browser visitor counter (using
`localStorage`), but that counter starts at 1 for each new visitor and
cannot retrieve historical data — `localStorage` didn't exist before the
dashboard was added.

To show real historical visitor counts, we need to query the GA4
property programmatically. The GA Data API requires authentication via
a Google Cloud **service account** (you can't query it from the browser
without exposing credentials).

The architecture is:

```
   ┌─────────────────────┐    hourly     ┌─────────────────────┐
   │  GitHub Actions     │ ────────────> │  GA4 Data API       │
   │  workflow           │               │  (property          │
   │  (.github/workflows │               │   G-WW4M0NCF1V)     │
   │   /update-analytics │               └─────────────────────┘
   │   .yml)             │                        │
   │                     │ <───────────────────────┘
   │  runs Python script │   visitor counts, top countries, etc.
   │  with service-acct  │
   │  credentials        │
   │                     │
   │  commits            │ ────────────┐
   │  analytics.json     │              │
   └─────────────────────┘              ▼
                                   ┌─────────────────────┐
                                   │  analytics.json     │
                                   │  (in the repo,      │
                                   │   served by GitHub  │
                                   │   Pages)            │
                                   └─────────────────────┘
                                              │
   ┌─────────────────────┐                    │
   │  Browser dashboard  │ <──────────────────┘
   │  (JS fetches        │   static JSON, no auth needed
   │  /analytics.json)   │
   └─────────────────────┘
```

The service-account credentials live only inside GitHub Actions secrets
— they are **never** exposed in the browser. The browser only fetches
the resulting `analytics.json`, which contains aggregated counts only
(no PII).

---

## One-time setup (≈10 minutes)

You need a Google account with admin access to the GA4 property
`G-WW4M0NCF1V` (i.e., the GA property that's already collecting data
from `waleedmandour.org`).

### Step 1 — Create a Google Cloud project

1. Go to <https://console.cloud.google.com/> and sign in with the
   Google account that owns the GA4 property.
2. Click the project picker (top bar) → **New Project**.
3. Project name: `waleedmandour-ga-reader` (or anything you like).
4. Click **Create**. Wait ~30s for the project to provision.
5. Make sure the new project is selected in the top bar.

### Step 2 — Enable the Google Analytics Data API

1. In the Cloud Console, go to **APIs & Services → Library**.
2. Search for `Google Analytics Data API`.
3. Click into it, then click **Enable**.

### Step 3 — Create a service account

1. Go to **APIs & Services → Credentials**.
2. Click **Create Credentials → Service account**.
3. Service account name: `ga-reader` (or anything).
4. Click **Create and Continue**, then **Done** (skip the optional
   role/user steps — they're not needed for this use case).
5. In the service accounts list, click the new `ga-reader@…` account.
6. Go to the **Keys** tab.
7. **Add Key → Create new key → JSON → Create**.
8. A JSON file downloads to your computer. **Keep this file safe** —
   it's the only copy of the private key. Don't commit it to git.

### Step 4 — Grant the service account Viewer access to the GA4 property

1. Open the JSON key file. Copy the `client_email` value
   (it looks like `ga-reader@waleedmandour-ga-reader.iam.gserviceaccount.com`).
2. Go to <https://analytics.google.com/> and sign in.
3. Open the `waleedmandour.org` property (the one with measurement ID
   `G-WW4M0NCF1V`).
4. Go to **Admin → Property access management** (in the Property column).
5. Click **+ → Add users**.
6. Paste the service-account email, set the role to **Viewer**, and
   uncheck "Notify by email" (service accounts have no inbox).
7. Click **Add**.

### Step 5 — Find the GA4 property ID

1. In GA4, go to **Admin → Property settings** (top of the Property
   column).
2. Copy the **Property ID** (a numeric string like `123456789`).

### Step 6 — Add the credentials as a GitHub Actions secret

1. Open the JSON key file in a text editor. Copy the **entire** file
   contents (it should start with `{` and end with `}`).
2. Go to <https://github.com/waleedmandour/Homepage/settings/secrets/actions>.
3. Click **New repository secret**.
4. Name: `GA_CREDENTIALS_JSON`
5. Secret: paste the entire JSON file contents.
6. Click **Add secret**.

### Step 7 — Add the property ID as a GitHub Actions variable

1. Go to <https://github.com/waleedmandour/Homepage/settings/variables/actions>.
   (Note: this is **Variables**, not Secrets — the property ID is not
   sensitive.)
2. Click **New repository variable**.
3. Name: `GA_PROPERTY_ID`
4. Value: paste the numeric Property ID from Step 5.
5. Click **Add variable**.

### Step 8 — Trigger the workflow manually to verify

1. Go to <https://github.com/waleedmandour/Homepage/actions/workflows/update-analytics.yml>.
2. Click **Run workflow** (top right) → **Run workflow** (green button).
3. Wait ~60s, then click into the run.
4. The job should succeed and you should see a commit named
   `chore(analytics): hourly refresh of visitor stats` on `main`.
5. Within ~60s of that commit, GitHub Pages will rebuild and the
   dashboard at `waleedmandour.org/` and `waleedmandour.org/projects/`
   will start showing real historical visitor counts instead of the
   "Configure GA" hint.

---

## How it works after setup

- The GitHub Actions workflow runs hourly via `cron: '0 * * * *'`.
- Each run calls the GA4 Data API 6 times (all-time totals, 7d, 30d,
  countries all-time, countries 30d, top pages) and writes the
  aggregated result to `analytics.json` at the repo root.
- If the numbers haven't changed since the last run, no commit is made
  (the workflow detects "no diff" and skips the commit step).
- The dashboard JS fetches `/analytics.json?ts=<timestamp>` (cache-busting)
  and animates the numbers into the three new "All-time Visitors" /
  "Visitors (30 days)" / "Visitors (7 days)" cards, plus the
  "Visitors by Country" widget showing the top 5 countries with flags.

---

## Cost

Free. All components are within free tiers:

- **Google Analytics 4**: free, no API call limits for this volume.
- **Google Cloud service account + Data API**: free
  (250,000 requests/day quota — we use ~6/hour = 144/day).
- **GitHub Actions**: free for public repos, unlimited minutes.
- **GitHub Pages**: free.

---

## Troubleshooting

**The workflow shows "analytics.json was not written" warning.**
→ Most likely the `GA_CREDENTIALS_JSON` secret or `GA_PROPERTY_ID`
  variable isn't set. Re-check Steps 6 and 7 above.

**The workflow runs but the dashboard still shows "Configure GA".**
→ Check that the workflow actually committed `analytics.json` (look
  for a recent commit on `main` with the message
  `chore(analytics): hourly refresh of visitor stats`). If it didn't,
  check the workflow logs for the actual error from
  `scripts/fetch_analytics.py`.

**The dashboard shows "—" forever on the new cards.**
→ Your browser may be blocking the fetch to `/analytics.json` (e.g.,
  an overzealous ad blocker). Try in incognito mode with extensions
  disabled.

**The numbers look too low.**
→ GA4 only counts visitors from when the GA tag was first installed
  on the site. If the GA tag was added recently, the "all-time"
  number reflects only that period. Also, GA4 doesn't track visitors
  who have ad blockers or Do Not Track enabled — real traffic is
  typically 10–30% higher than what GA4 reports.

**The numbers are zero.**
→ Verify the property ID is correct and the service account was added
  as a Viewer on the *property* (not just a stream or website). The
  workflow log will show the actual GA error message.

---

## Files involved

- `scripts/fetch_analytics.py` — the Python script that calls the GA4
  Data API and writes `analytics.json`. Self-documenting.
- `scripts/requirements.txt` — pinned Python deps
  (`google-analytics-data`, `google-auth`).
- `.github/workflows/update-analytics.yml` — the GitHub Actions
  workflow that runs hourly.
- `analytics.json` — the output file (committed to the repo by the
  workflow; not checked in by hand).
- `docs/ANALYTICS_SETUP.md` — this file.

The dashboard HTML/JS that consumes `analytics.json` lives inline in:

- `index.html` (root landing page)
- `projects/index.html` (projects portfolio page)

Search for `stat-historical-visitors` or `top-countries` to find the
relevant sections.
