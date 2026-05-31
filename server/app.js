const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const errorHandler = require('./middlewares/errorHandler');

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

let ordersRoutes = null;
let stockageRoutes = null;

try {
  ordersRoutes = require('./routes/orders');
} catch (err) {
  console.error('Unable to load orders routes:', err);
}

try {
  stockageRoutes = require('./routes/stockage');
} catch (err) {
  console.error('Unable to load stockage routes:', err);
}

if (ordersRoutes) {
  app.use('/api/orders', ordersRoutes);
}

if (stockageRoutes) {
  app.use('/api/stockage', stockageRoutes);
}

app.use(errorHandler);

module.exports = app;
