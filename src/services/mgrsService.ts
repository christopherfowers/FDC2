export interface MGRSCoordinate {
  grid: string;
  easting: number;
  northing: number;
  zone?: number;
  band?: string;
  square?: string;
  isCoordinateOnly?: boolean;
}

export interface FireMissionData {
  azimuthMils: number;
  backAzimuthMils: number;
  distanceMeters: number;
}

export class MGRSService {
  /**
   * Normalizes MGRS grid coordinates to 10-digit precision
   * Supports 6, 8, and 10 digit grids with or without zone/band/square prefixes
   */
  static normalizeGrid(gridString: string): string {
    // Remove spaces and convert to uppercase
    const cleanGrid = gridString.replace(/\s/g, '').toUpperCase();
    
    // Check if this is coordinate-only format (no zone/band/square)
    const coordOnlyMatch = cleanGrid.match(/^(\d{2,10})$/);
    if (coordOnlyMatch) {
      return this.normalizeCoordinateOnly(coordOnlyMatch[1]);
    }
    
    // Extract zone, band, square, and coordinates
    const match = cleanGrid.match(/^(\d{1,2})([A-Z])([A-Z]{2})(\d{2,10})$/);
    if (!match) {
      throw new Error(`Invalid MGRS grid format: ${gridString}`);
    }

    const [, zone, band, square, coords] = match;
    
    // Split coordinates into easting and northing
    if (coords.length % 2 !== 0) {
      throw new Error(`Invalid coordinate length: ${coords}`);
    }
    
    const coordLength = coords.length / 2;
    let easting = coords.substring(0, coordLength);
    let northing = coords.substring(coordLength);
    
    // Normalize to 5 digits each (10 total)
    if (coordLength === 3) { // 6-digit grid (e.g., 123456 -> 12300, 56000)
      easting = easting.padEnd(5, '0');
      northing = northing.padEnd(5, '0');
    } else if (coordLength === 4) { // 8-digit grid (e.g., 12345678 -> 12340, 56780)
      easting = easting.padEnd(5, '0');
      northing = northing.padEnd(5, '0');
    } else if (coordLength !== 5) { // 10-digit grid
      throw new Error(`Unsupported coordinate precision: ${coords.length} digits`);
    }
    
    return `${zone}${band}${square}${easting}${northing}`;
  }

  /**
   * Normalizes coordinate-only format (no zone/band/square prefix)
   */
  private static normalizeCoordinateOnly(coords: string): string {
    if (coords.length % 2 !== 0) {
      throw new Error(`Invalid coordinate length: ${coords}`);
    }
    
    const coordLength = coords.length / 2;
    let easting = coords.substring(0, coordLength);
    let northing = coords.substring(coordLength);
    
    // Normalize to 5 digits each (10 total)
    if (coordLength === 3) { // 6-digit grid
      easting = easting.padEnd(5, '0');
      northing = northing.padEnd(5, '0');
    } else if (coordLength === 4) { // 8-digit grid
      easting = easting.padEnd(5, '0');
      northing = northing.padEnd(5, '0');
    } else if (coordLength !== 5) { // 10-digit grid
      throw new Error(`Unsupported coordinate precision: ${coords.length} digits`);
    }
    
    return `${easting}${northing}`;
  }

  /**
   * Parses MGRS grid string into coordinate components
   */
  static parseGrid(gridString: string): MGRSCoordinate {
    const normalizedGrid = this.normalizeGrid(gridString);
    
    // Check if this is coordinate-only format
    const coordOnlyMatch = normalizedGrid.match(/^(\d{5})(\d{5})$/);
    if (coordOnlyMatch) {
      const [, eastingStr, northingStr] = coordOnlyMatch;
      return {
        grid: normalizedGrid,
        easting: parseInt(eastingStr, 10),
        northing: parseInt(northingStr, 10),
        isCoordinateOnly: true
      };
    }
    
    // Full MGRS format with zone/band/square
    const match = normalizedGrid.match(/^(\d{1,2})([A-Z])([A-Z]{2})(\d{5})(\d{5})$/);
    if (!match) {
      throw new Error(`Failed to parse normalized grid: ${normalizedGrid}`);
    }

    const [, zone, band, square, eastingStr, northingStr] = match;
    
    return {
      grid: normalizedGrid,
      easting: parseInt(eastingStr, 10),
      northing: parseInt(northingStr, 10),
      zone: parseInt(zone, 10),
      band,
      square,
      isCoordinateOnly: false
    };
  }

