import { MGRSService } from './mgrsService';
import type { 
  MortarSystem, 
  MortarRound, 
  MortarRoundData,
  FireSolutionResponse 
} from '../types/mortar';

// Fire mission calculation methods
export type FireMissionMethod = 
  | 'standard'           // Default: Closest range match (current behavior)
  | 'efficiency'         // Lowest charge that can reach target
  | 'speed'             // Fastest time of flight
  | 'high_angle'        // Highest elevation angle (over obstacles)
  | 'area_target';      // Higher dispersion for spread targets

export interface FireMissionOptions {
  method?: FireMissionMethod;
  preferredCharge?: number;        // Optional charge preference
  maxDispersion?: number;          // Max acceptable dispersion for area targets
}

export interface CompleteFiringSolution {
  // Target data
  targetGrid: string;
  targetDistance: number;
  azimuthMils: number;
  backAzimuthMils: number;
  
  // Fire solution
  elevationMils: number;
  chargeLevel: string;
  timeOfFlightS: number;
  avgDispersionM: number;
  interpolated: boolean;
  
  // System info
  mortarSystem: MortarSystem;
  mortarRound: MortarRound;
  
  // Observer adjustment data (optional)
  originalTargetGrid?: string;
  adjustmentApplied?: {
    range: number;
    direction: number;
  };
  observerAzimuthToOriginalTarget?: number;
}

export class FireDirectionService {
  private mortarSystems: MortarSystem[] = [];
  private mortarRounds: MortarRound[] = [];
  private ballisticData: MortarRoundData[] = [];

  /**
   * Initialize service with cached data
   */
  async initialize(systems: MortarSystem[], rounds: MortarRound[], ballistic: MortarRoundData[]) {
    this.mortarSystems = systems;
    this.mortarRounds = rounds;
    this.ballisticData = ballistic;
  }

  /**
   * Get all mortar systems
   */
  getMortarSystems(): MortarSystem[] {
    return this.mortarSystems;
  }

  /**
   * Get mortar rounds, optionally filtered by caliber
   */
  getMortarRounds(caliberMm?: number): MortarRound[] {
    if (!caliberMm) return this.mortarRounds;
    return this.mortarRounds.filter(round => round.caliberMm === caliberMm);
  }

  /**
   * Get compatible rounds for a mortar system
   */
  getCompatibleRounds(mortarSystemId: number): MortarRound[] {
    const system = this.mortarSystems.find(s => s.id === mortarSystemId);
    if (!system) return [];
    return this.getMortarRounds(system.caliberMm);
  }

  /**
   * Get ballistic data for specific mortar system and round
   */
  getBallisticData(mortarSystemId: number, mortarRoundId: number): MortarRoundData[] {
    return this.ballisticData.filter(
      data => data.mortarSystemId === mortarSystemId && data.mortarRoundId === mortarRoundId
    ).sort((a, b) => a.rangeM - b.rangeM);
  }

  /**
   * Determine optimal charge level based on range using actual ballistic data
   */
  private getChargeLevel(mortarSystemId: number, mortarRoundId: number, rangeM: number): string {
    const data = this.getBallisticData(mortarSystemId, mortarRoundId);
    
    if (data.length === 0) {
      return "Charge 0"; // Fallback
    }

    // Find exact match or closest range
    const exactMatch = data.find(d => d.rangeM === rangeM);
    if (exactMatch) {
      return `Charge ${exactMatch.chargeLevel}`;
    }

    // Find the closest data point
    const closest = data.reduce((prev, curr) => 
      Math.abs(curr.rangeM - rangeM) < Math.abs(prev.rangeM - rangeM) ? curr : prev
    );

    return `Charge ${closest.chargeLevel}`;
  }

