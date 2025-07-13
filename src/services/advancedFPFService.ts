import type { Mission, FPFTarget, FPFSector, FPFCoverageAnalysis, FPFFireDistribution } from '../types/mission';

/**
 * Advanced FPF Management Service
 * Handles sector assignments, overlapping fire analysis, and coverage optimization
 */
class AdvancedFPFService {
  private readonly FULL_CIRCLE_MILS = 6400;
  private readonly OPTIMAL_OVERLAP = 50;  // Optimal overlap size in mils

  /**
   * Create predefined FPF sectors for a mission
   */
  createDefaultSectors(): FPFSector[] {
    const mortarAzimuth = this.calculateMortarBaseAzimuth();
    
    // Create 8 sectors of 800 mils each (45 degrees)
    const sectorSize = 800;
    const sectorNames = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];
    
    return sectorNames.map((name, index) => ({
      id: `sector-${index + 1}`,
      name,
      azimuthStart: (mortarAzimuth + (index * sectorSize)) % this.FULL_CIRCLE_MILS,
      azimuthEnd: (mortarAzimuth + ((index + 1) * sectorSize)) % this.FULL_CIRCLE_MILS,
      description: `Sector ${name} - ${sectorSize} mils coverage`,
      priority: index < 3 ? 'primary' : index < 6 ? 'alternate' : 'supplemental',
      assignedTargets: [],
      created: new Date()
    })) as FPFSector[];
  }

  /**
   * Automatically assign FPF targets to appropriate sectors
   */
  assignTargetsToSectors(mission: Mission, sectors: FPFSector[]): FPFSector[] {
    const updatedSectors = [...sectors];

    mission.fpfTargets.forEach(target => {
      const targetAzimuth = this.calculateAzimuthToTarget(mission.mortarPosition, target.targetGrid);
      const assignedSector = this.findBestSectorForTarget(targetAzimuth, updatedSectors);
      
      if (assignedSector) {
        assignedSector.assignedTargets.push(target.id);
      }
    });

    return updatedSectors;
  }

  /**
   * Analyze FPF coverage and identify gaps or overlaps
   */
  analyzeCoverage(sectors: FPFSector[]): FPFCoverageAnalysis {
    const sortedSectors = [...sectors].sort((a, b) => a.azimuthStart - b.azimuthStart);
    const gaps = this.findCoverageGaps(sortedSectors);
    const overlaps = this.findCoverageOverlaps(sortedSectors);
    
    const totalCoverage = this.calculateTotalCoverage(sortedSectors);
    const recommendations = this.generateCoverageRecommendations(gaps, overlaps, sortedSectors);

    return {
      totalCoverageAngle: totalCoverage,
      gapsInCoverage: gaps,
      overlappingAreas: overlaps,
      recommendations
    };
  }

  /**
   * Calculate optimal fire distribution across multiple guns
   */
  calculateFireDistribution(mission: Mission, sectors: FPFSector[]): FPFFireDistribution[] {
    const distribution: FPFFireDistribution[] = [];
    let firingOrder = 1;

    // Sort targets by priority and sector assignment
    const sortedTargets = mission.fpfTargets.sort((a, b) => {
      const priorityOrder = { primary: 1, alternate: 2, supplemental: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    sortedTargets.forEach(target => {
      const sector = sectors.find(s => s.assignedTargets.includes(target.id));
      const recommendedTubes = this.calculateTubesForTarget(target, mission.numberOfGuns);
      const recommendedRounds = this.calculateRoundsForTarget(target);

      distribution.push({
        targetId: target.id,
        recommendedTubes,
        recommendedRounds,
        firingOrder: firingOrder++,
        justification: this.generateFireJustification(target, sector, recommendedTubes, recommendedRounds)
      });
    });

    return distribution;
  }

  /**
   * Generate tactical recommendations for FPF planning
   */
  generateTacticalRecommendations(mission: Mission, sectors: FPFSector[], analysis: FPFCoverageAnalysis): string[] {
    const recommendations: string[] = [];

    // Check for coverage gaps
    if (analysis.gapsInCoverage.length > 0) {
      const largestGap = analysis.gapsInCoverage.reduce((max, gap) => 
        gap.gapSize > max.gapSize ? gap : max
      );
      
      if (largestGap.gapSize > 200) { // Gap larger than 200 mils
        recommendations.push(`CRITICAL: Large coverage gap of ${largestGap.gapSize} mils from ${largestGap.startAzimuth} to ${largestGap.endAzimuth} mils. Consider additional FPF targets.`);
      }
    }

    // Check for excessive overlaps
    const excessiveOverlaps = analysis.overlappingAreas.filter(overlap => overlap.overlapSize > this.OPTIMAL_OVERLAP * 2);
    if (excessiveOverlaps.length > 0) {
      recommendations.push(`Consider reducing overlap between sectors - ${excessiveOverlaps.length} areas have excessive overlap > ${this.OPTIMAL_OVERLAP * 2} mils.`);
    }

    // Check gun distribution
    const totalTargets = mission.fpfTargets.length;
    const gunsPerTarget = mission.numberOfGuns / totalTargets;
    
    if (gunsPerTarget < 1) {
      recommendations.push(`WARNING: ${totalTargets} FPF targets for ${mission.numberOfGuns} guns. Consider prioritizing targets or requesting additional tubes.`);
    }

    // Check for unassigned high-priority targets
    const unassignedPrimary = mission.fpfTargets.filter(target => 
      target.priority === 'primary' && !sectors.some(sector => sector.assignedTargets.includes(target.id))
    );
    
    if (unassignedPrimary.length > 0) {
      recommendations.push(`${unassignedPrimary.length} primary FPF targets not assigned to sectors. Review sector boundaries.`);
    }

    return recommendations;
  }

  // Private helper methods

  private calculateMortarBaseAzimuth(): number {
    // For now, return a default azimuth. In a real implementation,
    // this would calculate based on terrain, threat direction, etc.
    return 0; // North
  }

  private calculateAzimuthToTarget(mortarGrid: string, targetGrid: string): number {
    // Simplified azimuth calculation
    // In a real implementation, this would use proper MGRS conversion and trigonometry
    const mortarHash = this.gridToHash(mortarGrid);
    const targetHash = this.gridToHash(targetGrid);
    
    const deltaX = targetHash.x - mortarHash.x;
    const deltaY = targetHash.y - mortarHash.y;
    
    let azimuth = Math.atan2(deltaX, deltaY) * (this.FULL_CIRCLE_MILS / (2 * Math.PI));
    
    // Ensure positive azimuth
    if (azimuth < 0) {
      azimuth += this.FULL_CIRCLE_MILS;
    }
    
    return Math.round(azimuth);
  }

  private gridToHash(grid: string): { x: number; y: number } {
    // Very simplified grid-to-coordinate conversion for demo purposes
    // Real implementation would use proper MGRS parsing
    const hash = grid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      x: (hash * 17) % 10000,
      y: (hash * 23) % 10000
    };
  }

  private findBestSectorForTarget(targetAzimuth: number, sectors: FPFSector[]): FPFSector | null {
    return sectors.find(sector => {
      // Handle azimuth wrap-around
      if (sector.azimuthEnd < sector.azimuthStart) {
        return targetAzimuth >= sector.azimuthStart || targetAzimuth <= sector.azimuthEnd;
      } else {
        return targetAzimuth >= sector.azimuthStart && targetAzimuth <= sector.azimuthEnd;
      }
    }) || null;
  }

  private findCoverageGaps(sortedSectors: FPFSector[]): Array<{ startAzimuth: number; endAzimuth: number; gapSize: number }> {
    const gaps = [];

    for (let i = 0; i < sortedSectors.length; i++) {
      const currentSector = sortedSectors[i];
      const nextSector = sortedSectors[(i + 1) % sortedSectors.length];

      const gapStart = currentSector.azimuthEnd;
      let gapEnd = nextSector.azimuthStart;

      // Handle wrap-around
      if (gapEnd < gapStart) {
        gapEnd += this.FULL_CIRCLE_MILS;
      }

      const gapSize = gapEnd - gapStart;

      if (gapSize > 0) {
        gaps.push({
          startAzimuth: gapStart % this.FULL_CIRCLE_MILS,
          endAzimuth: gapEnd % this.FULL_CIRCLE_MILS,
          gapSize
        });
      }
    }

    return gaps;
  }

  private findCoverageOverlaps(sortedSectors: FPFSector[]): Array<{ sector1Id: string; sector2Id: string; overlapStartAzimuth: number; overlapEndAzimuth: number; overlapSize: number }> {
    const overlaps = [];

    for (let i = 0; i < sortedSectors.length; i++) {
      for (let j = i + 1; j < sortedSectors.length; j++) {
        const sector1 = sortedSectors[i];
        const sector2 = sortedSectors[j];

        const overlap = this.calculateSectorOverlap(sector1, sector2);
        if (overlap) {
          overlaps.push({
            sector1Id: sector1.id,
            sector2Id: sector2.id,
            ...overlap
          });
        }
      }
    }

    return overlaps;
  }

  private calculateSectorOverlap(sector1: FPFSector, sector2: FPFSector): { overlapStartAzimuth: number; overlapEndAzimuth: number; overlapSize: number } | null {
    const start1 = sector1.azimuthStart;
    const end1 = sector1.azimuthEnd;
    const start2 = sector2.azimuthStart;
    const end2 = sector2.azimuthEnd;

    // Simplified overlap calculation (doesn't handle all wrap-around cases)
    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);

    if (overlapEnd > overlapStart) {
      return {
        overlapStartAzimuth: overlapStart,
        overlapEndAzimuth: overlapEnd,
        overlapSize: overlapEnd - overlapStart
      };
    }

    return null;
  }

  private calculateTotalCoverage(sectors: FPFSector[]): number {
    // Simplified total coverage calculation
    return sectors.reduce((total, sector) => {
      const sectorSize = sector.azimuthEnd >= sector.azimuthStart 
        ? sector.azimuthEnd - sector.azimuthStart
        : (this.FULL_CIRCLE_MILS - sector.azimuthStart) + sector.azimuthEnd;
      return total + sectorSize;
    }, 0);
  }

  private generateCoverageRecommendations(
    gaps: Array<{ startAzimuth: number; endAzimuth: number; gapSize: number }>, 
    overlaps: Array<{ sector1Id: string; sector2Id: string; overlapStartAzimuth: number; overlapEndAzimuth: number; overlapSize: number }>, 
    sectors: FPFSector[]
  ): string[] {
    const recommendations = [];

    if (gaps.length > 0) {
      recommendations.push(`${gaps.length} coverage gaps identified. Consider repositioning sectors or adding FPF targets.`);
    }

    if (overlaps.length > 3) {
      recommendations.push(`${overlaps.length} overlapping areas detected. Review sector boundaries for efficiency.`);
    }

    const unassignedSectors = sectors.filter(sector => sector.assignedTargets.length === 0);
    if (unassignedSectors.length > 0) {
      recommendations.push(`${unassignedSectors.length} sectors have no assigned targets. Consider consolidating or reassigning.`);
    }

    return recommendations;
  }

  private calculateTubesForTarget(target: FPFTarget, totalGuns: number): number {
    // Priority-based tube assignment
    switch (target.priority) {
      case 'primary':
        return Math.max(2, Math.floor(totalGuns * 0.4)); // 40% of guns for primary
      case 'alternate':
        return Math.max(1, Math.floor(totalGuns * 0.3)); // 30% for alternate
      case 'supplemental':
        return Math.max(1, Math.floor(totalGuns * 0.2)); // 20% for supplemental
      default:
        return 1;
    }
  }

  private calculateRoundsForTarget(target: FPFTarget): number {
    // Priority and target type based round calculation
    switch (target.priority) {
      case 'primary':
        return 12; // 12 rounds for primary targets
      case 'alternate':
        return 8;  // 8 rounds for alternate
      case 'supplemental':
        return 4;  // 4 rounds for supplemental
      default:
        return 4;
    }
  }

  private generateFireJustification(target: FPFTarget, sector: FPFSector | undefined, tubes: number, rounds: number): string {
    const priority = target.priority.toUpperCase();
    const sectorName = sector ? sector.name : 'Unassigned';
    
    return `${priority} target in Sector ${sectorName}: ${tubes} tubes, ${rounds} rds/tube. ${this.getPriorityJustification(target.priority)}`;
  }

  private getPriorityJustification(priority: string): string {
    switch (priority) {
      case 'primary':
        return 'Critical defensive position requiring maximum firepower.';
      case 'alternate':
        return 'Secondary defensive position with substantial fire support.';
      case 'supplemental':
        return 'Additional coverage for defensive flexibility.';
      default:
        return 'Standard FPF coverage.';
    }
  }
}

export const advancedFPFService = new AdvancedFPFService();
