# Trajectory Visualization Feature

## Overview

Added an interactive trajectory chart to the Fire Mission Results page (Step 3) that visualizes the projectile's flight path from gun to target.

## Features

### Visual Elements

1. **Trajectory Arc** - Blue curved line showing the projectile's flight path
2. **Gun Position** - Green marker showing mortar position with elevation
3. **Target Position** - Red marker showing target location with elevation
4. **Apex Point** - Orange marker showing the peak height of the trajectory
5. **Grid Background** - Reference grid for easier reading
6. **Sea Level Reference** - Dashed line showing ground level

### Annotations

- **Range Scale** - Horizontal axis showing distance in meters/kilometers
- **Altitude Scale** - Vertical axis showing height above sea level
- **Peak Height** - Annotated maximum altitude reached
- **Time of Flight** - Duration of projectile flight
- **Flight Statistics** - Key metrics displayed below the chart:
  - Range
  - Time of Flight
  - Elevation (mils)
  - Charge Level

### Physics Model

The trajectory calculation uses:
- Projectile motion equations with gravity
- Initial velocity calculated from range, elevation angle, and time of flight
- Parabolic arc approximation
- Terrain elevation support (gun and target heights)

## Usage

1. Complete a fire mission calculation on the Calculator page
2. View results on the Results page
3. Scroll down to see the **Trajectory Profile** chart
4. The chart automatically displays:
   - Accurate flight path based on firing solution
   - Terrain elevation differences if provided
   - Peak altitude reached by the projectile
   - Complete flight statistics

## Technical Implementation

### Components

- **TrajectoryChart.tsx** - New React component for rendering trajectory
- **ResultsPage.tsx** - Updated to include trajectory visualization
- **FireMissionCalculator.tsx** - Updated to pass elevation data to results

### Files Modified

1. `/src/components/TrajectoryChart.tsx` - New component
2. `/src/components/ResultsPage.tsx` - Added trajectory chart integration
3. `/src/components/FireMissionCalculator.tsx` - Added elevation data to results

### Calculations

The trajectory uses simplified ballistic physics:

```
v₀ = initial velocity
θ = elevation angle (radians)
t = time
g = 9.81 m/s² (gravity)

Horizontal position: x(t) = v₀ × cos(θ) × t
Vertical position: y(t) = y₀ + v₀ × sin(θ) × t - ½ × g × t²
```

Where:
- v₀ is calculated from: range / (time_of_flight × cos(elevation_angle))
- y₀ is the gun elevation in meters

## Benefits

1. **Visual Understanding** - Operators can see the flight path at a glance
2. **Terrain Awareness** - Shows how gun and target elevations affect trajectory
3. **Quick Verification** - Visual confirmation of firing solution reasonableness
4. **Training Tool** - Helps teach ballistic concepts
5. **Mission Planning** - Identify obstacles or clearance issues

## Future Enhancements

Potential improvements:
- Add danger zone/safety fan visualization
- Show multiple trajectories for different charges
- Display maximum ordinate (peak height) value
- Add wind drift visualization
- Include obstacles/terrain profile
- Export trajectory data as CSV

## Notes

- The trajectory shown is an approximation based on standard projectile motion
- Actual flight paths may vary due to:
  - Atmospheric conditions (temperature, pressure, humidity)
  - Wind
  - Propellant temperature variations
  - Individual round variations
  - Earth's rotation (Coriolis effect) at long ranges

The visualization provides a good tactical approximation for fire mission planning and verification.
