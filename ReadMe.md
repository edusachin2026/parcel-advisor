# Parcel Rate Advisor — assessment starter

A small, already-working prototype provided as the starting point for **Use Case A** of the
developer assessment (see `../../Candidate_Brief.md` for the actual task). It deliberately
does **not** include Docker, CI, or a deployment setup — containerizing and deploying it is
part of the task, not something to be handed to you pre-solved.

## What's here

- `backend/` — Python/FastAPI backend with a mocked `determine()` stub (`app/determine.py`)
  and a `POST /api/determinations` endpoint (`app/main.py`).
- `frontend/` — minimal React + TypeScript (Vite) app that calls the backend and lists
  results in a table.
- `samples/` — anonymised sample consignment export files (see `../FORMAT_SPEC.md`).
- `../FORMAT_SPEC.md` — spec for the sample export file format you need to parse.
- `../RESPONSE_FORMAT_SPEC.md` — spec for the response export file you need to produce.

## Running it locally

**Backend:**

```bash
cd backend
python -m venv .venv
. .venv/Scripts/Activate.ps1      # Windows PowerShell
# source .venv/bin/activate       # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend** (separate terminal):

```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173` — clicking "Run mock determinations" calls the backend
over a few hardcoded sample lines to prove the wiring works end to end.

## What you're expected to build on top of this

See `../../Candidate_Brief.md` §"Use Case A" for the full task. In short: containerize both
services, get it deployed (AWS or documented-only), parse the sample export files in
`samples/` into lines you can feed to `determine()`, build a manual assignment/review screen,
produce a response export, and automate populating that screen with a headless browser.
