const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const ordersRoutes = require('./routes/orders');
const stockageRoutes = require('./routes/stockage');
const errorHandler = require('./middlewares/errorHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'http://localhost:5173',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/orders', ordersRoutes);
app.use('/api/stockage', stockageRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Orders backend running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop the process using this port or set a different PORT in .env.`);
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});
