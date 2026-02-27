# IP Geolocation Web

React + Vite frontend for IP search, geolocation display, and map visualization.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment file and set API URL:
   ```bash
   cp .env.example .env
   ```
3. Start development server:
   ```bash
   npm run dev
   ```

The app runs on `http://localhost:5173` by default.

## Required Environment Variables

- `VITE_API_URL` (example: `http://localhost:8000`)
- `VITE_IPINFO_TOKEN` (optional)

## Test Credentials

- Email: `user@example.com`
- Password: `password123`

- Email: `test@example.com`
- Password: `password123`

## Deploy to Vercel

1. Push this `web` folder to a Git repository.
2. Import the repo/project in Vercel.
3. Set project root to `web`.
4. Add environment variables in Vercel:
   - `VITE_API_URL` (pointing to your deployed API)
   - `VITE_IPINFO_TOKEN` (optional)
5. Deploy.
