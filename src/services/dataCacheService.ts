import type { MortarSystem, MortarRound, MortarRoundData } from '../types/mortar';

const CACHE_VERSION = 'v1';
const DATA_CACHE_KEY = `mortar-data-${CACHE_VERSION}`;
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface CachedData {
  version: string;
  timestamp: number;
  systems: MortarSystem[];
  rounds: MortarRound[];
  ballisticData: MortarRoundData[];
}

export class DataCacheService {
  private static instance: DataCacheService;
  private cache: CachedData | null = null;

  static getInstance(): DataCacheService {
    if (!this.instance) {
      this.instance = new DataCacheService();
    }
    return this.instance;
  }

  /**
   * Load data from cache or fetch from server
   */
  async loadData(forceRefresh = false): Promise<CachedData> {
    // Try to load from cache first
    if (!forceRefresh && this.cache) {
      return this.cache;
    }

    // Try to load from localStorage
    if (!forceRefresh) {
      const cached = localStorage.getItem(DATA_CACHE_KEY);
      if (cached) {
        try {
          const data = JSON.parse(cached) as CachedData;
          // Check if cache is still valid (less than 24 hours old)
          const age = Date.now() - data.timestamp;
          if (age < 24 * 60 * 60 * 1000) {
            this.cache = data;
            return data;
          }
        } catch (error) {
          console.warn('Failed to parse cached data:', error);
        }
      }
    }

    // Fetch fresh data from server
    try {
      const data = await this.fetchDataFromServer();
      this.cache = data;
      
      // Save to localStorage
      localStorage.setItem(DATA_CACHE_KEY, JSON.stringify(data));
      
      return data;
    } catch (error) {
      // If server fetch fails, try to use any cached data as fallback
      const cached = localStorage.getItem(DATA_CACHE_KEY);
      if (cached) {
        try {
          const fallbackData = JSON.parse(cached) as CachedData;
          console.warn('Using cached data as fallback due to server error:', error);
          this.cache = fallbackData;
          return fallbackData;
        } catch (parseError) {
          console.error('Failed to parse fallback cached data:', parseError);
        }
      }
      
      throw new Error('Failed to load data from server and no cached data available');
    }
  }

  /**
   * Fetch fresh data from server
   */
  private async fetchDataFromServer(): Promise<CachedData> {
    const [systemsResponse, roundsResponse, ballisticResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/api/mortar-systems`),
      fetch(`${API_BASE_URL}/api/mortar-rounds`),
      fetch(`${API_BASE_URL}/api/ballistic-data`)
    ]);

    if (!systemsResponse.ok || !roundsResponse.ok || !ballisticResponse.ok) {
      throw new Error('Failed to fetch data from server');
    }

    const [systems, rounds, ballisticData] = await Promise.all([
      systemsResponse.json() as Promise<MortarSystem[]>,
      roundsResponse.json() as Promise<MortarRound[]>,
      ballisticResponse.json() as Promise<any[]> // Will be transformed below
    ]);

    // Transform ballistic data to remove joined fields and keep only core data
    const transformedBallisticData: MortarRoundData[] = ballisticData.map(item => ({
      id: item.id,
      mortarSystemId: item.mortarSystemId,
      mortarRoundId: item.mortarRoundId,
      avgDispersionM: item.avgDispersionM,
      rangeM: item.rangeM,
      elevationMils: item.elevationMils,
      timeOfFlightS: item.timeOfFlightS,
      dElevPer100mMils: item.dElevPer100mMils,
      dTofPer100mS: item.dTofPer100mS
    }));

    return {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      systems,
      rounds,
      ballisticData: transformedBallisticData
    };
  }

  /**
   * Check if there's a newer version available on the server
   */
  async checkForUpdates(): Promise<boolean> {
    if (!this.cache) return true;

    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) return false;

      // For now, we'll use a simple timestamp check
      // In a real app, you might have a version endpoint
      const currentTime = Date.now();
      const cacheAge = currentTime - this.cache.timestamp;
      
      // Consider data stale after 1 hour
      return cacheAge > 60 * 60 * 1000;
    } catch {
      return false; // Don't force update if we can't reach server
    }
  }

  /**
   * Clear cache and force refresh
   */
  clearCache(): void {
    this.cache = null;
    localStorage.removeItem(DATA_CACHE_KEY);
  }

  /**
   * Get cache info for debugging
   */
  getCacheInfo(): { version: string; timestamp: number; age: number } | null {
    if (!this.cache) return null;
    
    return {
      version: this.cache.version,
      timestamp: this.cache.timestamp,
      age: Date.now() - this.cache.timestamp
    };
  }
}