  /**
   * Get tactical fire solution based on mission requirements
   * Provides multiple calculation methods for different tactical situations
   */
  private getTacticalFireSolution(
    mortarSystemId: number, 
    mortarRoundId: number, 
    rangeM: number,
    method: FireMissionMethod = 'standard',
    options: FireMissionOptions = {}
  ): { solution: FireSolutionResponse; chargeLevel: string; reasoning: string } {
    const data = this.getBallisticData(mortarSystemId, mortarRoundId);
    
    if (data.length === 0) {
      throw new Error('No ballistic data found for this mortar system and round combination');
    }

    // Find all viable data points that can reach the target
    const viableOptions = data.filter(d => Math.abs(d.rangeM - rangeM) <= 50); // Within 50m
    
    if (viableOptions.length === 0) {
      // Fall back to interpolation if no direct matches
      return {
        solution: this.calculateFireSolution(mortarSystemId, mortarRoundId, rangeM),
        chargeLevel: this.getChargeLevel(mortarSystemId, mortarRoundId, rangeM),
        reasoning: 'Interpolated solution - no direct range matches available'
      };
    }

    let selectedOption: MortarRoundData;
    let reasoning: string;

    switch (method) {
      case 'efficiency':
        // Select lowest charge that can reach target
        selectedOption = viableOptions.reduce((best, curr) => 
          curr.chargeLevel < best.chargeLevel ? curr : best
        );
        reasoning = `Efficiency mode: Selected Charge ${selectedOption.chargeLevel} for minimum propellant use and best accuracy (${selectedOption.avgDispersionM}m dispersion)`;
        break;

      case 'speed':
        // Select fastest time of flight
        selectedOption = viableOptions.reduce((best, curr) => 
          curr.timeOfFlightS < best.timeOfFlightS ? curr : best
        );
        reasoning = `Speed mode: Selected Charge ${selectedOption.chargeLevel} for fastest delivery (${selectedOption.timeOfFlightS}s flight time)`;
        break;

      case 'high_angle':
        // Select highest elevation angle (best for obstacles)
        selectedOption = viableOptions.reduce((best, curr) => 
          curr.elevationMils > best.elevationMils ? curr : best
        );
        reasoning = `High angle mode: Selected Charge ${selectedOption.chargeLevel} for maximum trajectory height (${selectedOption.elevationMils} mils elevation)`;
        break;

      case 'area_target': {
        // Select higher dispersion for area targets, but within limits
        const maxDispersion = options.maxDispersion || 35; // Default max dispersion
        const areaOptions = viableOptions.filter(d => d.avgDispersionM <= maxDispersion);
        
        if (areaOptions.length > 0) {
          selectedOption = areaOptions.reduce((best, curr) => 
            curr.avgDispersionM > best.avgDispersionM ? curr : best
          );
          reasoning = `Area target mode: Selected Charge ${selectedOption.chargeLevel} for wider dispersion pattern (${selectedOption.avgDispersionM}m spread)`;
        } else {
          // Fall back to efficiency if no options meet dispersion criteria
          selectedOption = viableOptions.reduce((best, curr) => 
            curr.chargeLevel < best.chargeLevel ? curr : best
          );
          reasoning = `Area target mode: No suitable high-dispersion options, using efficient Charge ${selectedOption.chargeLevel}`;
        }
        break;
      }

      case 'standard':
      default:
        // Original behavior - closest range match
        selectedOption = viableOptions.reduce((prev, curr) => 
          Math.abs(curr.rangeM - rangeM) < Math.abs(prev.rangeM - rangeM) ? curr : prev
        );
        reasoning = `Standard mode: Selected Charge ${selectedOption.chargeLevel} for closest range match`;
        break;
    }

    return {
      solution: {
        rangeM: selectedOption.rangeM,
        elevationMils: selectedOption.elevationMils,
        timeOfFlightS: selectedOption.timeOfFlightS,
        avgDispersionM: selectedOption.avgDispersionM,
        interpolated: false
      },
      chargeLevel: `Charge ${selectedOption.chargeLevel}`,
      reasoning
    };
  }

