// Simple test to check MGRS parsing and distance calculation

// Simulate the parsing logic
function normalizeCoordinateOnly(coords) {
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

function parseGrid(gridString) {
    const normalizedGrid = normalizeCoordinateOnly(gridString);
    
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
    
    throw new Error('Failed to parse');
}

function getDistance(fromGrid, toGrid) {
    const fromCoord = parseGrid(fromGrid);
    const toCoord = parseGrid(toGrid);
    
    const deltaE = toCoord.easting - fromCoord.easting;
    const deltaN = toCoord.northing - fromCoord.northing;
    
    console.log(`From: ${fromGrid} -> easting=${fromCoord.easting}, northing=${fromCoord.northing}`);
    console.log(`To: ${toGrid} -> easting=${toCoord.easting}, northing=${toCoord.northing}`);
    console.log(`Delta E: ${deltaE}, Delta N: ${deltaN}`);
    
    const distance = Math.sqrt(deltaE * deltaE + deltaN * deltaN);
    console.log(`Distance: ${distance} meters`);
    
    return distance;
}

// Test with your coordinates
console.log('Testing MGRS distance calculation:');
const distance = getDistance('0233001710', '0346102579');
console.log(`\nFinal result: ${distance.toFixed(1)} meters`);
