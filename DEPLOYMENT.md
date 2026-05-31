# Deployment Guide

This project is prepared for online deployment with:

- Frontend: Vercel
- Backend: Render
- Database: Turso (SQLite-compatible)

## 1. Create the Turso database

1. Sign in to Turso and create a new database.
2. Copy the database URL (`TURSO_DATABASE_URL`).
3. Create an auth token and copy it (`TURSO_AUTH_TOKEN`).
4. Keep both values secure.

## 2. Backend setup on Render

1. Create a new Web Service on Render.
2. Connect your GitHub repo.
3. Set the root directory to the `server` folder.
4. Use the build command:

```bash
npm install
```

5. Use the start command:

```bash
npm start
```

6. Add these environment variables in Render:

- `NODE_ENV=production`
- `TURSO_DATABASE_URL=<your Turso database URL>`
- `TURSO_AUTH_TOKEN=<your Turso auth token>`
- `FRONTEND_URL=https://YOUR-FRONTEND.vercel.app`

7. Deploy the service.

8. Verify the backend health endpoint:

```bash
https://YOUR-BACKEND.onrender.com/api/health
```

It should return:

```json
{ "status": "ok" }
```

## 3. Frontend setup on Vercel

1. Import your GitHub repo into Vercel.
2. Select the `client` folder as the project root.
3. Set the framework to Vite.
4. Use the build command:

```bash
npm run build
```

5. Set the output directory to:

```text
dist
```

6. Add this environment variable in Vercel:

- `VITE_API_URL=https://YOUR-BACKEND.onrender.com`

7. Deploy the frontend.

## 4. Final CORS step

After the frontend is deployed, copy the Vercel URL and update the backend `FRONTEND_URL` variable in Render:

```env
FRONTEND_URL=https://YOUR-FRONTEND.vercel.app
```

Then redeploy the backend.

## 5. Local development

### Backend

1. Copy or create `server/.env` from `server/.env.example`.
2. For local testing, you can keep:

```env
PORT=5000
SQLITE_FILE=./orders.sqlite
```

3. Start the backend:

```bash
cd server
npm install
npm run dev
```

### Frontend

1. Copy or create `client/.env` from `client/.env.example`.
2. For local frontend development leave `VITE_API_URL` empty to use the local proxy.
3. Start the frontend:

```bash
cd client
npm install
npm run dev
```

## 6. Testing checklist

### Backend

- Open `/api/health`
- Expect `{ "status": "ok" }`

### Frontend

- Open the Vercel frontend URL
- Confirm the page loads without blank screen
- Confirm no API URL console errors

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
