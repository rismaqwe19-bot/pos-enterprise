require('dotenv').config();
const http = require('http');
const app = require('./app');
const db = require('./config/database');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Test database connection
db.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Database connected at:', result.rows[0].now);
  }
});

// Create HTTP server
const server = http.createServer(app);

// Start server
server.listen(PORT, HOST, () => {
  console.log(`
╔════════════════════════════════════════╗
║   POS ENTERPRISE - Backend Server      ║
╠════════════════════════════════════════╣
║  🚀 Server running                      ║
║  📍 URL: http://${HOST}:${PORT}
║  🔌 Database: PostgreSQL                ║
║  📡 API Routes:                         ║
║     - POST   /api/auth/register        ║
║     - POST   /api/auth/login           ║
║     - GET    /api/auth/profile         ║
║     - GET    /api/products             ║
║     - POST   /api/products             ║
║     - GET    /api/transactions         ║
║     - POST   /api/transactions         ║
║     - GET    /api/reports/*            ║
║                                        ║
║  Test: curl http://${HOST}:${PORT}/api/test
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});