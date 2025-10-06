# Elevation Support for Fire Mission Calculator

## Overview

Added elevation/altitude support to the Fire Mission workflow (not the quick calculator) to enable accurate ballistic calculations for terrain with different elevations for mortar positions and targets.

## Changes Made

### Type Definitions Updated

**File:** `/src/types/mission.ts`

1. **GunPosition Interface**
   - Added: `elevationM?: number` - Gun altitude in meters above sea level

2. **Mission Interface**  
   - Added: `mortarElevationM?: number` - Mortar altitude in meters above sea level

3. **FPFTarget Interface**
   - Added: `targetElevationM?: number` - Target altitude in meters above sea level

### UI Updates

**File:** `/src/components/FireMissionPage.tsx`

#### 1. Mission Information Panel (NEW)
Added a new information panel at the top of the page showing:
- Mortar position (MGRS grid)
- Mortar elevation (if set)
- Available ammunition types

This provides operators with quick reference to critical mission data.

#### 2. Target Elevation Input
Enhanced Line 2 (Target Location) of the NATO Call for Fire with:
- **Target Elevation input field** - Optional altitude in meters above sea level
- Displayed next to target grid in a responsive 2-column layout
- Visual icon and helper text
- Unit indicator ("m" for meters)

#### 3. FPF Target Integration
Updated FPF target quick-select buttons to:
- Display target elevation when available
- Auto-populate target elevation when selecting an FPF target
- Show elevation icon and value in target list

## Features

### Elevation Data Flow

1. **Mission Prep** → Mortar elevation is set during mission preparation
2. **Fire Mission** → Target elevation can be specified for each fire mission
3. **Fire Solution** → Elevations are passed to ballistic calculations
4. **Results** → Trajectory chart uses elevation data for accurate visualization

### User Experience

#### Setting Target Elevation

```
Target Location (Grid)
┌────────────────────────────────────────────────┬─────────────────────────────┐
│ MGRS Grid                                      │ Target Elevation (Optional) │
│ [18TVL1234567890                          ]    │ [250                  ] m   │
│                                                 │ 🏔️ Altitude above sea level │
└────────────────────────────────────────────────┴─────────────────────────────┘
```

#### Viewing Mortar Elevation

```
Mission Information
┌────────────────────────────────────────────────────────────────────────┐
│ 🎯 Mortar Position                                                     │
│ 18TVL1000010000                                                        │
│ 🏔️ Elevation: 150m above sea level                                    │
└────────────────────────────────────────────────────────────────────────┘
```

### Optional Field

All elevation fields are **optional**:
- If not provided, calculations assume flat terrain
- When provided, enables terrain-corrected ballistic solutions
- Enhances accuracy for mountainous or hilly terrain

## Benefits

### 1. Accurate Fire Solutions
- Accounts for height differences between gun and target
- Corrects for uphill/downhill firing
- More realistic range and time of flight calculations

### 2. Tactical Planning
- Identify positions with elevation advantages
- Plan FPF targets with accurate elevation data
- Better mission briefings with complete terrain information

### 3. Safety
- More accurate danger zones
- Better clearance calculations
- Reduced risk of short or long rounds

### 4. Training Value
- Teaches importance of elevation in indirect fire
- Realistic practice for mountainous operations
- Better understanding of ballistic effects

## Usage

### Fire Mission Workflow

1. **Start Mission Prep**
   - Set mortar position
   - *Optionally* enter mortar elevation

2. **Enter Fire Mission**
   - Set target grid (required)
   - *Optionally* enter target elevation
   - Continue with NATO call for fire

3. **Calculate Solution**
   - Elevation data automatically used in calculations
   - Trajectory chart shows terrain profile

### FPF Target Planning

When creating FPF targets:
1. Enter target grid
2. *Optionally* enter target elevation
3. Elevation is saved with the target
4. Quick-select automatically fills in elevation

### Elevation Entry Tips

- **Meters above sea level** - Use standard elevation datum
- **GPS altitude** - Can be obtained from GPS devices
- **Map reading** - Read from topographic maps
- **Estimation** - Better than nothing for training

## Technical Details

### Data Types

```typescript
elevationM?: number  // Optional elevation in meters
```

- Positive values: Above sea level
- Negative values: Below sea level (rare)
- Undefined: Flat terrain assumed

### Integration Points

1. **Mission State** - Stored in mission object
2. **Fire Mission** - Passed to solution calculation
3. **Ballistics** - Used in FireDirectionService
4. **Trajectory** - Visualized in TrajectoryChart
5. **Results** - Displayed in fire solution

## Backward Compatibility

- Existing missions without elevation data continue to work
- Optional fields don't break existing workflows
- Gradual adoption - operators can add elevation when available

## Future Enhancements

Potential improvements:
- Map integration with automatic elevation lookup
- Terrain profile visualization between gun and target
- Elevation validation (realistic range checking)
- Bulk elevation import from terrain data
- Elevation presets for known locations

## Related Documentation

- [TRAJECTORY_VISUALIZATION.md](./TRAJECTORY_VISUALIZATION.md) - Trajectory chart using elevation data
- [ELEVATION_SUPPORT.md](./ELEVATION_SUPPORT.md) - Quick calculator elevation features
- [ELEVATION_IMPLEMENTATION.md](./ELEVATION_IMPLEMENTATION.md) - Technical implementation details

## Notes

- Elevation support enhances but is not required for fire missions
- Flat terrain operations can ignore elevation fields
- Mountainous operations benefit significantly from elevation data
- Training scenarios should emphasize proper elevation use