  /**
   * Converts MGRS to UTM coordinates for distance and azimuth calculations
   */
  static mgrsToUtm(gridString: string): { easting: number; northing: number; zone?: number; band?: string } {
    const normalizedGrid = this.normalizeGrid(gridString);
    const coordinate = this.parseGrid(normalizedGrid);
    
    // For calculation purposes, we'll use the coordinate directly from the grid
    // In a real implementation, you'd convert through the full UTM system
    // This simplified approach works for relative calculations within the same zone
    return {
      easting: coordinate.easting,
      northing: coordinate.northing,
      zone: coordinate.zone,
      band: coordinate.band
    };
  }

  /**
   * Calculates distance between two MGRS coordinates in meters
   */
  static getDistance(fromGrid: string, toGrid: string): number {
    const fromUtm = this.mgrsToUtm(fromGrid);
    const toUtm = this.mgrsToUtm(toGrid);
    
    // Ensure both coordinates are in the same UTM zone for accurate calculation
    if (fromUtm.zone && toUtm.zone && fromUtm.zone !== toUtm.zone) {
      console.warn('Coordinates are in different UTM zones. Distance calculation may be less accurate.');
    }
    
    const deltaE = toUtm.easting - fromUtm.easting;
    const deltaN = toUtm.northing - fromUtm.northing;
    
    // MGRS coordinates represent meters, so the difference is in meters
    return Math.sqrt(deltaE * deltaE + deltaN * deltaN);
  }

  /**
   * Calculates azimuth from one MGRS coordinate to another in mils
   * Azimuth is measured clockwise from north (0 mils = north, 1600 mils = east)
   */
  static getAzimuthMils(fromGrid: string, toGrid: string): number {
    const fromUtm = this.mgrsToUtm(fromGrid);
    const toUtm = this.mgrsToUtm(toGrid);
    
    const deltaE = toUtm.easting - fromUtm.easting;
    const deltaN = toUtm.northing - fromUtm.northing;
    
    // Calculate azimuth in radians (0 = north, clockwise positive)
    let azimuthRad = Math.atan2(deltaE, deltaN);
    
    // Convert to positive value (0 to 2π)
    if (azimuthRad < 0) {
      azimuthRad += 2 * Math.PI;
    }
    
    // Convert to mils (6400 mils = 360 degrees = 2π radians)
    const azimuthMils = (azimuthRad * 6400) / (2 * Math.PI);
    
    return Math.round(azimuthMils);
  }

  /**
   * Calculates back azimuth (reverse direction) in mils
   * Back azimuth is the azimuth + 3200 mils (180 degrees)
   */
  static getBackAzimuthMils(azimuthMils: number): number {
    let backAzimuth = azimuthMils + 3200;
    
    // Ensure the result is within 0-6399 mils
    if (backAzimuth >= 6400) {
      backAzimuth -= 6400;
    }
    
    return backAzimuth;
  }

  /**
   * Converts degrees to mils
   * 360 degrees = 6400 mils
   */
  static degreesToMils(degrees: number): number {
    return Math.round((degrees * 6400) / 360);
  }

  /**
   * Converts mils to degrees
   * 6400 mils = 360 degrees
   */
  static milsToDegrees(mils: number): number {
    return (mils * 360) / 6400;
  }

  /**
   * Comprehensive fire mission calculation
   * Returns azimuth, back azimuth, and distance for mortar fire direction
   */
  static calculateFireMission(fromGrid: string, toGrid: string): FireMissionData {
    const azimuthMils = this.getAzimuthMils(fromGrid, toGrid);
    const backAzimuthMils = this.getBackAzimuthMils(azimuthMils);
    const distanceMeters = this.getDistance(fromGrid, toGrid);
    
    return {
      azimuthMils,
      backAzimuthMils,
      distanceMeters
    };
  }

