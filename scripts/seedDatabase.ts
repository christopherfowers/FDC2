import fs from 'fs';
import path from 'path';
// @ts-ignore - csv-parser doesn't have types
import csv from 'csv-parser';
import { MortarDatabase } from '../src/services/mortarDatabase.js';

interface CSVRow {
  MortarSystem: string;
  Shell: string;
  Diameter: string;
  Charge: string;
  AverageDeviation: string;
  Range: string;
  Elevation: string;
  TimeOfFlight: string;
  DElevPer100MDr: string;
  ToFPer100MDr: string;
}

interface ParsedBallisticData {
  mortarSystemId: number;
  mortarRoundId: number;
  charge: number;
  rangeM: number;
  elevationMils: number;
  timeOfFlightS: number;
  avgDispersionM: number;
  dElevPer100mMils?: number;
  dTofPer100mS?: number;
}

class DatabaseSeeder {
  private db: MortarDatabase;
  private csvData: CSVRow[] = [];

  constructor() {
    // Create a fresh database
    const dbPath = path.join(process.cwd(), 'data', 'mortar.db');
    
    // Remove existing database
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('🗑️  Removed existing database');
    }
    
    this.db = new MortarDatabase(dbPath);
  }

  async loadCSVData(csvPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const results: CSVRow[] = [];
      
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data: CSVRow) => results.push(data))
        .on('end', () => {
          this.csvData = results;
          console.log(`📊 Loaded ${results.length} rows from CSV`);
          resolve();
        })
        .on('error', reject);
    });
  }

  async seedDatabase(): Promise<void> {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await this.db.clearAllData();

    // Extract unique mortar systems
    const uniqueSystems = new Map<string, { name: string; caliberMm: number }>();
    this.csvData.forEach(row => {
      if (!uniqueSystems.has(row.MortarSystem)) {
        uniqueSystems.set(row.MortarSystem, {
          name: row.MortarSystem,
          caliberMm: parseFloat(row.Diameter)
        });
      }
    });

    // Extract unique rounds
    const uniqueRounds = new Map<string, { name: string; roundType: string; caliberMm: number }>();
    this.csvData.forEach(row => {
      const roundKey = `${row.Shell}_${row.Diameter}`;
      if (!uniqueRounds.has(roundKey)) {
        uniqueRounds.set(roundKey, {
          name: row.Shell,
          roundType: 'HE', // High Explosive based on the M821 HE designation
          caliberMm: parseFloat(row.Diameter)
        });
      }
    });

    // Insert mortar systems
    console.log('🎯 Inserting mortar systems...');
    const systemIds = new Map<string, number>();
    for (const [key, system] of uniqueSystems) {
      const id = await this.db.insertMortarSystem({
        name: system.name,
        caliberMm: system.caliberMm,
        nationality: 'US' // Assuming US for M252
      });
      systemIds.set(key, id);
      console.log(`   ✓ ${system.name} (${system.caliberMm}mm) -> ID: ${id}`);
    }

    // Insert rounds
    console.log('💥 Inserting mortar rounds...');
    const roundIds = new Map<string, number>();
    for (const [key, round] of uniqueRounds) {
      const id = await this.db.insertMortarRound({
        name: round.name,
        roundType: round.roundType,
        caliberMm: round.caliberMm,
        nationality: 'US'
      });
      roundIds.set(key, id);
      console.log(`   ✓ ${round.name} (${round.roundType}, ${round.caliberMm}mm) -> ID: ${id}`);
    }

    // Process and insert ballistic data
    console.log('📈 Inserting ballistic data...');
    const ballisticData: ParsedBallisticData[] = [];

    this.csvData.forEach(row => {
      const systemId = systemIds.get(row.MortarSystem);
      const roundKey = `${row.Shell}_${row.Diameter}`;
      const roundId = roundIds.get(roundKey);

      if (systemId && roundId) {
        const data: ParsedBallisticData = {
          mortarSystemId: systemId,
          mortarRoundId: roundId,
          charge: parseInt(row.Charge),
          rangeM: parseInt(row.Range),
          elevationMils: parseInt(row.Elevation),
          timeOfFlightS: parseFloat(row.TimeOfFlight),
          avgDispersionM: parseInt(row.AverageDeviation)
        };

        // Parse derivatives if available
        if (row.DElevPer100MDr && row.DElevPer100MDr.trim() !== '') {
          data.dElevPer100mMils = parseFloat(row.DElevPer100MDr);
        }
        if (row.ToFPer100MDr && row.ToFPer100MDr.trim() !== '') {
          data.dTofPer100mS = parseFloat(row.ToFPer100MDr);
        }

        ballisticData.push(data);
      }
    });

    // Insert ballistic data in batches
    for (const data of ballisticData) {
      await this.db.insertBallisticData(data);
    }

    console.log(`   ✓ Inserted ${ballisticData.length} ballistic data points`);

    // Print summary
    console.log('\n📋 Database Summary:');
    const systems = await this.db.getMortarSystems();
    const rounds = await this.db.getMortarRounds();
    const ballistic = await this.db.getBallisticData({});

    console.log(`   🎯 Mortar Systems: ${systems.length}`);
    systems.forEach(s => console.log(`      - ${s.name} (${s.caliberMm}mm)`));
    
    console.log(`   💥 Mortar Rounds: ${rounds.length}`);
    rounds.forEach(r => console.log(`      - ${r.name} (${r.roundType})`));
    
    console.log(`   📊 Ballistic Data Points: ${ballistic.length}`);
    
    // Show charge levels
    const charges = [...new Set(ballisticData.map(d => d.charge))].sort((a, b) => a - b);
    console.log(`   ⚡ Charge Levels: ${charges.join(', ')}`);
    
    // Show range coverage
    const ranges = ballisticData.map(d => d.rangeM);
    console.log(`   📏 Range Coverage: ${Math.min(...ranges)}m - ${Math.max(...ranges)}m`);

    console.log('\n✅ Database seeding completed successfully!');
  }

  async close(): Promise<void> {
    await this.db.close();
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting database seeder...');
  const seeder = new DatabaseSeeder();
  
  try {
    const csvPath = path.join(process.cwd(), 'data', 'M821_HE_mortar_data.csv');
    console.log(`📁 Looking for CSV file at: ${csvPath}`);
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }
    
    console.log('✅ CSV file found, loading data...');
    await seeder.loadCSVData(csvPath);
    await seeder.seedDatabase();
    console.log('🎉 Seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await seeder.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
