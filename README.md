# Portfolio cover letter — frontend

Next.js app for portfolio ingestion, cover letter composition, and related UI. It talks to the FastAPI backend over HTTP.

## Setup

1. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Optional: point the UI at a non-default API base URL by creating `.env.local`:

   ```bash
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   ```

   If unset, the app uses `http://127.0.0.1:8000`.

3. Start the dev server:

   ```bash
   npm run dev
   ```

   App: [http://localhost:3000](http://localhost:3000). Ensure the backend is running and that its `CORS_ORIGINS` includes your frontend origin (see `backend/.env.example`).

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — ESLint
