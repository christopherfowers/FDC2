import type { MortarSystem, MortarRound, MortarRoundData } from '../types/mortar';

interface CSVRecord {
  MortarSystem: string;
  Shell: string;
  Diameter: string;
  Charge: string;
  AverageDeviation: string;
  Range: string;
  Elevation: string;
  TimeOfFlight: string;
  DElevPer100MDr: string;
  ToFPer100MDr: string;
}

export interface CachedData {
  version: string;
  timestamp: number;
  systems: MortarSystem[];
  rounds: MortarRound[];
  ballisticData: MortarRoundData[];
}

class CSVDataService {
  private static instance: CSVDataService;
  private cache: CachedData | null = null;
  private initialized = false;

  // CSV files to load from /public/data/
  private readonly csvFiles = [
    'M819_Smoke_Shell_Ballistics.csv',
    'M821_HE_mortar_data.csv',
    'M853A1_Illumination_Round_Ballistics.csv',
    'M879_Practice_Round_Ballistics.csv'
  ];

  private readonly CACHE_VERSION = 'csv-v1';
  private readonly LOCAL_STORAGE_KEY = 'csv-mortar-data-cache';

  static getInstance(): CSVDataService {
    if (!this.instance) {
      this.instance = new CSVDataService();
    }
    return this.instance;
  }

