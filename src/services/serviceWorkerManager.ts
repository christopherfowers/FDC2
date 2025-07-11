export interface ServiceWorkerState {
  registration: ServiceWorkerRegistration | null;
  isSupported: boolean;
  isInstalled: boolean;
  isWaitingForUpdate: boolean;
  isOffline: boolean;
}

export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private callbacks: Array<(state: ServiceWorkerState) => void> = [];

  static getInstance(): ServiceWorkerManager {
    if (!this.instance) {
      this.instance = new ServiceWorkerManager();
    }
    return this.instance;
  }

  /**
   * Initialize service worker
   */
  async initialize(): Promise<ServiceWorkerState> {
    if (!('serviceWorker' in navigator)) {
      return this.getState();
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered:', this.registration);

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              this.notifyStateChange();
            }
          });
        }
      });

      // Listen for controller changes (new version activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      // Check for existing update waiting
      if (this.registration.waiting) {
        this.notifyStateChange();
      }

      return this.getState();
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return this.getState();
    }
  }

  /**
   * Update to new version
   */
  async updateToNewVersion(): Promise<void> {
    if (this.registration?.waiting) {
      // Tell the waiting service worker to skip waiting
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  /**
   * Clear all caches
   */
  async clearCaches(): Promise<void> {
    if (!this.registration?.active) return;

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve();
        } else {
          reject(new Error(event.data.error));
        }
      };

      this.registration!.active!.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  }

  /**
   * Get current service worker state
   */
  getState(): ServiceWorkerState {
    const isSupported = 'serviceWorker' in navigator;
    const isInstalled = !!this.registration;
    const isWaitingForUpdate = !!(this.registration?.waiting);
    const isOffline = !navigator.onLine;

    return {
      registration: this.registration,
      isSupported,
      isInstalled,
      isWaitingForUpdate,
      isOffline
    };
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: ServiceWorkerState) => void): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all subscribers of state change
   */
  private notifyStateChange(): void {
    const state = this.getState();
    this.callbacks.forEach(callback => callback(state));
  }

  /**
   * Check if app can work offline
   */
  async isAppCached(): Promise<boolean> {
    if (!('caches' in window)) return false;

    try {
      const cacheNames = await caches.keys();
      return cacheNames.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Prefetch critical data
   */
  async prefetchData(): Promise<void> {
    if (!navigator.onLine) return;

    try {
      // Prefetch CSV data files
      const csvFiles = [
        '/data/M819_Smoke_Shell_Ballistics.csv',
        '/data/M821_HE_mortar_data.csv',
        '/data/M853A1_Illumination_Round_Ballistics.csv',
        '/data/M879_Practice_Round_Ballistics.csv'
      ];

      await Promise.all(
        csvFiles.map(file => fetch(file))
      );

      console.log('Critical CSV data prefetched');
    } catch (error) {
      console.warn('Failed to prefetch CSV data:', error);
    }
  }
}
