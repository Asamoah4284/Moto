# Moto Remit

Motorbike rider remittance dashboard — Ghana Cedis (GHS).

## Structure

- `frontend/` — Vite + React UI (mobile-friendly)
- `backend/` — Express + MongoDB Atlas API
- `.env` — secrets (gitignored)

## Setup

1. Put your Atlas URI in root `.env` (see `.env.example`).
2. In [MongoDB Atlas](https://cloud.mongodb.com) → **Network Access** → allow your current IP (or `0.0.0.0/0` for development).
3. Install and run:

```bash
npm run install:all
npm run dev
```

- Web: http://localhost:5173  
- API: http://localhost:4000  

## Default PINs

- Manager: `1234`
- Owner: `0000`

Change under **Settings** (Owner). All data is stored in MongoDB.
