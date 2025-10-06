// Test script to verify CSV data service works
import { CSVDataService } from './src/services/csvDataService.js';

console.log('🧪 Testing CSV Data Service...');

const csvService = CSVDataService.getInstance();

try {
  const data = await csvService.loadData();
  
  console.log('\n📊 Results:');
  console.log(`Systems: ${data.systems.length}`);
  data.systems.forEach(s => console.log(`  - ${s.id}: ${s.name} (${s.caliberMm}mm)`));
  
  console.log(`\nRounds: ${data.rounds.length}`);
  data.rounds.forEach(r => console.log(`  - ${r.id}: ${r.name} (${r.roundType}, ${r.caliberMm}mm)`));
  
  console.log(`\nBallistic Data: ${data.ballisticData.length} entries`);
  console.log('Sample entries:');
  data.ballisticData.slice(0, 3).forEach(b => 
    console.log(`  - ID ${b.id}: System ${b.mortarSystemId}, Round ${b.mortarRoundId}, Range ${b.rangeM}m, Elev ${b.elevationMils} mils`)
  );
  
  console.log('\n✅ CSV Data Service test completed successfully!');
} catch (error) {
  console.error('❌ Test failed:', error);
}
