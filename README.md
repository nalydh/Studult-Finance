# StuFin

Frontend: Next.js (deployed on Vercel) · Backend: FastAPI (deployed on DigitalOcean App Platform)

## Local development

### One-time setup

```bash
# Backend — Python 3.12 venv + dependencies
cd backend
python3.12 -m venv venv          # brew install python@3.12 if needed
./venv/bin/pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

Local config lives in `backend/.env` and `frontend/.env.local` (both gitignored).
They are already set up for a local SQLite database (`backend/local.db`) and a
backend at `http://localhost:8000`. If they're missing, the backend refuses to
start with a message telling you what to set.

### Running

```bash
# Terminal 1 — backend on :8000
cd backend
./venv/bin/uvicorn app.main:app --reload

# Terminal 2 — frontend on :3000
cd frontend
npm run dev
```

### Notes

- **Database**: SQLite by default — delete `backend/local.db` to reset. To use
  Postgres instead, change `DATABASE_URL` in `backend/.env`. Tables are created
  automatically on startup; new *columns* on existing tables are not (add those
  via SQL in `backend/migrations/`).
- **Emails**: without `RESEND_API_KEY`, emails are skipped and their links
  (verification, password reset) are printed to the backend console — copy the
  link into the browser to complete the flow.
- **Google sign-in**: needs `GOOGLE_CLIENT_ID` in `backend/.env`,
  `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` in `frontend/.env.local`, and
  `http://localhost:3000/api/auth/callback/google` added as an authorized
  redirect URI in Google Cloud Console. Email/password sign-in works without any
  of that.
- **Production env vars**: backend (DigitalOcean) needs `JWT_SECRET`,
  `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `RESEND_API_KEY`, `APP_URL`/`APP_URLS`;
  frontend (Vercel) needs `NEXT_PUBLIC_API_BASE`, `NEXTAUTH_URL`,
  `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
