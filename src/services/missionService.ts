import type { 
  Mission, 
  MissionSummary, 
  CreateMissionData, 
  CreateFPFTargetData, 
  FPFTarget,
  MissionPhase,
  MissionStatus 
} from '../types/mission';

class MissionService {
  private readonly STORAGE_KEY = 'fdc-missions';
  private readonly CURRENT_MISSION_KEY = 'fdc-current-mission-id';
  private readonly MISSION_PHASE_KEY = 'fdc-mission-phase';

  /**
   * Generate a unique ID for missions and targets
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all missions from storage
   */
  private getAllMissions(): Mission[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored) as Mission[];
      // Convert date strings back to Date objects
      return parsed.map((mission) => ({
        ...mission,
        created: new Date(mission.created),
        lastModified: new Date(mission.lastModified),
        fpfTargets: mission.fpfTargets.map((target) => ({
          ...target,
          created: new Date(target.created),
          lastCalculated: target.lastCalculated ? new Date(target.lastCalculated) : undefined
        })),
        fireMissions: mission.fireMissions.map((fm) => ({
          ...fm,
          timestamp: new Date(fm.timestamp),
          corrections: fm.corrections.map((correction) => ({
            ...correction,
            timestamp: new Date(correction.timestamp)
          }))
        }))
      }));
    } catch (error) {
      console.warn('Failed to load missions:', error);
      return [];
    }
  }

  /**
   * Save missions to storage
   */
  private saveMissions(missions: Mission[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(missions));
    } catch (error) {
      console.error('Failed to save missions:', error);
      throw new Error('Failed to save mission data');
    }
  }

  /**
   * Create a new mission
   */
  async createMission(missionData: CreateMissionData): Promise<string> {
    const id = this.generateId();
    const now = new Date();

    const mission: Mission = {
      id,
      ...missionData,
      status: 'prep',
      currentPhase: 'prep',
      fpfTargets: [],
      fireMissions: [],
      created: now,
      lastModified: now
    };

    const missions = this.getAllMissions();
    missions.unshift(mission); // Add to beginning
    this.saveMissions(missions);

    return id;
  }

  /**
   * Get a specific mission by ID
   */
  async getMission(id: string): Promise<Mission | null> {
    const missions = this.getAllMissions();
    return missions.find(m => m.id === id) || null;
  }

  /**
   * Update a mission
   */
  async updateMission(id: string, updates: Partial<Mission>): Promise<void> {
    const missions = this.getAllMissions();
    const index = missions.findIndex(m => m.id === id);
    
    if (index === -1) {
      throw new Error(`Mission with ID ${id} not found`);
    }

    missions[index] = {
      ...missions[index],
      ...updates,
      lastModified: new Date()
    };

    this.saveMissions(missions);
  }

  /**
   * Delete a mission
   */
  async deleteMission(id: string): Promise<void> {
    const missions = this.getAllMissions();
    const filteredMissions = missions.filter(m => m.id !== id);
    
    if (filteredMissions.length === missions.length) {
      throw new Error(`Mission with ID ${id} not found`);
    }

    this.saveMissions(filteredMissions);

    // Clear current mission if it was deleted
    const currentMissionId = this.getCurrentMissionId();
    if (currentMissionId === id) {
      this.setCurrentMissionId(null);
    }
  }

  /**
   * Get mission summaries for listing
   */
  async getMissionSummaries(): Promise<MissionSummary[]> {
    const missions = this.getAllMissions();
    return missions.map(mission => ({
      id: mission.id,
      name: mission.name,
      status: mission.status,
      currentPhase: mission.currentPhase,
      numberOfFPFTargets: mission.fpfTargets.length,
      numberOfFireMissions: mission.fireMissions.length,
      lastModified: mission.lastModified
    }));
  }

  /**
   * Set current active mission
   */
  setCurrentMissionId(id: string | null): void {
    if (id) {
      localStorage.setItem(this.CURRENT_MISSION_KEY, id);
    } else {
      localStorage.removeItem(this.CURRENT_MISSION_KEY);
    }
  }

  /**
   * Get current active mission ID
   */
  getCurrentMissionId(): string | null {
    return localStorage.getItem(this.CURRENT_MISSION_KEY);
  }

  /**
   * Add FPF target to a mission
   */
  async addFPFTarget(missionId: string, targetData: CreateFPFTargetData): Promise<string> {
    const mission = await this.getMission(missionId);
    if (!mission) {
      throw new Error(`Mission with ID ${missionId} not found`);
    }

    const targetId = this.generateId();
    const target: FPFTarget = {
      id: targetId,
      ...targetData,
      created: new Date()
    };

    mission.fpfTargets.push(target);
    await this.updateMission(missionId, { fpfTargets: mission.fpfTargets });

    return targetId;
  }

  /**
   * Update FPF target
   */
  async updateFPFTarget(missionId: string, targetId: string, updates: Partial<FPFTarget>): Promise<void> {
    const mission = await this.getMission(missionId);
    if (!mission) {
      throw new Error(`Mission with ID ${missionId} not found`);
    }

    const targetIndex = mission.fpfTargets.findIndex(t => t.id === targetId);
    if (targetIndex === -1) {
      throw new Error(`FPF target with ID ${targetId} not found`);
    }

    mission.fpfTargets[targetIndex] = {
      ...mission.fpfTargets[targetIndex],
      ...updates
    };

    await this.updateMission(missionId, { fpfTargets: mission.fpfTargets });
  }

  /**
   * Delete FPF target
   */
  async deleteFPFTarget(missionId: string, targetId: string): Promise<void> {
    const mission = await this.getMission(missionId);
    if (!mission) {
      throw new Error(`Mission with ID ${missionId} not found`);
    }

    const filteredTargets = mission.fpfTargets.filter(t => t.id !== targetId);
    if (filteredTargets.length === mission.fpfTargets.length) {
      throw new Error(`FPF target with ID ${targetId} not found`);
    }

    await this.updateMission(missionId, { fpfTargets: filteredTargets });
  }

  /**
   * Advance mission to next phase
   */
  async advancePhase(missionId: string): Promise<void> {
    const mission = await this.getMission(missionId);
    if (!mission) {
      throw new Error(`Mission with ID ${missionId} not found`);
    }

    let nextPhase: MissionPhase;
    let nextStatus: MissionStatus = mission.status;

    switch (mission.currentPhase) {
      case 'prep':
        nextPhase = 'calculate';
        nextStatus = 'active';
        break;
      case 'calculate':
        nextPhase = 'solution';
        break;
      case 'solution':
        // Mission complete
        nextPhase = 'solution'; // Stay in solution phase
        nextStatus = 'complete';
        break;
      default:
        throw new Error(`Invalid phase: ${mission.currentPhase}`);
    }

    await this.updateMission(missionId, { 
      currentPhase: nextPhase,
      status: nextStatus
    });
  }

  /**
   * Set specific phase for a mission
   */
  async setPhase(missionId: string, phase: MissionPhase): Promise<void> {
    const mission = await this.getMission(missionId);
    if (!mission) {
      throw new Error(`Mission with ID ${missionId} not found`);
    }

    await this.updateMission(missionId, { currentPhase: phase });
  }

  /**
   * Clear all mission data (for testing/reset)
   */
  async clearAllData(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.CURRENT_MISSION_KEY);
    localStorage.removeItem(this.MISSION_PHASE_KEY);
  }
}

// Export singleton instance
export const missionService = new MissionService();
