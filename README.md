# jakewang.dev

Personal project site and its backend, served as one app from one origin: the
pages at `/` and `/mytesla/`, the JSON they fetch at `/api/tesla/*`. Writes come
from iPhone Shortcuts (protected by an API key).

Not a traffic-facing site: there is no analytics, no sitemap/robots, and no SEO
metadata.

## Stack

- **FastAPI** — web framework (pages *and* API)
- **Jinja2** — server-rendered page shells
- **PostgreSQL** + **SQLAlchemy** — storage
- **Chart.js** (self-hosted) — client-side charts
- **uvicorn** — ASGI server

## Project Layout

```text
app/
  main.py          # FastAPI app: static mount, page routes, middleware, router mounting
  config.py        # pydantic-settings configuration (.env)
  database.py      # engine + per-request session
  dependencies.py  # x-api-key verification
  utils.py         # row serialization, response envelope, date helpers
  routers/         # thin HTTP route handlers (tesla)
templates/         # Jinja page shells (base + home + dashboard + errors)
static/            # CSS, JS (dashboard builders + data loaders), favicons
tests/             # pytest suite (no real DB)
schema.sql         # reference DDL for rebuilding the database
```

The dashboard is rendered client-side: `templates/tesla.html` only lays out empty
`<canvas>` slots, and `static/js/tesla.js` fetches every number from `/api/tesla/*`
on this same origin. Nothing needs a redeploy when new records land.

## Environment Variables

All configuration is loaded via `pydantic-settings` from `.env` (or environment variables). Create a `.env` file with the following (defaults exist for some):

```env
DATABASE_URL=postgresql://user:password@host:port/dbname
SHORTCUT_API_KEY=your_api_key
APP_TIMEZONE=Asia/Taipei
TESLA_ODOMETER_KM=21471
```

## Setup & Run

```bash
python -m venv .venv          # Python version pinned in .python-version (3.14)
source .venv/bin/activate
pip install -r requirements.lock   # fully pinned; use requirements.txt for top-level only
uvicorn app.main:app --reload
```

The site is then at **http://localhost:8000** and the API under `/api/`.

Interactive API docs (`/docs`, `/redoc`, `/openapi.json`) are disabled on purpose —
see `app/main.py`. Use the endpoint tables below as the reference.

Dependencies: `requirements.txt` lists top-level packages; `requirements.lock` is the
fully pinned set generated with `uv pip compile requirements.txt -o requirements.lock`.
Re-generate the lock after changing `requirements.txt`.

## Tests

```bash
pip install -r requirements-dev.txt
python -m pytest tests/
```

Tests never touch a real database — DB sessions are faked.
GitHub Actions (`.github/workflows/ci.yml`) runs the suite on every push and pull request.

## Database Schema & Migrations

`schema.sql` is the reference DDL for every table the API uses. Rebuild an empty
database with:

```bash
psql "$DATABASE_URL" -f schema.sql
```

Schema changes are delivered as migration scripts in `migrations/`.
The workflow:

1. Deploy code that works with both the old and the new schema.
2. Run the script on the production server:

   ```bash
   cd /var/www/main-site
   source .venv/bin/activate
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/<script_name>.sql
   ```

3. Update `schema.sql` to match, then delete the script — git history keeps the
   record. Applied so far: `add_tesla_recent_columns.py` (2026-06-03),
   `add_odometer_readings.py` (2026-06), `drop_payment_method.py` (by 2026-06-28),
   `drop_daily_expenses.py` (2026-08-28).

Pending migration: `add_data_integrity_constraints.sql`. It adds `NOT NULL`,
length, and non-negative numeric constraints that match API validation. It
aborts without changing the schema if legacy rows violate those rules, so those
records can be reviewed and corrected explicitly before rerunning it.

## Endpoints

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (pings the DB; 503 if unreachable) |
| GET | `/api/tesla/stats` | Total cost, charging cost, cost per km |
| GET | `/api/tesla/monthly-summary` | Month-by-month cost & efficiency (km driven, cost/km, kWh/100km) |
| GET | `/api/tesla/expenses` | Car expenses grouped by item |
| GET | `/api/tesla/expenses/recent` | Recent 10 car expenses (newest first) |
| GET | `/api/tesla/charging/providers` | Charging cost grouped by provider |
| GET | `/api/tesla/charging/monthly-trend` | Monthly charging trend |
| GET | `/api/tesla/charging/sessions` | Full charging history (per-session cost distribution) |
| GET | `/api/tesla/charging/recent` | Recent 10 charging records (newest first) |
| GET | `/api/tesla/odometer/current` | Latest known odometer reading (km) |
| GET | `/api/tesla/odometer/recent` | Recent 10 odometer readings (newest first) |

> Note: all tables carry an `id` (SERIAL) column. The `/recent` endpoints order by the
> record's date column then `id DESC`, so rows logged on the same date come back newest-first.

> Rate limiting: everything except `/health` is capped at 600 requests/minute per
> client IP (in-memory, via slowapi). The cap covers pages and static assets too,
> and one page load pulls ~15 requests. Behind a reverse proxy, run uvicorn with
> `--proxy-headers` (and `--forwarded-allow-ips`) so the real client IP is used.

### Protected (Header: `x-api-key`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/tesla/charging-records` | Create a charging record |
| POST | `/api/tesla/car-expenses` | Create a car expense |
| POST | `/api/tesla/odometer` | Log a total-odometer reading |

### POST `/api/tesla/charging-records`

```json
{
  "charge_date": "2026-05-09",
  "provider": "Tesla Supercharger",
  "amount": 150,
  "kwh": 30.5
}
```

Response includes `id`:

```json
{
  "status": "success",
  "message": "Charging record created",
  "data": { "id": 123, "charge_date": "2026-05-09", "provider": "...", "amount": 150, "kwh": 30.5 }
}
```

### POST `/api/tesla/car-expenses`

```json
{
  "date": "2026-05-09",
  "item": "Insurance",
  "amount": 25000
}
```

Response includes `id`:

```json
{
  "status": "success",
  "message": "Car expense created",
  "data": { "id": 45, "date": "2026-05-09", "item": "Insurance", "amount": 25000 }
}
```

### POST `/api/tesla/odometer`

```json
{
  "reading_km": 23120,
  "reading_date": "2026-06-09"
}
```

`reading_date` is optional (defaults to today). Cost-per-km in `/api/tesla/stats`
automatically follows the latest reading.

## Pages

| Path | Description |
|------|-------------|
| `/` | Home — intro, project cards, skills |
| `/mytesla/` | Tesla cost dashboard (fetches `/api/tesla/*` client-side) |

## Caching

`Cache-Control` is set by one middleware in `app/main.py`, by kind of response:

| Kind | max-age | Why |
|------|---------|-----|
| `/static/*` | 1 year | URLs carry a `?v=<mtime>` cache-buster, so this is safe |
| `/api/*` | 30s | Shortcuts entries should reach the dashboard promptly |
| pages | 5min | They only change on redeploy |

Requests carrying `x-api-key` are never marked publicly cacheable.

There is **no CORS layer**: pages and API share an origin, so nothing cross-origin
happens. A test pins this, since adding CORS back would quietly re-open the API to
other sites.
