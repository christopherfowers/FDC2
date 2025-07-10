import express from 'express';
import cors from 'cors';
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
  
  // Configure static middleware with proper options
  app.use(express.static(buildPath, {
    maxAge: '1y', // Cache static assets for 1 year
    etag: true,
    index: false, // Don't serve index.html automatically - let catch-all handle routing
    fallthrough: true // Continue to next middleware if file not found
  }));
  
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

// Catch-all handler for React app - should be the VERY LAST route
if (NODE_ENV === 'production') {
  // Use middleware instead of a route to avoid path-to-regexp issues with Express 5
  app.use((req, res) => {
    // Only handle requests that look like they want HTML (not static assets)
    const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');
    const isApiRoute = req.path.startsWith('/api');
    const isStaticAsset = /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json|xml|txt)$/i.test(req.path);
    
    if (!isApiRoute && !isStaticAsset && (acceptsHtml || req.path === '/' || !req.path.includes('.'))) {
      const indexPath = path.join(__dirname, '../dist/index.html');
      res.sendFile(indexPath);
    } else {
      // Return 404 for unmatched routes
      res.status(404).json({ error: 'Not found' });
    }
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
