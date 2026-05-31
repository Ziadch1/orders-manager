const app = require('./app.js');

const PORT = process.env.PORT || 5000;

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
