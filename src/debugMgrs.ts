import { MGRSService } from './services/mgrsService';

// Debug coordinate parsing
console.log('=== Debugging Coordinate Parsing ===');

const coords = [
  '1000010000',
  '1000020000',
  '1000110000',
  '0000000000',
  '0005000000'
];

coords.forEach(coord => {
  const parsed = MGRSService.parseGrid(coord);
  console.log(`${coord} -> easting: ${parsed.easting}, northing: ${parsed.northing}`);
});

console.log('\n=== Distance Tests ===');
console.log('1000010000 to 1000020000:', MGRSService.getDistance('1000010000', '1000020000'));
console.log('1000010000 to 1000110000:', MGRSService.getDistance('1000010000', '1000110000'));
console.log('0000000000 to 0005000000:', MGRSService.getDistance('0000000000', '0005000000'));

export { };