  /**
   * Validates MGRS grid format
   */
  static isValidGrid(gridString: string): boolean {
    try {
      this.normalizeGrid(gridString);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Apply observer adjustments to calculate new target coordinates
   * Observer adjustments are relative to the observer's line of sight to target
   */
  static applyObserverAdjustment(
    observerGrid: string,
    targetGrid: string,
    rangeAdjustmentM: number,
    directionAdjustmentMils: number
  ): { adjustedTargetGrid: string; observerAzimuthToTarget: number } {
    const observerCoords = this.mgrsToUtm(observerGrid);
    
    // Get observer-to-target azimuth
    const observerAzimuthToTarget = this.getAzimuthMils(observerGrid, targetGrid);
    
    // Calculate the adjusted azimuth (observer's perspective + direction adjustment)
    let adjustedAzimuth = observerAzimuthToTarget + directionAdjustmentMils;
    
    // Normalize azimuth to 0-6399 mils
    while (adjustedAzimuth < 0) adjustedAzimuth += 6400;
    while (adjustedAzimuth >= 6400) adjustedAzimuth -= 6400;
    
    // Get current distance from observer to target
    const currentDistance = this.getDistance(observerGrid, targetGrid);
    
    // Calculate new distance (current distance + range adjustment)
    const newDistance = currentDistance + rangeAdjustmentM;
    
    if (newDistance < 0) {
      throw new Error('Range adjustment would result in negative distance');
    }
    
    // Convert adjusted azimuth to radians for calculation
    const azimuthRad = (adjustedAzimuth * 2 * Math.PI) / 6400;
    
    // Calculate new target coordinates from observer position
    const deltaE = newDistance * Math.sin(azimuthRad);
    const deltaN = newDistance * Math.cos(azimuthRad);
    
    const newTargetE = observerCoords.easting + deltaE;
    const newTargetN = observerCoords.northing + deltaN;
    
    // Convert back to MGRS grid (simplified - assumes same UTM zone)
    const adjustedTargetGrid = this.utmToMgrs(newTargetE, newTargetN, observerCoords.zone, observerCoords.band);
    
    return {
      adjustedTargetGrid,
      observerAzimuthToTarget
    };
  }

  /**
   * Convert UTM coordinates back to MGRS grid (simplified)
   * This is a simplified conversion for coordinate-only format
   */
  private static utmToMgrs(easting: number, northing: number, zone?: number, band?: string): string {
    // Round to nearest meter
    const eastingRounded = Math.round(easting);
    const northingRounded = Math.round(northing);
    
    // If we have zone/band info, format full MGRS, otherwise coordinate-only
    if (zone && band) {
      // For full implementation, you'd need the grid square calculation
      // For now, return coordinate-only format
      return `${eastingRounded.toString().padStart(5, '0')}${northingRounded.toString().padStart(5, '0')}`;
    } else {
      // Coordinate-only format
      return `${eastingRounded.toString().padStart(5, '0')}${northingRounded.toString().padStart(5, '0')}`;
    }
  }

  /**
   * Calculate target grid from observer position, azimuth (mils), and distance (meters)
   */
  static calculateTargetFromPolar(observerGrid: string, azimuthMils: number, distanceMeters: number): string {
    const observerCoords = this.parseGrid(observerGrid);
    
    // Convert azimuth from mils to radians
    const azimuthRad = (azimuthMils * 2 * Math.PI) / 6400;
    
    // Calculate target coordinates
    const deltaE = distanceMeters * Math.sin(azimuthRad);
    const deltaN = distanceMeters * Math.cos(azimuthRad);
    
    const targetE = observerCoords.easting + deltaE;
    const targetN = observerCoords.northing + deltaN;
    
    // Convert back to MGRS grid
    return this.utmToMgrs(targetE, targetN, observerCoords.zone, observerCoords.band);
  }
}
