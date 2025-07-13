import { MGRSService } from './mgrsService';
import type { 
  GunPosition,
  MultiGunSpread,
  SynchronizedFireSolution,
  LoadDistribution,
  FireSolution
} from '../types/mission';

/**
 * Multi-gun Calculations Service
 * Handles gun spread calculations, synchronized firing solutions, and load distribution
 */
export class MultiGunService {
  
  /**
   * Calculate gun positions based on formation type and parameters
   */
  static calculateGunSpread(
    basePosition: string,
    numberOfGuns: number,
    formation: MultiGunSpread['formation'],
    spacing: number,
    orientation: number = 0
  ): MultiGunSpread {
    const gunPositions: GunPosition[] = [];
    
    // Base gun is always at position 0
    gunPositions.push({
      id: 'gun-1',
      name: 'Gun 1',
      position: basePosition,
      azimuthOffset: 0,
      elevationOffset: 0,
      status: 'active',
      created: new Date()
    });

    if (numberOfGuns === 1) {
      return {
        formation,
        spacing,
        orientation,
        totalSpread: 0,
        gunPositions
      };
    }

    switch (formation) {
      case 'line':
        // Linear formation perpendicular to orientation
        for (let i = 1; i < numberOfGuns; i++) {
          const distance = spacing * i;
          const gunPosition = this.calculatePositionFromBearing(
            basePosition,
            orientation + 1600, // Perpendicular to orientation (90 degrees in mils)
            distance
          );
          
          gunPositions.push({
            id: `gun-${i + 1}`,
            name: `Gun ${i + 1}`,
            position: gunPosition,
            azimuthOffset: 0, // Will be calculated per target
            elevationOffset: 0,
            status: 'active',
            created: new Date()
          });
        }
        break;

      case 'arc': {
        // Arc formation with guns spread in an arc
        const arcAngle = Math.min(800, (numberOfGuns - 1) * 200); // Max 800 mils arc
        const angleStep = numberOfGuns > 1 ? arcAngle / (numberOfGuns - 1) : 0;
        
        for (let i = 1; i < numberOfGuns; i++) {
          const bearing = orientation - (arcAngle / 2) + (angleStep * i);
          const gunPosition = this.calculatePositionFromBearing(
            basePosition,
            bearing,
            spacing
          );
          
          gunPositions.push({
            id: `gun-${i + 1}`,
            name: `Gun ${i + 1}`,
            position: gunPosition,
            azimuthOffset: 0,
            elevationOffset: 0,
            status: 'active',
            created: new Date()
          });
        }
        break;
      }

      case 'dispersed': {
        // Dispersed formation with guns in a loose diamond/box pattern
        const positions = this.calculateDispersedPositions(basePosition, numberOfGuns, spacing);
        for (let i = 1; i < numberOfGuns; i++) {
          gunPositions.push({
            id: `gun-${i + 1}`,
            name: `Gun ${i + 1}`,
            position: positions[i],
            azimuthOffset: 0,
            elevationOffset: 0,
            status: 'active',
            created: new Date()
          });
        }
        break;
      }

      case 'custom':
        // Custom formation - guns placed manually
        // For now, default to line formation
        for (let i = 1; i < numberOfGuns; i++) {
          const distance = spacing * i;
          const gunPosition = this.calculatePositionFromBearing(
            basePosition,
            orientation + 1600,
            distance
          );
          
          gunPositions.push({
            id: `gun-${i + 1}`,
            name: `Gun ${i + 1}`,
            position: gunPosition,
            azimuthOffset: 0,
            elevationOffset: 0,
            status: 'active',
            created: new Date()
          });
        }
        break;
    }

    return {
      formation,
      spacing,
      orientation,
      totalSpread: this.calculateTotalSpread(gunPositions),
      gunPositions
    };
  }