  /**
   * Calculate fire solution for specific range with high-accuracy interpolation
   * Uses derivative data when available for maximum precision
   */
  calculateFireSolution(
    mortarSystemId: number, 
    mortarRoundId: number, 
    rangeM: number
  ): FireSolutionResponse {
    const data = this.getBallisticData(mortarSystemId, mortarRoundId);
    
    if (data.length === 0) {
      throw new Error('No ballistic data found for this mortar system and round combination');
    }

    // Find exact match
    const exactMatch = data.find(d => d.rangeM === rangeM);
    if (exactMatch) {
      return {
        rangeM: exactMatch.rangeM,
        elevationMils: exactMatch.elevationMils,
        timeOfFlightS: exactMatch.timeOfFlightS,
        avgDispersionM: exactMatch.avgDispersionM,
        interpolated: false
      };
    }

    // Find the closest lower bound data point for interpolation
    const lowerBound = data.filter(d => d.rangeM < rangeM).pop();
    const upperBound = data.find(d => d.rangeM > rangeM);

    if (!lowerBound || !upperBound) {
      throw new Error(`Range ${rangeM}m is outside available ballistic data range`);
    }

    const deltaRange = rangeM - lowerBound.rangeM;
    const deltaRangeIncrements = deltaRange / 100; // Convert to 100m increments
    
    let elevationMils: number;
    let timeOfFlightS: number;
    
    // Use derivative-based interpolation if available (much more accurate)
    if (lowerBound.dElevPer100mMils !== null && lowerBound.dElevPer100mMils !== undefined) {
      // High-accuracy interpolation using derivatives
      elevationMils = lowerBound.elevationMils + (lowerBound.dElevPer100mMils * deltaRangeIncrements);
      elevationMils = Math.round(elevationMils);
    } else {
      // Fallback to linear interpolation
      const rangeDiff = upperBound.rangeM - lowerBound.rangeM;
      const factor = deltaRange / rangeDiff;
      elevationMils = Math.round(
        lowerBound.elevationMils + (upperBound.elevationMils - lowerBound.elevationMils) * factor
      );
    }

    if (lowerBound.dTofPer100mS !== null && lowerBound.dTofPer100mS !== undefined) {
      // High-accuracy interpolation using derivatives
      timeOfFlightS = lowerBound.timeOfFlightS + (lowerBound.dTofPer100mS * deltaRangeIncrements);
      timeOfFlightS = Number(timeOfFlightS.toFixed(1));
    } else {
      // Fallback to linear interpolation
      const rangeDiff = upperBound.rangeM - lowerBound.rangeM;
      const factor = deltaRange / rangeDiff;
      timeOfFlightS = Number(
        (lowerBound.timeOfFlightS + (upperBound.timeOfFlightS - lowerBound.timeOfFlightS) * factor).toFixed(1)
      );
    }

    // For dispersion, use linear interpolation (no derivative data in CSV)
    const rangeDiff = upperBound.rangeM - lowerBound.rangeM;
    const factor = deltaRange / rangeDiff;
    const avgDispersionM = Number(
      (lowerBound.avgDispersionM + (upperBound.avgDispersionM - lowerBound.avgDispersionM) * factor).toFixed(1)
    );

    return {
      rangeM,
      elevationMils,
      timeOfFlightS,
      avgDispersionM,
      interpolated: true
    };
  }

