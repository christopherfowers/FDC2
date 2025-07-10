import * as express from 'express';
import * as cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files in production
if (NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../dist');
  app.use(express.static(buildPath));
  console.log(`🗂️  Serving static files from: ${buildPath}`);
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Simple API endpoint
app.get('/api/test', (_req, res) => {
  res.json({ message: 'API is working!' });
});

// Catch-all handler for React app
if (NODE_ENV === 'production') {
  app.get('*', (_req, res) => {
    const indexPath = path.join(__dirname, '../dist/index.html');
    res.sendFile(indexPath);
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