  /**
   * Calculate synchronized firing solution for multiple guns
   */
  static calculateSynchronizedFireSolution(
    gunSpread: MultiGunSpread,
    targetGrid: string,
    masterFireSolution: FireSolution,
    simultaneousImpact: boolean = true
  ): SynchronizedFireSolution {
    const gunSolutions = [];
    let maxTimeOfFlight = masterFireSolution.timeOfFlight;

    // Calculate individual gun solutions
    for (const gun of gunSpread.gunPositions) {
      const gunToTarget = MGRSService.calculateFireMission(gun.position, targetGrid);
      
      // Calculate corrections relative to master gun
      const azimuthCorrection = gunToTarget.azimuthMils - masterFireSolution.azimuthMils;
      
      // Estimate elevation correction based on range difference
      // This is a simplified calculation - in reality would need ballistic tables
      const rangeDifference = gunToTarget.distanceMeters - masterFireSolution.rangeMeters;
      const elevationCorrection = Math.round(rangeDifference * 0.1); // Rough approximation
      
      const gunSolution: FireSolution = {
        azimuthMils: gunToTarget.azimuthMils,
        elevationMils: masterFireSolution.elevationMils + elevationCorrection,
        chargeLevel: masterFireSolution.chargeLevel,
        timeOfFlight: masterFireSolution.timeOfFlight, // Simplified - would vary with range
        rangeMeters: gunToTarget.distanceMeters
      };

      if (gunSolution.timeOfFlight > maxTimeOfFlight) {
        maxTimeOfFlight = gunSolution.timeOfFlight;
      }

      gunSolutions.push({
        gunId: gun.id,
        gunName: gun.name,
        position: gun.position,
        fireSolution: gunSolution,
        azimuthCorrection,
        elevationCorrection,
        timeDelay: simultaneousImpact ? maxTimeOfFlight - gunSolution.timeOfFlight : 0
      });
    }

    // Update time delays for simultaneous impact
    if (simultaneousImpact) {
      gunSolutions.forEach(solution => {
        solution.timeDelay = maxTimeOfFlight - solution.fireSolution.timeOfFlight;
      });
    }

    // Calculate spread pattern
    const spreadPattern = this.calculateSpreadPattern(gunSolutions, targetGrid);

    return {
      targetGrid,
      masterGunSolution: masterFireSolution,
      gunSolutions,
      simultaneousImpact,
      totalTimeOfFlight: maxTimeOfFlight,
      spreadPattern
    };
  }

  /**
   * Calculate load distribution across multiple guns
   */
  static calculateLoadDistribution(
    numberOfGuns: number,
    totalRounds: number,
    method: LoadDistribution['distributionMethod'] = 'equal',
    priorities?: Array<{ gunId: string; priority: number }>
  ): LoadDistribution {
    const gunAssignments = [];
    const firingSequence = [];

    switch (method) {
      case 'equal': {
        // Distribute rounds equally across all guns
        const roundsPerGun = Math.floor(totalRounds / numberOfGuns);
        const remainderRounds = totalRounds % numberOfGuns;

        for (let i = 0; i < numberOfGuns; i++) {
          const gunId = `gun-${i + 1}`;
          const extraRound = i < remainderRounds ? 1 : 0;
          
          gunAssignments.push({
            gunId,
            gunName: `Gun ${i + 1}`,
            assignedRounds: roundsPerGun + extraRound,
            roundType: 'HE', // Default, would be specified per mission
            firingOrder: i + 1,
            justification: `Equal distribution: ${roundsPerGun + extraRound} rounds assigned`
          });
        }
        break;
      }

      case 'weighted':
        // Distribute based on gun capabilities or status
        // For now, implement as equal with slight variations
        for (let i = 0; i < numberOfGuns; i++) {
          const gunId = `gun-${i + 1}`;
          const weight = priorities?.find(p => p.gunId === gunId)?.priority || 1;
          const assignedRounds = Math.max(1, Math.round((totalRounds / numberOfGuns) * weight));
          
          gunAssignments.push({
            gunId,
            gunName: `Gun ${i + 1}`,
            assignedRounds,
            roundType: 'HE',
            firingOrder: i + 1,
            justification: `Weighted distribution based on gun priority (${weight})`
          });
        }
        break;

      case 'priority': {
        // Assign rounds based on gun priority order
        const sortedPriorities = priorities?.sort((a, b) => b.priority - a.priority) || [];
        let remainingRounds = totalRounds;
        
        for (let i = 0; i < numberOfGuns && remainingRounds > 0; i++) {
          const gunId = sortedPriorities[i]?.gunId || `gun-${i + 1}`;
          const assignedRounds = Math.min(remainingRounds, Math.ceil(totalRounds / numberOfGuns));
          remainingRounds -= assignedRounds;
          
          gunAssignments.push({
            gunId,
            gunName: `Gun ${i + 1}`,
            assignedRounds,
            roundType: 'HE',
            firingOrder: i + 1,
            justification: `Priority assignment: High priority gun receives ${assignedRounds} rounds`
          });
        }
        break;
      }

      case 'custom':
        // Custom distribution would be specified manually
        // For now, fall back to equal distribution
        for (let i = 0; i < numberOfGuns; i++) {
          const gunId = `gun-${i + 1}`;
          
          gunAssignments.push({
            gunId,
            gunName: `Gun ${i + 1}`,
            assignedRounds: Math.floor(totalRounds / numberOfGuns),
            roundType: 'HE',
            firingOrder: i + 1,
            justification: 'Custom distribution (manual assignment required)'
          });
        }
        break;
    }

    // Create firing sequence
    const phasesNeeded = Math.max(...gunAssignments.map(assignment => assignment.assignedRounds));
    
    for (let phase = 1; phase <= phasesNeeded; phase++) {
      const gunsInPhase = gunAssignments
        .filter(assignment => assignment.assignedRounds >= phase)
        .map(assignment => assignment.gunId);
      
      if (gunsInPhase.length > 0) {
        firingSequence.push({
          phase,
          guns: gunsInPhase,
          roundsPerGun: 1,
          interval: 10 // 10 seconds between phases
        });
      }
    }

    return {
      totalRounds,
      distributionMethod: method,
      gunAssignments,
      firingSequence
    };
  }

