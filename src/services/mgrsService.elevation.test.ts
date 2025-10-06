import { describe, it, expect } from 'vitest';
import { MGRSService } from './mgrsService';

describe('MGRSService Elevation Support', () => {
  describe('calculateElevationData', () => {
    it('should calculate uphill slope correctly', () => {
      const result = MGRSService.calculateElevationData(100, 300, 1500);
      
      expect(result.heightDifference).toBe(200);
      expect(result.horizontalDistance).toBe(1500);
      expect(result.slopeDistance).toBeCloseTo(1513.3, 1);
      expect(result.elevationAngleDegrees).toBeCloseTo(7.59, 1);
      expect(result.elevationAngleMils).toBeCloseTo(133, 0); // milliradians: atan2(200,1500) * 1000
    });

    it('should calculate downhill slope correctly', () => {
      const result = MGRSService.calculateElevationData(500, 200, 2000);
      
      expect(result.heightDifference).toBe(-300);
      expect(result.horizontalDistance).toBe(2000);
      expect(result.slopeDistance).toBeCloseTo(2022.4, 1);
      expect(result.elevationAngleDegrees).toBeCloseTo(-8.53, 1);
      expect(result.elevationAngleMils).toBeCloseTo(-149, 0); // milliradians: atan2(-300,2000) * 1000
    });

    it('should return zero angle for flat terrain', () => {
      const result = MGRSService.calculateElevationData(150, 150, 1000);
      
      expect(result.heightDifference).toBe(0);
      expect(result.horizontalDistance).toBe(1000);
      expect(result.slopeDistance).toBe(1000);
      expect(result.elevationAngleDegrees).toBe(0);
      expect(result.elevationAngleMils).toBe(0);
    });

    it('should handle extreme uphill (45 degrees)', () => {
      const result = MGRSService.calculateElevationData(0, 1000, 1000);
      
      expect(result.heightDifference).toBe(1000);
      expect(result.slopeDistance).toBeCloseTo(1414.2, 1);
      expect(result.elevationAngleDegrees).toBe(45);
      expect(result.elevationAngleMils).toBe(785); // 45° = π/4 rad = 785 milliradians
    });

    it('should handle negative elevations (below sea level)', () => {
      const result = MGRSService.calculateElevationData(-50, 100, 1000);
      
      expect(result.heightDifference).toBe(150);
      expect(result.elevationAngleMils).toBeCloseTo(149, 0); // milliradians: atan2(150,1000) * 1000
    });
  });

  describe('calculateFireMissionWithElevation', () => {
    it('should calculate fire mission with elevation data', () => {
      const mission = MGRSService.calculateFireMissionWithElevation(
        '1000010000',
        '1000011500',
        100,
        300
      );
      
      expect(mission.azimuthMils).toBeDefined();
      expect(mission.distanceMeters).toBeGreaterThan(0);
      expect(mission.elevationDifference).toBe(200);
      expect(mission.slopeMils).toBeGreaterThan(0);
      expect(mission.elevationData).toBeDefined();
      expect(mission.elevationData?.heightDifference).toBe(200);
    });

    it('should work without elevation data (backwards compatible)', () => {
      const mission = MGRSService.calculateFireMissionWithElevation(
        '1000010000',
        '1000011500'
      );
      
      expect(mission.azimuthMils).toBeDefined();
      expect(mission.distanceMeters).toBeGreaterThan(0);
      expect(mission.elevationDifference).toBeUndefined();
      expect(mission.slopeMils).toBeUndefined();
      expect(mission.elevationData).toBeUndefined();
    });

    it('should calculate downhill fire mission', () => {
      const mission = MGRSService.calculateFireMissionWithElevation(
        '1000010000',
        '1000012000',
        500,
        200
      );
      
      expect(mission.elevationDifference).toBe(-300);
      expect(mission.slopeMils).toBeLessThan(0); // Negative for downhill
    });
  });

  describe('Elevation angle conversions', () => {
    it('should convert degrees to mils correctly for elevation angles', () => {
      // NATO mils for azimuth/deflection
      expect(MGRSService.degreesToMils(45)).toBe(800);
      expect(MGRSService.degreesToMils(7.59)).toBeCloseTo(135, 0);
      expect(MGRSService.degreesToMils(-8.53)).toBeCloseTo(-152, 0);
    });

    it('should handle small elevation angles accurately', () => {
      // 1 degree ≈ 17.78 mils
      const result = MGRSService.calculateElevationData(100, 110, 1000);
      expect(result.elevationAngleDegrees).toBeCloseTo(0.573, 2);
      expect(result.elevationAngleMils).toBeCloseTo(10, 0);
    });
  });

  describe('Integration with standard fire mission', () => {
    it('should maintain backwards compatibility', () => {
      // Old method should still work
      const oldMission = MGRSService.calculateFireMission('1000010000', '1000011500');
      
      // New method without elevation should return same base data
      const newMission = MGRSService.calculateFireMissionWithElevation(
        '1000010000',
        '1000011500'
      );
      
      expect(newMission.azimuthMils).toBe(oldMission.azimuthMils);
      expect(newMission.distanceMeters).toBe(oldMission.distanceMeters);
      expect(newMission.backAzimuthMils).toBe(oldMission.backAzimuthMils);
    });
  });
});
