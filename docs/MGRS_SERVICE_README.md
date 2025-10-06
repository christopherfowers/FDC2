# MGRS Service Documentation

A comprehensive TypeScript service for Military Grid Reference System (MGRS) operations, specifically designed for Fire Direction Center (FDC) applications and mortar fire missions.

## Features

### Core Functionality
- ✅ **MGRS Grid Normalization** - Supports 6, 8, and 10-digit grid formats
- ✅ **Azimuth Calculations** - Compute firing azimuth in mils between two grids
- ✅ **Back Azimuth** - Calculate reverse direction for confirmation
- ✅ **Distance Calculations** - Determine distance between MGRS coordinates
- ✅ **Unit Conversions** - Convert between degrees and mils
- ✅ **Fire Mission Data** - Complete fire direction calculations
- ✅ **Grid Validation** - Verify MGRS format correctness

### Military Standards
- Uses **mils** for azimuth (6400 mils = 360°)
- Supports standard MGRS grid precisions
- Military-grade calculations for fire direction

## API Reference

### Grid Normalization
```typescript
// Normalize different grid precisions to 10-digit format
MGRSService.normalizeGrid('33UXP123456')      // 6-digit -> '33UXP1230045600'
MGRSService.normalizeGrid('33UXP12345678')    // 8-digit -> '33UXP1234056780'
MGRSService.normalizeGrid('33UXP1234567890')  // 10-digit -> '33UXP1234567890'
```

### Fire Mission Calculations
```typescript
const mission = MGRSService.calculateFireMission(
  '33UXP12345678', // Observer position
  '33UXP23456789'  // Target position
);

console.log(mission.azimuthMils);     // Firing azimuth in mils
console.log(mission.backAzimuthMils); // Back azimuth for confirmation
console.log(mission.distanceMeters);  // Distance to target
```

### Individual Calculations
```typescript
// Azimuth from one grid to another (in mils)
const azimuth = MGRSService.getAzimuthMils(fromGrid, toGrid);

// Back azimuth (reverse direction)
const backAz = MGRSService.getBackAzimuthMils(azimuth);

// Distance between grids
const distance = MGRSService.getDistance(fromGrid, toGrid);
```

### Unit Conversions
```typescript
// Convert degrees to mils (military standard)
const mils = MGRSService.degreesToMils(90);    // 1600 mils
const degrees = MGRSService.milsToDegrees(1600); // 90 degrees
```

### Validation
```typescript
// Check if grid format is valid
const isValid = MGRSService.isValidGrid('33UXP123456'); // true
```

## Grid Format Support

| Format | Example | Description |
|--------|---------|-------------|
| **Full MGRS** | `33UXP123456` | Standard MGRS with zone/band/square |
| **6-digit** | `33UXP123456` | ±1000m precision |
| **8-digit** | `33UXP12345678` | ±100m precision |
| **10-digit** | `33UXP1234567890` | ±10m precision |
| **Coordinate-Only** | `1234567890` | Gaming/Arma style (no zone prefix) |
| **6-digit coord** | `123456` | ±1000m precision, coordinate-only |
| **8-digit coord** | `12345678` | ±100m precision, coordinate-only |
| **10-digit coord** | `1234567890` | ±10m precision, coordinate-only |

All formats are automatically normalized to 10-digit precision for calculations.

### Coordinate-Only Format (Gaming/Arma)

For gaming applications like Arma 3, you can use coordinates without the zone/band/square prefix:

```typescript
// Arma-style coordinates (no zone prefix)
const observerPos = '1234567890';  // easting: 12345, northing: 67890
const targetPos = '1244568890';    // easting: 12445, northing: 68890

const mission = MGRSService.calculateFireMission(observerPos, targetPos);
```

**Distance Scale**: Each coordinate unit represents 1 meter:
- `1000010000` to `1000020000` = 10,000 meters north
- `1000010000` to `1100010000` = 1,000 meters east  
- `1000010000` to `1000010001` = 1 meter north

## Military Usage Examples

### Basic Fire Mission
```typescript
const observerPos = '33UXP12345678';
const targetPos = '33UXP23456789';

const mission = MGRSService.calculateFireMission(observerPos, targetPos);

// Radio call example:
// "Fire Mission, Grid 33UXP23456789"
// "Azimuth ${mission.azimuthMils} mils"
// "Distance ${Math.round(mission.distanceMeters)} meters"
```

### Azimuth Verification
```typescript
const azimuth = MGRSService.getAzimuthMils(fromGrid, toGrid);
const backAzimuth = MGRSService.getBackAzimuthMils(azimuth);

// Observer can verify with back azimuth
console.log(`Azimuth: ${azimuth} mils`);
console.log(`Back Azimuth: ${backAzimuth} mils`);
```

## Testing

The service includes comprehensive unit tests covering:
- Grid normalization for all supported formats
- Azimuth calculations for cardinal and intercardinal directions
- Distance calculations with various coordinate systems
- Unit conversions (degrees ↔ mils)
- Edge cases and error handling

Run tests:
```bash
npm run test        # Watch mode
npm run test:run    # Single run
npm run test:ui     # UI mode
```

## Dependencies

- **Vitest** - Testing framework
- **TypeScript** - Type safety and modern JavaScript features

## Technical Notes

- Coordinate system uses simplified UTM approach for relative calculations
- Designed for same-zone operations (typical for tactical scenarios)
- Calculations optimized for military fire direction accuracy
- All azimuth values are in military mils (0-6399)
- Distance calculations provide relative positioning within operational areas

## Future Enhancements

Potential additions for enhanced functionality:
- Full geodetic coordinate transformations
- Multi-zone coordinate support
- Integration with ballistic calculation libraries
- Real-time position tracking
- Digital fire control system interface
