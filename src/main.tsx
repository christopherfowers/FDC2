import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Import performance monitoring and optimizations
import { ResourceOptimizer } from './utils/performanceMonitor'

// Initialize performance optimizations
const resourceOptimizer = ResourceOptimizer.getInstance();

// Setup service worker and optimizations
resourceOptimizer.setupServiceWorker();
resourceOptimizer.preloadCriticalResources();

// Setup lazy loading after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  resourceOptimizer.setupLazyImages();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