  /**
   * Initialize the service by loading and parsing CSV data
   */
  async initialize(forceRefresh = false): Promise<void> {
    if (this.initialized && !forceRefresh && this.cache) {
      return;
    }

    // Try to load from localStorage first
    if (!forceRefresh) {
      const cached = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (cached) {
        try {
          const data = JSON.parse(cached) as CachedData;
          // Check if cache is still valid (less than 24 hours old)
          const age = Date.now() - data.timestamp;
          if (age < 24 * 60 * 60 * 1000) {
            this.cache = data;
            this.initialized = true;
            return;
          }
        } catch (error) {
          console.warn('Failed to parse cached CSV data:', error);
        }
      }
    }

    // Load fresh data from CSV files
    await this.loadFromCSV();
    this.initialized = true;

    // Save to localStorage
    if (this.cache) {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(this.cache));
    }
  }

  /**
   * Load and parse CSV files
   */
  private async loadFromCSV(): Promise<void> {
    try {
      // Fetch all CSV files
      const csvDataPromises = this.csvFiles.map(async (filename) => {
        const response = await fetch(`/data/${filename}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
        }
        const csvText = await response.text();
        return { filename, csvText };
      });

      const csvData = await Promise.all(csvDataPromises);

      // Parse all CSV data
      const allRecords: CSVRecord[] = [];
      for (const { filename, csvText } of csvData) {
        const records = this.parseCSV(csvText);
        console.log(`Loaded ${records.length} records from ${filename}`);
        allRecords.push(...records);
      }

      // Process records into structured data
      const { systems, rounds, ballisticData } = this.processRecords(allRecords);

      this.cache = {
        version: this.CACHE_VERSION,
        timestamp: Date.now(),
        systems,
        rounds,
        ballisticData
      };

      console.log(`CSV data loaded: ${systems.length} systems, ${rounds.length} rounds, ${ballisticData.length} ballistic entries`);

    } catch (error) {
      console.error('Failed to load CSV data:', error);
      throw error;
    }
  }

  /**
   * Parse CSV text into records
   */
  private parseCSV(csvText: string): CSVRecord[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      return [];
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const records: CSVRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= headers.length) {
        const record: Record<string, string> = {};
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });
        records.push(record as unknown as CSVRecord);
      }
    }

    return records;
  }

  /**
   * Process CSV records into structured mortar data with deterministic IDs
   */
  private processRecords(records: CSVRecord[]): {
    systems: MortarSystem[];
    rounds: MortarRound[];
    ballisticData: MortarRoundData[];
  } {
    const systemsMap = new Map<string, MortarSystem>();
    const roundsMap = new Map<string, MortarRound>();
    const ballisticData: MortarRoundData[] = [];

    let systemIdCounter = 1;
    let roundIdCounter = 1;
    let dataIdCounter = 1;

    for (const record of records) {
      // Extract basic data
      const rawSystemName = record.MortarSystem;
      const shellName = record.Shell;
      const diameter = parseInt(record.Diameter, 10);
      const avgDeviation = parseFloat(record.AverageDeviation);
      const range = parseInt(record.Range, 10);
      const elevation = parseInt(record.Elevation, 10);
      const timeOfFlight = parseFloat(record.TimeOfFlight);
      const dElevPer100m = record.DElevPer100MDr ? parseFloat(record.DElevPer100MDr) : null;
      const dTofPer100m = record.ToFPer100MDr ? parseFloat(record.ToFPer100MDr) : null;

      // Skip invalid records
      if (!rawSystemName || !shellName || isNaN(diameter) || isNaN(range) || isNaN(elevation)) {
        continue;
      }

      // Normalize mortar system name - handle inconsistent CSV data
      // M879 Practice CSV has M252, M253, M254, etc. which should all be M252
      const systemName = this.normalizeMortarSystemName(rawSystemName, diameter);

      // Create or get mortar system
      const systemKey = `${systemName}-${diameter}`;
      if (!systemsMap.has(systemKey)) {
        systemsMap.set(systemKey, {
          id: systemIdCounter++,
          name: systemName,
          caliberMm: diameter,
          nationality: null
        });
      }
      const system = systemsMap.get(systemKey)!;

      // Determine round type from shell name
      let roundType = 'Unknown';
      const shellLower = shellName.toLowerCase();
      if (shellLower.includes('he')) {
        roundType = 'HE';
      } else if (shellLower.includes('smoke')) {
        roundType = 'Smoke';
      } else if (shellLower.includes('illum')) {
        roundType = 'Illumination';
      } else if (shellLower.includes('practice')) {
        roundType = 'Practice';
      }

      // Create or get mortar round
      const roundKey = `${shellName}-${diameter}`;
      if (!roundsMap.has(roundKey)) {
        roundsMap.set(roundKey, {
          id: roundIdCounter++,
          name: shellName,
          roundType,
          caliberMm: diameter,
          nationality: null
        });
      }
      const round = roundsMap.get(roundKey)!;

      // Create ballistic data entry
      ballisticData.push({
        id: dataIdCounter++,
        mortarSystemId: system.id,
        mortarRoundId: round.id,
        avgDispersionM: avgDeviation,
        rangeM: range,
        elevationMils: elevation,
        timeOfFlightS: timeOfFlight,
        dElevPer100mMils: dElevPer100m,
        dTofPer100mS: dTofPer100m
      });
    }

    return {
      systems: Array.from(systemsMap.values()),
      rounds: Array.from(roundsMap.values()),
      ballisticData
    };
  }

  /**
   * Normalize mortar system name to handle inconsistent CSV data
   * 
   * ISSUE DISCOVERED: The CSV files have inconsistent formatting:
   * - M821_HE_mortar_data.csv: Uses "M252" consistently (correct)
   * - M819_Smoke_Shell_Ballistics.csv: Uses "M252" consistently (correct) 
   * - M853A1_Illumination_Round_Ballistics.csv: Uses "M252" consistently (correct)
   * - M879_Practice_Round_Ballistics.csv: Uses "M252", "M253", "M254", etc. (incorrect)
   * 
   * The M879 file appears to use sequential IDs (M252, M253, M254...) instead of 
   * the actual mortar system name. All data is actually for the M252 81mm mortar.
   */
  private normalizeMortarSystemName(rawSystemName: string, diameter: number): string {
    // For 81mm systems, if the name starts with M25X, normalize to M252
    if (diameter === 81 && rawSystemName.match(/^M25\d$/)) {
      return 'M252';
    }
    
    // For other cases, return as-is (future-proofing for other mortar systems)
    return rawSystemName;
  }

  /**
   * Get all mortar systems
   */
  async getAllMortarSystems(): Promise<MortarSystem[]> {
    await this.initialize();
    return this.cache?.systems || [];
  }

  /**
   * Get all mortar rounds
   */
  async getAllMortarRounds(): Promise<MortarRound[]> {
    await this.initialize();
    return this.cache?.rounds || [];
  }

  /**
   * Get all ballistic data
   */
  async getAllMortarRoundData(): Promise<MortarRoundData[]> {
    await this.initialize();
    return this.cache?.ballisticData || [];
  }

  /**
   * Get ballistic data for specific system and round
   */
  async getBallisticData(mortarSystemId: number, mortarRoundId: number): Promise<MortarRoundData[]> {
    await this.initialize();
    return this.cache?.ballisticData.filter(
      data => data.mortarSystemId === mortarSystemId && data.mortarRoundId === mortarRoundId
    ) || [];
  }

  /**
   * Get mortar system by ID
   */
  async getMortarSystemById(id: number): Promise<MortarSystem | null> {
    await this.initialize();
    return this.cache?.systems.find(system => system.id === id) || null;
  }

  /**
   * Get mortar round by ID
   */
  async getMortarRoundById(id: number): Promise<MortarRound | null> {
    await this.initialize();
    return this.cache?.rounds.find(round => round.id === id) || null;
  }

  /**
   * Clear cache and force refresh
   */
  clearCache(): void {
    this.cache = null;
    this.initialized = false;
    localStorage.removeItem(this.LOCAL_STORAGE_KEY);
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

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.cache !== null;
  }
}

// Export singleton instance
export const csvDataService = CSVDataService.getInstance();
