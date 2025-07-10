import { describe, it, expect } from 'vitest';
import { MGRSService } from '../services/mgrsService';

describe('MGRSService', () => {
  describe('normalizeGrid', () => {
    it('should normalize 6-digit grids by adding zeros', () => {
      const result = MGRSService.normalizeGrid('12ABC123456');
      expect(result).toBe('12ABC1230045600');
    });

    it('should normalize 8-digit grids by adding one zero', () => {
      const result = MGRSService.normalizeGrid('12ABC12345678');
      expect(result).toBe('12ABC1234056780');
    });

    it('should keep 10-digit grids unchanged', () => {
      const result = MGRSService.normalizeGrid('12ABC1234567890');
      expect(result).toBe('12ABC1234567890');
    });

    it('should handle grids with spaces', () => {
      const result = MGRSService.normalizeGrid('12A BC 123 456');
      expect(result).toBe('12ABC1230045600');
    });

    it('should convert to uppercase', () => {
      const result = MGRSService.normalizeGrid('12abc123456');
      expect(result).toBe('12ABC1230045600');
    });

    it('should throw error for invalid format', () => {
      expect(() => MGRSService.normalizeGrid('invalid')).toThrow('Invalid MGRS grid format');
    });

    it('should throw error for odd coordinate length', () => {
      expect(() => MGRSService.normalizeGrid('12ABC12345')).toThrow('Invalid coordinate length');
    });

    describe('Coordinate-only format (no zone/band/square)', () => {
      it('should normalize 6-digit coordinate-only grids', () => {
        const result = MGRSService.normalizeGrid('123456');
        expect(result).toBe('1230045600');
      });

      it('should normalize 8-digit coordinate-only grids', () => {
        const result = MGRSService.normalizeGrid('12345678');
        expect(result).toBe('1234056780');
      });

      it('should normalize 10-digit coordinate-only grids', () => {
        const result = MGRSService.normalizeGrid('1234567890');
        expect(result).toBe('1234567890');
      });

      it('should handle coordinate-only grids with spaces', () => {
        const result = MGRSService.normalizeGrid('123 456');
        expect(result).toBe('1230045600');
      });
    });
  });

  describe('parseGrid', () => {
    it('should parse normalized grid correctly', () => {
      const result = MGRSService.parseGrid('12ABC1234567890');
      expect(result).toEqual({
        grid: '12ABC1234567890',
        easting: 12345,
        northing: 67890,
        zone: 12,
        band: 'A',
        square: 'BC',
        isCoordinateOnly: false
      });
    });

    it('should parse and normalize 6-digit grid', () => {
      const result = MGRSService.parseGrid('12ABC123456');
      expect(result).toEqual({
        grid: '12ABC1230045600',
        easting: 12300,
        northing: 45600,
        zone: 12,
        band: 'A',
        square: 'BC',
        isCoordinateOnly: false
      });
    });

    it('should parse coordinate-only grids correctly', () => {
      const result = MGRSService.parseGrid('1234567890');
      expect(result).toEqual({
        grid: '1234567890',
        easting: 12345,
        northing: 67890,
        isCoordinateOnly: true
      });
    });
  });

  describe('isValidGrid', () => {
    it('should return true for valid grids', () => {
      expect(MGRSService.isValidGrid('12ABC123456')).toBe(true);
      expect(MGRSService.isValidGrid('12ABC12345678')).toBe(true);
      expect(MGRSService.isValidGrid('12ABC1234567890')).toBe(true);
    });

    it('should return false for invalid grids', () => {
      expect(MGRSService.isValidGrid('invalid')).toBe(false);
      expect(MGRSService.isValidGrid('12ABC12345')).toBe(false);
      expect(MGRSService.isValidGrid('')).toBe(false);
    });

    it('should validate coordinate-only grids', () => {
      expect(MGRSService.isValidGrid('123456')).toBe(true);
      expect(MGRSService.isValidGrid('12345678')).toBe(true);
      expect(MGRSService.isValidGrid('1234567890')).toBe(true);
      expect(MGRSService.isValidGrid('12345')).toBe(false); // odd length
    });
  });

  describe('degreesToMils', () => {
    it('should convert degrees to mils correctly', () => {
      expect(MGRSService.degreesToMils(0)).toBe(0);
      expect(MGRSService.degreesToMils(90)).toBe(1600);
      expect(MGRSService.degreesToMils(180)).toBe(3200);
      expect(MGRSService.degreesToMils(270)).toBe(4800);
      expect(MGRSService.degreesToMils(360)).toBe(6400);
    });

    it('should handle decimal degrees', () => {
      expect(MGRSService.degreesToMils(45)).toBe(800);
      expect(MGRSService.degreesToMils(22.5)).toBe(400);
    });
  });

  describe('milsToDegrees', () => {
    it('should convert mils to degrees correctly', () => {
      expect(MGRSService.milsToDegrees(0)).toBe(0);
      expect(MGRSService.milsToDegrees(1600)).toBe(90);
      expect(MGRSService.milsToDegrees(3200)).toBe(180);
      expect(MGRSService.milsToDegrees(4800)).toBe(270);
      expect(MGRSService.milsToDegrees(6400)).toBe(360);
    });

    it('should handle decimal conversion', () => {
      expect(MGRSService.milsToDegrees(800)).toBe(45);
      expect(MGRSService.milsToDegrees(400)).toBe(22.5);
    });
  });

  describe('getBackAzimuthMils', () => {
    it('should calculate back azimuth correctly', () => {
      expect(MGRSService.getBackAzimuthMils(0)).toBe(3200);
      expect(MGRSService.getBackAzimuthMils(1600)).toBe(4800);
      expect(MGRSService.getBackAzimuthMils(3200)).toBe(0);
      expect(MGRSService.getBackAzimuthMils(4800)).toBe(1600);
    });

    it('should wrap around correctly when over 6400', () => {
      expect(MGRSService.getBackAzimuthMils(5000)).toBe(1800);
      expect(MGRSService.getBackAzimuthMils(6000)).toBe(2800);
    });
  });

  describe('getDistance', () => {
    it('should calculate distance between grids', () => {
      // Test with coordinates where difference is 10 in coordinate units
      const distance = MGRSService.getDistance('33UXP0000000000', '33UXP0001000000');
      expect(distance).toBeCloseTo(10, 0); // The coordinate difference is 10 units
    });

    it('should handle same coordinates', () => {
      const distance = MGRSService.getDistance('33UXP0000000000', '33UXP0000000000');
      expect(distance).toBe(0);
    });

    it('should work with different grid precisions', () => {
      // Test that grids normalize correctly but may have precision differences
      const distance1 = MGRSService.getDistance('33UXP000000', '33UXP001000');
      const distance2 = MGRSService.getDistance('33UXP00000000', '33UXP00100000');
      const distance3 = MGRSService.getDistance('33UXP0000000000', '33UXP0001000000');
      
      // Distances should be consistent with their precision levels
      expect(distance1).toBeGreaterThan(0);
      expect(distance2).toBeGreaterThan(0);
      expect(distance3).toBeGreaterThan(0);
      
      // 6-digit and 8-digit should give the same result when normalized
      expect(distance1).toBeCloseTo(distance2, 0);
    });

    describe('Distance calculations with proper meter scaling', () => {    it('should calculate correct distances for Arma-style coordinates', () => {
      // Test case: 10000 northing difference = 10000 meters north
      const distance1 = MGRSService.getDistance('1000010000', '1000020000');
      expect(distance1).toBeCloseTo(10000, 0);

      // Test case: 1000 northing difference = 1000 meters north 
      const distance2 = MGRSService.getDistance('1000010000', '1100010000');
      expect(distance2).toBeCloseTo(1000, 0);

      // Test case: 1 northing difference = 1 meter north
      const distance3 = MGRSService.getDistance('1000010000', '1000010001');
      expect(distance3).toBeCloseTo(1, 0);
      
      // Test case: 1 easting difference = 1 meter east
      // 1000110000 -> easting: 10001, northing: 10000
      // 1000010000 -> easting: 10000, northing: 10000
      // Difference: 1 easting = 1 meter
      const distance4 = MGRSService.getDistance('1000010000', '1000110000');
      expect(distance4).toBeCloseTo(1, 0);
    });

      it('should work with mixed formats (full MGRS and coordinate-only)', () => {
        // Convert equivalent coordinates between formats
        const fullMgrs = '33UXP1000010000';
        const coordOnly = '1000010000';
        
        const fullMgrsTarget = '33UXP1000020000';
        const coordOnlyTarget = '1000020000';
        
        const distance1 = MGRSService.getDistance(fullMgrs, fullMgrsTarget);
        const distance2 = MGRSService.getDistance(coordOnly, coordOnlyTarget);
        
        // Should give same distance
        expect(distance1).toBeCloseTo(distance2, 0);
      });
    it('should handle large coordinate differences correctly', () => {
      // 0005000000 -> easting: 50, northing: 0
      // 0000000000 -> easting: 0, northing: 0  
      // Difference: 50 easting = 50 meters east
      const distance = MGRSService.getDistance('0000000000', '0005000000');
      expect(distance).toBeCloseTo(50, 0);
    });
    });
  });

  describe('getAzimuthMils', () => {
    it('should calculate azimuth for cardinal directions', () => {
      // North: azimuth should be 0
      const northAz = MGRSService.getAzimuthMils('33UXP0000000000', '33UXP0000000100');
      expect(northAz).toBe(0);

      // East: azimuth should be 1600 mils (90 degrees)
      const eastAz = MGRSService.getAzimuthMils('33UXP0000000000', '33UXP0001000000');
      expect(eastAz).toBe(1600);

      // South: azimuth should be 3200 mils (180 degrees)
      const southAz = MGRSService.getAzimuthMils('33UXP0000000100', '33UXP0000000000');
      expect(southAz).toBe(3200);

      // West: azimuth should be 4800 mils (270 degrees)
      const westAz = MGRSService.getAzimuthMils('33UXP0001000000', '33UXP0000000000');
      expect(westAz).toBe(4800);
    });

    it('should calculate azimuth for diagonal directions', () => {
      // Test actual computed values based on coordinate differences
      const neAz = MGRSService.getAzimuthMils('33UXP0000000000', '33UXP0001000100');
      expect(neAz).toBeGreaterThan(0);
      expect(neAz).toBeLessThan(1600);

      // Test that southeast direction gives a value in the correct quadrant
      const seAz = MGRSService.getAzimuthMils('33UXP0001000100', '33UXP0002000000');
      expect(seAz).toBeGreaterThan(1600);
      expect(seAz).toBeLessThan(3200);
    });

    it('should handle same coordinates', () => {
      // When from and to are the same, azimuth is undefined but should not crash
      const azimuth = MGRSService.getAzimuthMils('33UXP0000000000', '33UXP0000000000');
      expect(azimuth).toBe(0); // atan2(0,0) returns 0
    });

    describe('Azimuth calculations with coordinate-only format', () => {
      it('should calculate azimuths correctly for coordinate-only grids', () => {
        // North: should be 0 mils
        const northAz = MGRSService.getAzimuthMils('1000010000', '1000010100');
        expect(northAz).toBe(0);

        // East: should be 1600 mils
        const eastAz = MGRSService.getAzimuthMils('1000010000', '1000110000');
        expect(eastAz).toBe(1600);

        // South: should be 3200 mils
        const southAz = MGRSService.getAzimuthMils('1000010100', '1000010000');
        expect(southAz).toBe(3200);

        // West: should be 4800 mils
        const westAz = MGRSService.getAzimuthMils('1000110000', '1000010000');
        expect(westAz).toBe(4800);
      });
    });
  });

  describe('calculateFireMission', () => {
    it('should return complete fire mission data', () => {
      const mission = MGRSService.calculateFireMission('33UXP0000000000', '33UXP0001000100');
      
      expect(mission).toHaveProperty('azimuthMils');
      expect(mission).toHaveProperty('backAzimuthMils');
      expect(mission).toHaveProperty('distanceMeters');
      
      expect(typeof mission.azimuthMils).toBe('number');
      expect(typeof mission.backAzimuthMils).toBe('number');
      expect(typeof mission.distanceMeters).toBe('number');
      
      // Back azimuth should be azimuth + 3200 (or wrapped)
      const expectedBackAz = mission.azimuthMils + 3200 >= 6400 
        ? mission.azimuthMils + 3200 - 6400 
        : mission.azimuthMils + 3200;
      expect(mission.backAzimuthMils).toBe(expectedBackAz);
    });

    it('should work with different grid precisions', () => {
      // Test that fire missions work with different precisions
      const mission1 = MGRSService.calculateFireMission('33UXP000000', '33UXP001000');
      const mission2 = MGRSService.calculateFireMission('33UXP0000000000', '33UXP0001000000');
      
      // Both missions should be valid
      expect(mission1.azimuthMils).toBeGreaterThanOrEqual(0);
      expect(mission1.azimuthMils).toBeLessThan(6400);
      expect(mission2.azimuthMils).toBeGreaterThanOrEqual(0);
      expect(mission2.azimuthMils).toBeLessThan(6400);
      
      // Azimuth and back azimuth should be consistent
      expect(mission1.azimuthMils).toBe(mission2.azimuthMils);
      expect(mission1.backAzimuthMils).toBe(mission2.backAzimuthMils);
    });

    it('should calculate complete fire missions for Arma-style coordinates', () => {
      const observerPos = '1234567890';
      const targetPos = '1244568890';
      
      const mission = MGRSService.calculateFireMission(observerPos, targetPos);
      
      expect(mission.azimuthMils).toBeGreaterThanOrEqual(0);
      expect(mission.azimuthMils).toBeLessThan(6400);
      expect(mission.backAzimuthMils).toBeGreaterThanOrEqual(0);
      expect(mission.backAzimuthMils).toBeLessThan(6400);
      expect(mission.distanceMeters).toBeGreaterThan(0);
      
      // Verify back azimuth calculation
      const expectedBackAz = mission.azimuthMils + 3200 >= 6400 
        ? mission.azimuthMils + 3200 - 6400 
        : mission.azimuthMils + 3200;
      expect(mission.backAzimuthMils).toBe(expectedBackAz);
    });
  });

  describe('Integration Tests', () => {
    it('should handle real-world fire mission scenario', () => {
      // Observer position
      const observerGrid = '33UXP12345678';
      // Target position (1km east, 500m north)
      const targetGrid = '33UXP22350728';
      
      const mission = MGRSService.calculateFireMission(observerGrid, targetGrid);
      
      expect(mission.azimuthMils).toBeGreaterThan(0);
      expect(mission.azimuthMils).toBeLessThan(6400);
      expect(mission.backAzimuthMils).toBeGreaterThan(0);
      expect(mission.backAzimuthMils).toBeLessThan(6400);
      expect(mission.distanceMeters).toBeGreaterThan(0);
    });

    it('should maintain precision across conversions', () => {
      const degrees = 45.5;
      const mils = MGRSService.degreesToMils(degrees);
      const backToDegrees = MGRSService.milsToDegrees(mils);
      
      expect(backToDegrees).toBeCloseTo(degrees, 1);
    });
  });
});
