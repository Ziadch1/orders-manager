# Deployment Guide

This project is now deployed on Vercel with Turso as the production database.

## 1. Prepare Turso

1. Sign in to Turso and create a new database.
2. Copy the database URL (`TURSO_DATABASE_URL`).
3. Create an auth token and copy it (`TURSO_AUTH_TOKEN`).
4. Keep both values secure.

## 2. Prepare GitHub

1. Commit all changes and push the repository to GitHub.
2. Ensure the following files are present in the root:
   - `vercel.json`
   - `package.json`
   - `api/index.js`
   - `server/app.js`
   - `server/server.js`

## 3. Import repo into Vercel

1. Open Vercel and import the GitHub repository.
2. Use the project root of the repository.
3. Vercel will detect the frontend and API routes automatically using `vercel.json`.

## 4. Add Vercel environment variables

In your Vercel project settings, add:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `NODE_ENV=production`
- `VITE_API_URL=/api`

## 5. Deploy

1. Trigger a Vercel deployment from the dashboard.
2. Vercel will:
   - build the React/Vite frontend from `client/package.json`
   - deploy the Express backend as a serverless function from `api/index.js`

## 6. Test the deployed app

### API

- Open: `https://YOUR-VERCEL-APP.vercel.app/api/health`
- Expected response:

```json
{ "status": "ok" }
```

### Stockage

- Add a product
- Edit product data
- Refresh the page
- Confirm data persists
- Delete a product
- Refresh again
- Confirm deletion remains

### Commandes

- Import Excel
- Edit a row
- Refresh the page
- Confirm data persists
- Export Excel

## 7. Notes

- The frontend now uses `/api` as the default API base URL.
- The backend is exposed under `/api/*` with Express routes such as:
  - `/api/health`
  - `/api/orders`
  - `/api/stockage`
  - `/api/orders/import`
  - `/api/orders/export`
- Production will fail fast if `NODE_ENV=production` is set without Turso credentials.
