/**
 * Data compression and lazy loading utilities for ballistic data
 */

interface CompressedDataCache {
  [key: string]: {
    data: any[];
    timestamp: number;
    compressed: boolean;
  };
}

class DataManager {
  private cache: CompressedDataCache = {};
  private readonly CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

  /**
   * Lazy load data only when needed
   */
  async loadBallisticData(roundType: string): Promise<any[]> {
    const cacheKey = `ballistic_${roundType}`;
    
    // Check cache first
    if (this.cache[cacheKey] && 
        Date.now() - this.cache[cacheKey].timestamp < this.CACHE_DURATION) {
      return this.cache[cacheKey].data;
    }

    try {
      // Only load the specific round type needed
      const response = await fetch(`/data/${this.getDataFileName(roundType)}`, {
        headers: {
          'Accept-Encoding': 'gzip, deflate, br'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load ${roundType} data: ${response.statusText}`);
      }

      const csvText = await response.text();
      const data = this.parseCSV(csvText);
      
      // Cache the parsed data
      this.cache[cacheKey] = {
        data,
        timestamp: Date.now(),
        compressed: true
      };

      return data;
    } catch (error) {
      console.error(`Error loading ballistic data for ${roundType}:`, error);
      return [];
    }
  }

  /**
   * Load only essential data for initial render
   */
  async loadEssentialData(): Promise<{
    systems: any[];
    rounds: any[];
  }> {
    // Load minimal system and round data first
    const essentialData = {
      systems: [
        { id: 1, name: 'M252', caliberMm: 81, nationality: 'US' }
      ],
      rounds: [
        { id: 1, name: 'M821 HE', roundType: 'HE', caliberMm: 81, nationality: 'US' },
        { id: 2, name: 'M819 Smoke', roundType: 'Smoke', caliberMm: 81, nationality: 'US' },
        { id: 3, name: 'M853A1 Illum', roundType: 'Illumination', caliberMm: 81, nationality: 'US' },
        { id: 4, name: 'M879 Practice', roundType: 'Practice', caliberMm: 81, nationality: 'US' }
      ]
    };

    return essentialData;
  }

  /**
   * Preload data in the background after initial render
   */
  async preloadAllData(): Promise<void> {
    const roundTypes = ['HE', 'Smoke', 'Illumination', 'Practice'];
    
    // Use requestIdleCallback to load during idle time
    if ('requestIdleCallback' in window) {
      roundTypes.forEach((roundType, index) => {
        (window as any).requestIdleCallback(() => {
          this.loadBallisticData(roundType);
        }, { timeout: 5000 + (index * 1000) });
      });
    } else {
      // Fallback: use setTimeout with staggered loading
      roundTypes.forEach((roundType, index) => {
        setTimeout(() => {
          this.loadBallisticData(roundType);
        }, 1000 + (index * 500));
      });
    }
  }

  private getDataFileName(roundType: string): string {
    const fileMap: { [key: string]: string } = {
      'HE': 'M821_HE_mortar_data.csv',
      'Smoke': 'M819_Smoke_Shell_Ballistics.csv',
      'Illumination': 'M853A1_Illumination_Round_Ballistics.csv',
      'Practice': 'M879_Practice_Round_Ballistics.csv'
    };
    
    return fileMap[roundType] || fileMap['HE'];
  }

  private parseCSV(csvText: string): any[] {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index];
        });
        return obj;
      });
  }

  /**
   * Clear cache to free memory
   */
  clearCache(): void {
    this.cache = {};
  }
}

export const dataManager = new DataManager();