  /**
   * Helper method to calculate position from bearing and distance
   */
  private static calculatePositionFromBearing(
    basePosition: string,
    bearingMils: number,
    distanceMeters: number
  ): string {
    try {
      // Use MGRS service to calculate new position
      return MGRSService.calculateTargetFromPolar(basePosition, bearingMils, distanceMeters);
    } catch (error) {
      console.warn('Failed to calculate position from bearing:', error);
      return basePosition; // Fallback to base position
    }
  }

  /**
   * Helper method to calculate dispersed positions
   */
  private static calculateDispersedPositions(
    basePosition: string,
    numberOfGuns: number,
    spacing: number
  ): string[] {
    const positions = [basePosition];
    
    // Create a diamond/box pattern
    const bearings = [0, 1600, 3200, 4800]; // N, E, S, W in mils
    let bearingIndex = 0;
    
    for (let i = 1; i < numberOfGuns; i++) {
      const bearing = bearings[bearingIndex % bearings.length];
      const distance = spacing * Math.ceil(i / bearings.length);
      
      const position = this.calculatePositionFromBearing(basePosition, bearing, distance);
      positions.push(position);
      
      bearingIndex++;
    }
    
    return positions;
  }

  /**
   * Helper method to calculate total spread of gun positions
   */
  private static calculateTotalSpread(gunPositions: GunPosition[]): number {
    if (gunPositions.length <= 1) return 0;
    
    let maxDistance = 0;
    
    for (let i = 0; i < gunPositions.length; i++) {
      for (let j = i + 1; j < gunPositions.length; j++) {
        try {
          const distance = MGRSService.calculateFireMission(
            gunPositions[i].position,
            gunPositions[j].position
          ).distanceMeters;
          
          if (distance > maxDistance) {
            maxDistance = distance;
          }
        } catch (error) {
          console.warn('Failed to calculate distance between gun positions:', error);
        }
      }
    }
    
    return Math.round(maxDistance);
  }

  /**
   * Helper method to calculate spread pattern of impacts
   */
  private static calculateSpreadPattern(
    gunSolutions: SynchronizedFireSolution['gunSolutions'],
    targetGrid: string
  ): SynchronizedFireSolution['spreadPattern'] {
    // Simplified calculation - in reality would need more complex ballistic modeling
    const ranges = gunSolutions.map(gs => gs.fireSolution.rangeMeters);
    const minRange = Math.min(...ranges);
    const maxRange = Math.max(...ranges);
    
    return {
      width: Math.round((maxRange - minRange) * 0.1), // Rough estimate
      depth: Math.round((maxRange - minRange) * 0.05), // Rough estimate
      center: targetGrid
    };
  }

  /**
   * Validate gun spread configuration
   */
  static validateGunSpread(gunSpread: MultiGunSpread): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (gunSpread.gunPositions.length === 0) {
      errors.push('At least one gun position is required');
    }
    
    if (gunSpread.spacing < 10) {
      errors.push('Gun spacing should be at least 10 meters for safety');
    }
    
    if (gunSpread.spacing > 1000) {
      errors.push('Gun spacing should not exceed 1000 meters for effective control');
    }
    
    // Check for duplicate positions
    const positions = gunSpread.gunPositions.map(gun => gun.position);
    const uniquePositions = new Set(positions);
    if (uniquePositions.size !== positions.length) {
      errors.push('Duplicate gun positions detected');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate multi-gun fire commands
   */
  static generateMultiGunFireCommands(
    synchronizedSolution: SynchronizedFireSolution,
    loadDistribution: LoadDistribution,
    roundType: string = 'HE'
  ): Array<{ gunId: string; gunName: string; command: string }> {
    const commands = [];
    
    for (const gunSolution of synchronizedSolution.gunSolutions) {
      const gunLoad = loadDistribution.gunAssignments.find(
        assignment => assignment.gunId === gunSolution.gunId
      );
      
      const rounds = gunLoad?.assignedRounds || 1;
      const timeDelay = gunSolution.timeDelay > 0 ? `, Delay ${gunSolution.timeDelay}s` : '';
      
      const command = `"${gunSolution.gunName}, ${rounds} rounds ${roundType}, ` +
                     `${gunSolution.fireSolution.chargeLevel}, ` +
                     `Deflection ${gunSolution.fireSolution.azimuthMils}, ` +
                     `Elevation ${gunSolution.fireSolution.elevationMils}${timeDelay}, ` +
                     `Fire when ready, Over"`;
      
      commands.push({
        gunId: gunSolution.gunId,
        gunName: gunSolution.gunName,
        command
      });
    }
    
    return commands;
  }
}
