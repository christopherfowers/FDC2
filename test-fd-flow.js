// Test to verify coordinates in fire direction service chain

import { MGRSService } from './src/services/mgrsService.js';

function testFireDirectionFlow(mortarGrid, targetGrid) {
    console.log(`\n=== Testing Fire Direction Flow ===`);
    console.log(`Mortar Grid: ${mortarGrid}`);
    console.log(`Target Grid: ${targetGrid}`);
    
    // Step 1: Calculate fire mission (what FireDirectionService does)
    const fireMission = MGRSService.calculateFireMission(mortarGrid, targetGrid);
    console.log(`Fire Mission Distance: ${fireMission.distanceMeters}m`);
    console.log(`Fire Mission Azimuth: ${fireMission.azimuthMils} mils`);
    
    // Step 2: Round distance (what FireDirectionService does)
    const targetRange = Math.round(fireMission.distanceMeters);
    console.log(`Rounded Target Range: ${targetRange}m`);
    
    return {
        originalDistance: fireMission.distanceMeters,
        roundedRange: targetRange
    };
}

// Test your coordinates
const result = testFireDirectionFlow('0233001710', '0346102579');

console.log(`\n=== Summary ===`);
console.log(`Distance should be ~1426m, got ${result.originalDistance}m`);
console.log(`Rounded range: ${result.roundedRange}m`);
