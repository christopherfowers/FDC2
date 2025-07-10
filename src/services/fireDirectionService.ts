import { MGRSService } from './mgrsService';
import type { 
  MortarSystem, 
  MortarRound, 
  MortarRoundData,
  FireSolutionResponse 
} from '../types/mortar';

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
   * Determine optimal charge level based on range
   * Based on standard M252 81mm mortar charge tables
   */
  private getChargeLevel(rangeM: number): string {
    // Based on M252 81mm mortar standard charge ranges
    if (rangeM <= 400) return "Charge 0";
    if (rangeM <= 900) return "Charge 1";
    if (rangeM <= 1600) return "Charge 2";
    if (rangeM <= 2300) return "Charge 3";
    return "Charge 4";
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
   * Complete fire mission calculation from observer to target
   */
  calculateCompleteFiringSolution(
    observerGrid: string,
    targetGrid: string,
    mortarSystemId: number,
    mortarRoundId: number
  ): CompleteFiringSolution {
    // Get system and round info
    const mortarSystem = this.mortarSystems.find(s => s.id === mortarSystemId);
    const mortarRound = this.mortarRounds.find(r => r.id === mortarRoundId);
    
    if (!mortarSystem || !mortarRound) {
      throw new Error('Invalid mortar system or round ID');
    }

    // Calculate target data using MGRS service
    const fireMission = MGRSService.calculateFireMission(observerGrid, targetGrid);
    
    // Calculate fire solution
    const solution = this.calculateFireSolution(
      mortarSystemId, 
      mortarRoundId, 
      Math.round(fireMission.distanceMeters)
    );

    return {
      targetGrid,
      targetDistance: fireMission.distanceMeters,
      azimuthMils: fireMission.azimuthMils,
      backAzimuthMils: fireMission.backAzimuthMils,
      elevationMils: solution.elevationMils,
      chargeLevel: this.getChargeLevel(Math.round(fireMission.distanceMeters)),
      timeOfFlightS: solution.timeOfFlightS,
      avgDispersionM: solution.avgDispersionM,
      interpolated: solution.interpolated,
      mortarSystem,
      mortarRound
    };
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
    directionAdjustmentMils: number
  ): CompleteFiringSolution {
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
      mortarRoundId
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
