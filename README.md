# CheapEats

A mobile-first app that consolidates restaurant and fast food discounts and deals. The home page shows the **best deals by savings**, and you can **filter by cuisine**.

## What’s included

- **Backend** (Node.js + Express): REST API for deals and cuisine list, with seed data.
- **Frontend** (React + Vite): Responsive UI that works great on phones and desktops.

## Quick start

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

API runs at **http://localhost:3001**. Endpoints:

- `GET /api/deals` – list deals (best savings first). Optional: `?cuisine=Mexican`, `?sort=newest`
- `GET /api/deals/cuisines` – list of cuisine types for the filter

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:5173**. Vite proxies `/api` to the backend, so the app works without CORS issues.

### 3. Use the app

- Open **http://localhost:5173** in your browser (or on your phone on the same Wi‑Fi by using your PC’s IP and port 5173).
- Home page shows deals sorted by best savings.
- Use the **Cuisine** dropdown to filter (e.g. Mexican, Pizza, Fast Food).

## Data and live deals

You can get live deals **without running your own API server** in two ways:

### 1. OpenMenu (built-in, API key only)

Set **`OPENMENU_API_KEY`** in `backend/.env` (get a key at [OpenMenu](https://www.openmenu.com/platform/account/api.php)). The app will call OpenMenu directly; no separate “external API” to host.

- **Key only:** Uses OpenMenu’s sample deals (no credits). Good for trying it.
- **Key + city/country:** Set `OPENMENU_CITY` and `OPENMENU_COUNTRY` (and optionally `OPENMENU_STATE` or `OPENMENU_POSTAL_CODE`) to load real deals for that area (restaurants from OpenMenu’s catalog).

### 2. Your own feed URL

Set **`DEALS_FEED_URL`** to any URL that returns JSON (your API, a third-party, or the built-in feed):

- **Built-in (no external API):** `DEALS_FEED_URL=http://localhost:3001/api/deals/feed` – serves unexpired deals from `backend/data/deals.js` through the live pipeline.
- **Your API:** `DEALS_FEED_URL=https://your-api.com/deals` – your server returns a JSON array (or `{ "deals": [...] }`) with `title`/`headline`, `description`, `restaurant`/`restaurant_name`, `validUntil`/`date_end`, etc.

The backend tries the feed first, then OpenMenu if the feed is missing or empty. **Static fallback:** if both are unset or fail, the app uses **`backend/data/deals.js`** and still filters out expired deals.

The UI shows **“Live · Updated …”** and a **Refresh** button when deals come from the live source.

### Getting live data from individual restaurant sites (scraping)

The app does **not** scrape restaurant websites or menus itself. Many sites forbid scraping in their terms of service, and scrapers break when pages change. To use data from individual sites you have two options:

- **Run your own scraper/aggregator** (e.g. a small service that hits specific sites you’re allowed to use, or a licensed provider), then expose a JSON feed and set **`DEALS_FEED_URL`** to that URL. CheapEats will treat it as the live source.
- **Use a provider** such as OpenMenu (built-in above), or another deal/coupon API that aggregates restaurant offers legally; then either set their feed as `DEALS_FEED_URL` or use OpenMenu with an API key as above.

## Optional: run both with one command

From the project root:

```bash
# Terminal 1
cd backend && npm install && npm run dev

# Terminal 2
cd frontend && npm install && npm run dev
```

Then open http://localhost:5173.

## Tech stack

- **Backend:** Express, CORS, ES modules
- **Frontend:** React 18, Vite, CSS (no UI framework; mobile-first layout)
