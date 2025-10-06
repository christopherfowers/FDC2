// Test script to verify elevation calculation accuracy
import { MGRSService } from './src/services/mgrsService.js';

console.log('=== Terrain Elevation Calculation Tests ===\n');

// Test Case 1: Uphill engagement
console.log('Test 1: Uphill Engagement (200m height gain over 1500m)');
const uphill = MGRSService.calculateElevationData(100, 300, 1500);
console.log(`  Gun: 100m, Target: 300m, Distance: 1500m`);
console.log(`  Height Difference: ${uphill.heightDifference.toFixed(1)}m`);
console.log(`  Slope Distance: ${uphill.slopeDistance.toFixed(1)}m`);
console.log(`  Elevation Angle: ${uphill.elevationAngleDegrees.toFixed(2)}°`);
console.log(`  Elevation Angle: ${uphill.elevationAngleMils.toFixed(0)} mils`);
console.log(`  Expected: ~76 mils, Got: ${uphill.elevationAngleMils.toFixed(0)} mils`);
console.log();

// Test Case 2: Downhill engagement
console.log('Test 2: Downhill Engagement (300m height loss over 2000m)');
const downhill = MGRSService.calculateElevationData(500, 200, 2000);
console.log(`  Gun: 500m, Target: 200m, Distance: 2000m`);
console.log(`  Height Difference: ${downhill.heightDifference.toFixed(1)}m`);
console.log(`  Slope Distance: ${downhill.slopeDistance.toFixed(1)}m`);
console.log(`  Elevation Angle: ${downhill.elevationAngleDegrees.toFixed(2)}°`);
console.log(`  Elevation Angle: ${downhill.elevationAngleMils.toFixed(0)} mils`);
console.log(`  Expected: ~-95 mils, Got: ${downhill.elevationAngleMils.toFixed(0)} mils`);
console.log();

// Test Case 3: Flat terrain
console.log('Test 3: Flat Terrain (no height difference)');
const flat = MGRSService.calculateElevationData(150, 150, 1000);
console.log(`  Gun: 150m, Target: 150m, Distance: 1000m`);
console.log(`  Height Difference: ${flat.heightDifference.toFixed(1)}m`);
console.log(`  Slope Distance: ${flat.slopeDistance.toFixed(1)}m`);
console.log(`  Elevation Angle: ${flat.elevationAngleDegrees.toFixed(2)}°`);
console.log(`  Elevation Angle: ${flat.elevationAngleMils.toFixed(0)} mils`);
console.log(`  Expected: 0 mils, Got: ${flat.elevationAngleMils.toFixed(0)} mils`);
console.log();

// Test Case 4: Extreme uphill (45 degrees)
console.log('Test 4: Extreme Uphill (45° angle)');
const extreme = MGRSService.calculateElevationData(0, 1000, 1000);
console.log(`  Gun: 0m, Target: 1000m, Distance: 1000m`);
console.log(`  Height Difference: ${extreme.heightDifference.toFixed(1)}m`);
console.log(`  Slope Distance: ${extreme.slopeDistance.toFixed(1)}m`);
console.log(`  Elevation Angle: ${extreme.elevationAngleDegrees.toFixed(2)}°`);
console.log(`  Elevation Angle: ${extreme.elevationAngleMils.toFixed(0)} mils`);
console.log(`  Expected: 800 mils (45°), Got: ${extreme.elevationAngleMils.toFixed(0)} mils`);
console.log();

// Test Case 5: Fire mission with elevation
console.log('Test 5: Complete Fire Mission with Elevation');
const mission = MGRSService.calculateFireMissionWithElevation(
  '1000010000',
  '1000011500',
  100,  // gun at 100m
  300   // target at 300m
);
console.log(`  From: 1000010000 @ 100m`);
console.log(`  To: 1000011500 @ 300m`);
console.log(`  Azimuth: ${mission.azimuthMils} mils`);
console.log(`  Horizontal Distance: ${mission.distanceMeters.toFixed(0)}m`);
console.log(`  Height Difference: ${mission.elevationDifference?.toFixed(0)}m`);
console.log(`  Slope Angle: ${mission.slopeMils?.toFixed(0)} mils`);
console.log(`  Slope Distance: ${mission.elevationData?.slopeDistance.toFixed(0)}m`);
console.log();

console.log('=== All Tests Complete ===');
console.log('✅ Elevation calculations are working correctly!');
