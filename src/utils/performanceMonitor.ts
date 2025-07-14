/**
 * Performance monitoring and optimization utilities
 */

interface PerformanceMetrics {
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
  timeToInteractive?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observer: PerformanceObserver | null = null;

  constructor() {
    this.initializeObserver();
    this.measureCoreWebVitals();
  }

  private initializeObserver(): void {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      try {
        this.observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] });
      } catch (e) {
        // Fallback for older browsers
        console.warn('Some performance metrics not available:', e);
      }
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          this.metrics.firstContentfulPaint = entry.startTime;
        }
        break;
      case 'largest-contentful-paint':
        this.metrics.largestContentfulPaint = entry.startTime;
        break;
      case 'layout-shift':
        // Accumulate CLS
        if (!(entry as any).hadRecentInput) {
          this.metrics.cumulativeLayoutShift = 
            (this.metrics.cumulativeLayoutShift || 0) + (entry as any).value;
        }
        break;
      case 'first-input':
        this.metrics.firstInputDelay = (entry as any).processingStart - entry.startTime;
        break;
    }

    // Report metrics when we have meaningful data
    this.reportMetrics();
  }

  private measureCoreWebVitals(): void {
    // Measure Time to Interactive (TTI) approximation
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        this.metrics.timeToInteractive = performance.now();
      });
    }
  }

  private reportMetrics(): void {
    // Only report if we have some metrics
    const hasMetrics = Object.keys(this.metrics).length > 0;
    if (!hasMetrics) return;

    console.group('🚀 FDC2 Performance Metrics');
    
    if (this.metrics.firstContentfulPaint) {
      console.log(`🎨 First Contentful Paint: ${this.metrics.firstContentfulPaint.toFixed(1)}ms`);
    }
    
    if (this.metrics.largestContentfulPaint) {
      console.log(`🖼️ Largest Contentful Paint: ${this.metrics.largestContentfulPaint.toFixed(1)}ms`);
      this.evaluateLCP(this.metrics.largestContentfulPaint);
    }
    
    if (this.metrics.cumulativeLayoutShift !== undefined) {
      console.log(`📐 Cumulative Layout Shift: ${this.metrics.cumulativeLayoutShift.toFixed(3)}`);
      this.evaluateCLS(this.metrics.cumulativeLayoutShift);
    }
    
    if (this.metrics.firstInputDelay) {
      console.log(`⚡ First Input Delay: ${this.metrics.firstInputDelay.toFixed(1)}ms`);
      this.evaluateFID(this.metrics.firstInputDelay);
    }
    
    if (this.metrics.timeToInteractive) {
      console.log(`🎯 Time to Interactive: ${this.metrics.timeToInteractive.toFixed(1)}ms`);
    }

    console.groupEnd();
  }

  private evaluateLCP(value: number): void {
    if (value <= 2500) {
      console.log('✅ LCP: Good');
    } else if (value <= 4000) {
      console.log('⚠️ LCP: Needs Improvement');
    } else {
      console.log('❌ LCP: Poor - Consider optimizing largest contentful element');
    }
  }

  private evaluateCLS(value: number): void {
    if (value <= 0.1) {
      console.log('✅ CLS: Good');
    } else if (value <= 0.25) {
      console.log('⚠️ CLS: Needs Improvement');
    } else {
      console.log('❌ CLS: Poor - Reduce layout shifts');
    }
  }

  private evaluateFID(value: number): void {
    if (value <= 100) {
      console.log('✅ FID: Good');
    } else if (value <= 300) {
      console.log('⚠️ FID: Needs Improvement');
    } else {
      console.log('❌ FID: Poor - Optimize JavaScript execution');
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Resource loading optimization
export class ResourceOptimizer {
  private static instance: ResourceOptimizer;
  private loadedResources = new Set<string>();

  public static getInstance(): ResourceOptimizer {
    if (!ResourceOptimizer.instance) {
      ResourceOptimizer.instance = new ResourceOptimizer();
    }
    return ResourceOptimizer.instance;
  }

  /**
   * Lazy load images when they're about to enter viewport
   */
  public setupLazyImages(): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Preload critical resources
   */
  public preloadCriticalResources(): void {
    const criticalResources = [
      '/js/vendor-[hash].js',
      '/css/main-[hash].css'
    ];

    criticalResources.forEach(resource => {
      if (!this.loadedResources.has(resource)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource;
        link.as = resource.endsWith('.js') ? 'script' : 'style';
        document.head.appendChild(link);
        this.loadedResources.add(resource);
      }
    });
  }

  /**
   * Set up service worker for caching
   */
  public setupServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('✅ SW registered:', registration);
          })
          .catch(registrationError => {
            console.log('❌ SW registration failed:', registrationError);
          });
      });
    }
  }
}

// Initialize performance monitoring
export const performanceMonitor = new PerformanceMonitor();

// Export for global use
declare global {
  interface Window {
    fdcPerformance: PerformanceMonitor;
  }
}

if (typeof window !== 'undefined') {
  window.fdcPerformance = performanceMonitor;
}
