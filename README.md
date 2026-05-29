# Store Orders Manager

Full-stack store order management application with Excel import/export, status updates, search, filters, pagination, and summary cards.

## Project structure

- `/client` - React frontend powered by Vite
- `/server` - Express backend with SQLite database

## Backend setup

1. Install dependencies:

```bash
cd server
npm install
```

2. Create the SQLite database file automatically using environment settings.

3. Configure environment variables:

Copy `.env.example` to `.env` and update `SQLITE_FILE` and `PORT` if needed.

4. Start the backend:

```bash
npm run dev
```

The backend runs on `http://localhost:5000` by default.

## Frontend setup

1. Install dependencies:

```bash
cd client
npm install
```

2. Start the frontend:

```bash
npm run dev
```

The frontend runs on `http://localhost:3000` and proxies API requests to the backend.

## Features

- Import `.xlsx` and `.xls` Excel files
- Append new rows without deleting existing orders
- Skip duplicate rows using order ID or phone + product + date
- Display dynamic table columns matching Excel import
- Search by customer, phone, product, city, or order ID
- Filter by order status
- Pagination and sorting
- Update order status directly in the table
- Export current table results to Excel
- Summary cards with total, confirmed, delivered, cancelled, and pending orders

## Available backend routes

- `POST /api/orders/import`
- `GET /api/orders`
- `GET /api/orders/stats`
- `PATCH /api/orders/:id/status`
- `DELETE /api/orders/:id`
- `GET /api/orders/export`

## Notes

- The database schema is flexible: Excel data is stored as JSON text, preserving all imported columns.
- Duplicate detection is enforced by a computed `dedupe_key`.
- Use the `search` and `status` query parameters to filter exports.
