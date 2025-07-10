import { MGRSService } from './services/mgrsService';

/**
 * Example usage of the MGRS Service for Fire Direction Center operations
 */

// Example 1: Basic fire mission calculation
console.log('=== Fire Mission Example ===');
const observerGrid = '33UXP12345678';
const targetGrid = '33UXP23456789';

const fireMission = MGRSService.calculateFireMission(observerGrid, targetGrid);
console.log(`Observer: ${observerGrid}`);
console.log(`Target: ${targetGrid}`);
console.log(`Azimuth: ${fireMission.azimuthMils} mils (${MGRSService.milsToDegrees(fireMission.azimuthMils).toFixed(1)}°)`);
console.log(`Back Azimuth: ${fireMission.backAzimuthMils} mils (${MGRSService.milsToDegrees(fireMission.backAzimuthMils).toFixed(1)}°)`);
console.log(`Distance: ${fireMission.distanceMeters.toFixed(0)} meters`);

// Example 2: Working with different grid precisions
console.log('\n=== Grid Precision Examples ===');
const grid6Digit = '33UXP123456';
const grid8Digit = '33UXP12345678';
const grid10Digit = '33UXP1234567890';

console.log(`6-digit grid: ${grid6Digit} -> Normalized: ${MGRSService.normalizeGrid(grid6Digit)}`);
console.log(`8-digit grid: ${grid8Digit} -> Normalized: ${MGRSService.normalizeGrid(grid8Digit)}`);
console.log(`10-digit grid: ${grid10Digit} -> Normalized: ${MGRSService.normalizeGrid(grid10Digit)}`);

// Example 3: Conversion between degrees and mils
console.log('\n=== Degree/Mil Conversions ===');
const degrees = [0, 45, 90, 180, 270, 360];
degrees.forEach(deg => {
  const mils = MGRSService.degreesToMils(deg);
  console.log(`${deg}° = ${mils} mils`);
});

const mils = [0, 800, 1600, 3200, 4800, 6400];
mils.forEach(mil => {
  const deg = MGRSService.milsToDegrees(mil);
  console.log(`${mil} mils = ${deg}°`);
});

// Example 4: Distance calculations
console.log('\n=== Distance Calculations ===');
const baseGrid = '33UXP0000000000';
const testGrids = [
  '33UXP0001000000', // 1000m east
  '33UXP0000001000', // 1000m north
  '33UXP0001001000', // 1000m northeast
];

testGrids.forEach(grid => {
  const distance = MGRSService.getDistance(baseGrid, grid);
  const azimuth = MGRSService.getAzimuthMils(baseGrid, grid);
  console.log(`From ${baseGrid} to ${grid}:`);
  console.log(`  Distance: ${distance.toFixed(0)} units, Azimuth: ${azimuth} mils (${MGRSService.milsToDegrees(azimuth).toFixed(1)}°)`);
});

// Example 5: Grid validation
console.log('\n=== Grid Validation ===');
const testGrids2 = [
  '33UXP123456',      // Valid 6-digit
  '33UXP12345678',    // Valid 8-digit
  '33UXP1234567890',  // Valid 10-digit
  'invalid',          // Invalid format
  '33UXP12345',       // Invalid (odd coordinates)
];

testGrids2.forEach(grid => {
  const isValid = MGRSService.isValidGrid(grid);
  console.log(`${grid}: ${isValid ? 'Valid' : 'Invalid'}`);
});

// Example 6: Coordinate-only format (Arma/Gaming style)
console.log('\n=== Coordinate-Only Format (Arma Style) ===');
const armaObserver = '1234567890';
const armaTarget = '1244568890';

const armaMission = MGRSService.calculateFireMission(armaObserver, armaTarget);
console.log(`Observer: ${armaObserver}`);
console.log(`Target: ${armaTarget}`);
console.log(`Azimuth: ${armaMission.azimuthMils} mils (${MGRSService.milsToDegrees(armaMission.azimuthMils).toFixed(1)}°)`);
console.log(`Distance: ${armaMission.distanceMeters.toFixed(0)} meters`);

// Example 7: Distance verification for gaming coordinates
console.log('\n=== Gaming Distance Examples ===');
const gameExamples = [
  { from: '1000010000', to: '1000020000', expected: '10km north' },
  { from: '1000010000', to: '1100010000', expected: '1km east' },
  { from: '1000010000', to: '1000010001', expected: '1m north' },
  { from: '1000010000', to: '1000110000', expected: '1m east' }
];

gameExamples.forEach(example => {
  const distance = MGRSService.getDistance(example.from, example.to);
  console.log(`${example.from} to ${example.to}: ${distance}m (${example.expected})`);
});

export { };