  /**
   * Complete fire mission calculation from observer to target with tactical options
   */
  calculateCompleteFiringSolution(
    observerGrid: string,
    targetGrid: string,
    mortarSystemId: number,
    mortarRoundId: number,
    options: FireMissionOptions = {}
  ): CompleteFiringSolution & { reasoning?: string } {
    // Get system and round info
    const mortarSystem = this.mortarSystems.find(s => s.id === mortarSystemId);
    const mortarRound = this.mortarRounds.find(r => r.id === mortarRoundId);
    
    if (!mortarSystem || !mortarRound) {
      throw new Error('Invalid mortar system or round ID');
    }

    // Calculate target data using MGRS service
    const fireMission = MGRSService.calculateFireMission(observerGrid, targetGrid);
    const targetRange = Math.round(fireMission.distanceMeters);
    
    // Use tactical fire solution if method is specified
    let solution: FireSolutionResponse;
    let chargeLevel: string;
    let reasoning: string | undefined;
    
    if (options.method && options.method !== 'standard') {
      const tacticalResult = this.getTacticalFireSolution(
        mortarSystemId, 
        mortarRoundId, 
        targetRange,
        options.method,
        options
      );
      solution = tacticalResult.solution;
      chargeLevel = tacticalResult.chargeLevel;
      reasoning = tacticalResult.reasoning;
    } else {
      // Standard calculation
      solution = this.calculateFireSolution(
        mortarSystemId, 
        mortarRoundId, 
        targetRange
      );
      chargeLevel = this.getChargeLevel(mortarSystemId, mortarRoundId, targetRange);
    }

    const result: CompleteFiringSolution & { reasoning?: string } = {
      targetGrid,
      targetDistance: fireMission.distanceMeters,
      azimuthMils: fireMission.azimuthMils,
      backAzimuthMils: fireMission.backAzimuthMils,
      elevationMils: solution.elevationMils,
      chargeLevel,
      timeOfFlightS: solution.timeOfFlightS,
      avgDispersionM: solution.avgDispersionM,
      interpolated: solution.interpolated,
      mortarSystem,
      mortarRound
    };
    
    if (reasoning) {
      result.reasoning = reasoning;
    }
    
    return result;
  }

  /**
   * Calculate fire solution with observer adjustments
   * This applies the observer's corrections and recalculates the firing solution
   */
  calculateAdjustedFiringSolution(
    observerGrid: string,
    mortarGrid: string,
    targetGrid: string,
    mortarSystemId: number,
    mortarRoundId: number,
    rangeAdjustmentM: number,
    directionAdjustmentMils: number,
    options: FireMissionOptions = {}
  ): CompleteFiringSolution & { reasoning?: string } {
    // Apply observer adjustment to get new target coordinates
    const adjustment = MGRSService.applyObserverAdjustment(
      observerGrid,
      targetGrid,
      rangeAdjustmentM,
      directionAdjustmentMils
    );

    // Calculate new fire solution for adjusted target
    const solution = this.calculateCompleteFiringSolution(
      mortarGrid,
      adjustment.adjustedTargetGrid,
      mortarSystemId,
      mortarRoundId,
      options
    );

    // Add adjustment information to the result
    return {
      ...solution,
      targetGrid: adjustment.adjustedTargetGrid,
      originalTargetGrid: targetGrid,
      adjustmentApplied: {
        range: rangeAdjustmentM,
        direction: directionAdjustmentMils
      },
      observerAzimuthToOriginalTarget: adjustment.observerAzimuthToTarget
    };
  }

  /**
   * Validate if fire mission is within range capabilities
   */
  isRangeValid(mortarSystemId: number, mortarRoundId: number, rangeM: number): boolean {
    const data = this.getBallisticData(mortarSystemId, mortarRoundId);
    if (data.length === 0) return false;
    
    const minRange = Math.min(...data.map(d => d.rangeM));
    const maxRange = Math.max(...data.map(d => d.rangeM));
    
    return rangeM >= minRange && rangeM <= maxRange;
  }

  /**
   * Get range capabilities for a mortar system and round
   */
  getRangeCapabilities(mortarSystemId: number, mortarRoundId: number): { min: number; max: number } | null {
    const data = this.getBallisticData(mortarSystemId, mortarRoundId);
    if (data.length === 0) return null;
    
    return {
      min: Math.min(...data.map(d => d.rangeM)),
      max: Math.max(...data.map(d => d.rangeM))
    };
  }
}
