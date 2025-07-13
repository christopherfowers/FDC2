export interface FireMissionRecord {
  id: string;
  timestamp: Date;
  missionId?: string;  // Optional mission ID for mission-based tracking
  observerGrid: string;
  mortarGrid: string;
  targetGrid: string;
  system: string;
  round: string;
  fireCommand: string;
  fireSolution: {
    azimuthMils: number;
    elevationMils: number;
    chargeLevel: string;
    timeOfFlight: number;
    rangeMeters: number;
    quadrant?: number;
  };
  adjustments?: {
    rangeAdjustmentM: number;
    directionAdjustmentMils: number;
    adjustedTargetGrid: string;
  };
  notes?: string;
  isUsingMortarAsObserver?: boolean;
}

// Interface for stored records (with timestamp as string)
interface StoredFireMissionRecord extends Omit<FireMissionRecord, 'timestamp'> {
  timestamp: string;
}

export interface FireMissionSummary {
  id: string;
  timestamp: Date;
  targetGrid: string;
  system: string;
  round: string;
  fireCommand: string;
  hasAdjustments: boolean;
}

class FireMissionHistoryService {
  private readonly STORAGE_KEY = 'fdc-fire-mission-history';
  private readonly MAX_HISTORY_SIZE = 100; // Keep last 100 missions

  /**
   * Save a fire mission to history
   */
  saveMission(mission: Omit<FireMissionRecord, 'id' | 'timestamp'>): string {
    const id = this.generateId();
    const timestamp = new Date();

    const record: FireMissionRecord = {
      id,
      timestamp,
      ...mission
    };

    const history = this.getHistory();
    history.unshift(record); // Add to beginning

    // Trim to max size
    if (history.length > this.MAX_HISTORY_SIZE) {
      history.splice(this.MAX_HISTORY_SIZE);
    }

    this.saveHistory(history);
    return id;
  }

  /**
   * Get all fire missions in history
   */
  getHistory(): FireMissionRecord[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      // Convert timestamp strings back to Date objects
      return parsed.map((record: StoredFireMissionRecord) => ({
        ...record,
        timestamp: new Date(record.timestamp)
      }));
    } catch (error) {
      console.warn('Failed to load fire mission history:', error);
      return [];
    }
  }

  /**
   * Get fire missions by mission ID
   */
  getHistoryByMission(missionId: string): FireMissionRecord[] {
    return this.getHistory().filter(record => record.missionId === missionId);
  }

  /**
   * Get mission statistics
   */
  getMissionStatistics(missionId: string): {
    totalFireMissions: number;
    totalRounds: number;
    averageTimeOfFlight: number;
    mostUsedRound: string;
    lastFireMission?: Date;
  } {
    const missions = this.getHistoryByMission(missionId);
    
    if (missions.length === 0) {
      return {
        totalFireMissions: 0,
        totalRounds: 0,
        averageTimeOfFlight: 0,
        mostUsedRound: 'None'
      };
    }

    const totalRounds = missions.length; // Assuming 1 record = 1 round fired
    const avgTimeOfFlight = missions.reduce((sum, m) => sum + m.fireSolution.timeOfFlight, 0) / missions.length;
    
    // Find most used round
    const roundCounts: Record<string, number> = {};
    missions.forEach(m => {
      roundCounts[m.round] = (roundCounts[m.round] || 0) + 1;
    });
    const mostUsedRound = Object.entries(roundCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];

    return {
      totalFireMissions: missions.length,
      totalRounds,
      averageTimeOfFlight: Number(avgTimeOfFlight.toFixed(1)),
      mostUsedRound,
      lastFireMission: missions[0]?.timestamp // Assuming sorted by newest first
    };
  }

  /**
   * Get fire mission summaries for quick display
   */
  getHistorySummary(): FireMissionSummary[] {
    return this.getHistory().map(record => ({
      id: record.id,
      timestamp: record.timestamp,
      targetGrid: record.targetGrid,
      system: record.system,
      round: record.round,
      fireCommand: record.fireCommand,
      hasAdjustments: !!record.adjustments
    }));
  }

  /**
   * Get a specific fire mission by ID
   */
  getMission(id: string): FireMissionRecord | null {
    const history = this.getHistory();
    return history.find(record => record.id === id) || null;
  }

  /**
   * Delete a fire mission
   */
  deleteMission(id: string): boolean {
    const history = this.getHistory();
    const index = history.findIndex(record => record.id === id);

    if (index === -1) return false;

    history.splice(index, 1);
    this.saveHistory(history);
    return true;
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get recent missions (last N)
   */
  getRecentMissions(count: number = 5): FireMissionSummary[] {
    return this.getHistorySummary().slice(0, count);
  }

  /**
   * Search history by target grid or notes
   */
  searchHistory(query: string): FireMissionSummary[] {
    const lowerQuery = query.toLowerCase();
    return this.getHistorySummary().filter(mission =>
      mission.targetGrid.toLowerCase().includes(lowerQuery) ||
      mission.fireCommand.toLowerCase().includes(lowerQuery) ||
      mission.system.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Export history as JSON
   */
  exportHistory(): string {
    return JSON.stringify(this.getHistory(), null, 2);
  }

  /**
   * Import history from JSON
   */
  importHistory(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData);
      if (!Array.isArray(imported)) throw new Error('Invalid format');

      // Validate structure
      for (const record of imported) {
        if (!record.id || !record.timestamp || !record.fireCommand) {
          throw new Error('Invalid record structure');
        }
      }

      // Convert timestamps and save
      const history = imported.map((record: StoredFireMissionRecord) => ({
        ...record,
        timestamp: new Date(record.timestamp)
      }));

      this.saveHistory(history);
      return true;
    } catch (error) {
      console.error('Failed to import history:', error);
      return false;
    }
  }

  private saveHistory(history: FireMissionRecord[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save fire mission history:', error);
    }
  }

  private generateId(): string {
    return `fm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const fireMissionHistoryService = new FireMissionHistoryService();
