import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB } from './db.js';
import routes from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database
initDB();

// Middleware
app.use(cors()); // Allow all for local dev
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api', routes); // Prefix all with /api

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Start Server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Test users:
    - verna.schamberger@test.local (Admin) / password123
    - luther.jacobs@test.local (Master Trainer) / password123
    - gayle.harvey@test.local (Trainer) / password123
    - Werner69@hotmail.com (Student) / password123`);
  });
}

export default app; // For testing if needed
