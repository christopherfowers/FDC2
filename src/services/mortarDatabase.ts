import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { 
  MortarSystem, 
  MortarRound, 
  MortarBallisticData,
  BallisticQueryParams,
  FireSolutionRequest,
  FireSolutionResponse
} from '../types/mortar';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MortarDatabase {
  private db: sqlite3.Database;

  constructor(dbPath?: string) {
    // Allow database path to be configured via environment variable
    const envDbPath = process.env.DATABASE_PATH;
    
    // Create a more robust database path
    const defaultPath = process.env.NODE_ENV === 'production' 
      ? '/app/data/mortar.db'  // Use /app/data in production (Docker)
      : path.join(__dirname, '../../data/mortar.db');
    
    const dbLocation = dbPath || envDbPath || defaultPath;
    
    console.log(`🎯 FDC2 Database Initialization`);
    console.log(`📊 NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`📁 Target database path: ${dbLocation}`);
    
    // Initialize with the primary path first
    this.db = this.createDatabase(dbLocation);
  }

  private createDatabase(dbLocation: string): sqlite3.Database {
    // Ensure the directory exists (both dev and production)
    const dbDir = path.dirname(dbLocation);
    
    try {
      // Check if directory exists, create if not
      if (!fs.existsSync(dbDir)) {
        console.log(`📁 Creating database directory: ${dbDir}`);
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(`✅ Directory created successfully`);
      } else {
        console.log(`📁 Database directory already exists: ${dbDir}`);
      }
      
      // Check directory permissions
      try {
        fs.accessSync(dbDir, fs.constants.W_OK);
        console.log(`✅ Database directory is writable: ${dbDir}`);
      } catch (permError) {
        console.error(`❌ Database directory not writable: ${dbDir}`, permError);
        
        if (process.env.NODE_ENV === 'production') {
          // List directory contents for debugging
          console.log(`🔍 Directory listing for ${dbDir}:`);
          try {
            const files = fs.readdirSync(dbDir);
            console.log(files);
          } catch (listError) {
            console.error(`Cannot list directory: ${listError}`);
          }
          
          // Fallback to /tmp in production if /app/data fails
          const fallbackPath = '/tmp/mortar.db';
          console.log(`🔄 Using fallback database path: ${fallbackPath}`);
          return this.createDatabase(fallbackPath);
        }
        throw permError;
      }
      
    } catch (dirError) {
      console.error(`❌ Failed to create database directory: ${dbDir}`, dirError);
      if (process.env.NODE_ENV === 'production') {
        // Use /tmp as absolute fallback
        const fallbackPath = '/tmp/mortar.db';
        console.log(`🔄 Using fallback database path: ${fallbackPath}`);
        return this.createDatabase(fallbackPath);
      }
      throw dirError;
    }
    
    return this.initializeWithPath(dbLocation);
  }

  private initializeWithPath(dbLocation: string): sqlite3.Database {
    console.log(`📊 Using database at: ${dbLocation}`);
    
    // Add extensive debugging before attempting to create database
    const dbDir = path.dirname(dbLocation);
    console.log(`🔍 Pre-database creation debugging:`);
    console.log(`  - Database file: ${dbLocation}`);
    console.log(`  - Database directory: ${dbDir}`);
    console.log(`  - Directory exists: ${fs.existsSync(dbDir)}`);
    console.log(`  - Current working directory: ${process.cwd()}`);
    console.log(`  - Process user: ${process.getuid ? process.getuid() : 'N/A'}`);
    
    // Check directory permissions more thoroughly
    try {
      const stats = fs.statSync(dbDir);
      console.log(`  - Directory permissions: ${stats.mode.toString(8)}`);
      console.log(`  - Directory owner: ${stats.uid}`);
    } catch (statError) {
      console.error(`  - Cannot stat directory: ${statError}`);
    }
    
    // Try to create a test file in the directory
    try {
      const testFile = path.join(dbDir, 'test-write.tmp');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log(`  - ✅ Directory is writable (test file created and deleted)`);
    } catch (writeError) {
      console.error(`  - ❌ Directory write test failed: ${writeError}`);
      
      // If we can't write to the intended directory, fall back to /tmp
      if (process.env.NODE_ENV === 'production' && dbLocation !== '/tmp/mortar.db') {
        console.log(`🔄 Falling back to /tmp/mortar.db due to write permission issue`);
        return this.initializeWithPath('/tmp/mortar.db');
      }
    }
    
    const db = new sqlite3.Database(dbLocation, (err) => {
      if (err) {
        console.error('❌ Failed to open database:', err);
        console.error('Database location that failed:', dbLocation);
        
        // Last resort fallback to /tmp
        if (process.env.NODE_ENV === 'production' && dbLocation !== '/tmp/mortar.db') {
          console.log(`🆘 Final fallback to /tmp/mortar.db`);
          // This is recursive but will stop at /tmp
          throw new Error('Database initialization failed, manual fallback required');
        }
        
        throw err;
      }
      console.log('✅ Database connection established');
    });
    
    // Initialize the database schema immediately
    this.initializeDatabaseSchema(db);
    
    return db;
  }

  private initializeDatabaseSchema(db: sqlite3.Database): void {
    db.serialize(() => {
      // Create mortar_system table
      db.run(`
        CREATE TABLE IF NOT EXISTS mortar_system (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          caliberMm REAL NOT NULL,
          nationality TEXT
        )
      `);

      // Create mortar_round table
      db.run(`
        CREATE TABLE IF NOT EXISTS mortar_round (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          roundType TEXT NOT NULL,
          caliberMm REAL NOT NULL,
          nationality TEXT
        )
      `);

      // Create mortar_round_data table
      db.run(`
        CREATE TABLE IF NOT EXISTS mortar_round_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          mortarSystemId INTEGER NOT NULL,
          mortarRoundId INTEGER NOT NULL,
          charge INTEGER NOT NULL DEFAULT 0,
          avgDispersionM REAL NOT NULL,
          rangeM INTEGER NOT NULL,
          elevationMils INTEGER NOT NULL,
          timeOfFlightS REAL NOT NULL,
          dElevPer100mMils REAL,
          dTofPer100mS REAL,
          FOREIGN KEY (mortarSystemId) REFERENCES mortar_system(id),
          FOREIGN KEY (mortarRoundId) REFERENCES mortar_round(id),
          UNIQUE(mortarSystemId, mortarRoundId, charge, rangeM)
        )
      `);

      // Create indexes for performance
      db.run(`CREATE INDEX IF NOT EXISTS idx_round_data_system ON mortar_round_data(mortarSystemId)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_round_data_round ON mortar_round_data(mortarRoundId)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_round_data_range ON mortar_round_data(rangeM)`);
    });
  }

  // Initialize with sample data from CSV files
  async seedDatabase(): Promise<void> {
    const fs = await import('fs');
    const csv = await import('csv-parser');
    
    // Define all CSV files to load
    const csvFiles = [
      'M821_HE_mortar_data.csv',
      'M819_Smoke_Shell_Ballistics.csv', 
      'M853A1_Illumination_Round_Ballistics.csv',
      'M879_Practice_Round_Ballistics.csv'
    ];

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

    const getRoundType = (shellName: string): string => {
      const shell = shellName.toLowerCase();
      if (shell.includes('he') || shell.includes('high explosive')) {
        return 'HE';
      } else if (shell.includes('smoke')) {
        return 'Smoke';
      } else if (shell.includes('illumination') || shell.includes('illum')) {
        return 'Illumination';
      } else if (shell.includes('practice')) {
        return 'Practice';
      } else {
        return 'HE'; // Default fallback
      }
    };

    // Load CSV data
    const csvData: CSVRow[] = [];
    const dataDir = path.join(__dirname, '../../data');
    
    for (const csvFile of csvFiles) {
      const csvPath = path.join(dataDir, csvFile);
      
      if (!fs.default.existsSync(csvPath)) {
        console.log(`⚠️  CSV file not found: ${csvFile}, skipping...`);
        continue;
      }

      console.log(`📊 Loading ${csvFile}...`);
      
      await new Promise<void>((resolve, reject) => {
        const results: CSVRow[] = [];
        
        fs.default.createReadStream(csvPath)
          .pipe(csv.default())
          .on('data', (data: CSVRow) => results.push(data))
          .on('end', () => {
            csvData.push(...results);
            console.log(`   ✓ Loaded ${results.length} rows from ${csvFile}`);
            resolve();
          })
          .on('error', reject);
      });
    }

    if (csvData.length === 0) {
      console.log('⚠️  No CSV data loaded, using fallback sample data');
      // Fallback to hardcoded data if no CSV files found
      return this.seedWithFallbackData();
    }

    console.log(`📊 Total loaded: ${csvData.length} rows from all CSV files`);

    // Clear existing data
    await this.clearAllData();

    // Extract unique mortar systems (normalize system names)
    const uniqueSystems = new Map<string, { name: string; caliberMm: number }>();
    csvData.forEach(row => {
      // Normalize mortar system names - they're all M252 mortars
      const normalizedSystemName = 'M252';
      
      if (!uniqueSystems.has(normalizedSystemName)) {
        uniqueSystems.set(normalizedSystemName, {
          name: normalizedSystemName,
          caliberMm: parseFloat(row.Diameter)
        });
      }
    });

    // Extract unique rounds
    const uniqueRounds = new Map<string, { name: string; roundType: string; caliberMm: number }>();
    csvData.forEach(row => {
      const roundKey = `${row.Shell}_${row.Diameter}`;
      if (!uniqueRounds.has(roundKey)) {
        uniqueRounds.set(roundKey, {
          name: row.Shell,
          roundType: getRoundType(row.Shell),
          caliberMm: parseFloat(row.Diameter)
        });
      }
    });

    // Insert mortar systems
    console.log('🎯 Inserting mortar systems...');
    const systemIds = new Map<string, number>();
    for (const [key, system] of uniqueSystems) {
      const id = await this.insertMortarSystem({
        name: system.name,
        caliberMm: system.caliberMm,
        nationality: 'US'
      });
      systemIds.set(key, id);
      console.log(`   ✓ ${system.name} (${system.caliberMm}mm) -> ID: ${id}`);
    }

    // Insert rounds
    console.log('💥 Inserting mortar rounds...');
    const roundIds = new Map<string, number>();
    for (const [key, round] of uniqueRounds) {
      const id = await this.insertMortarRound({
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
    let insertCount = 0;

    for (const row of csvData) {
      // Use normalized system name for lookup
      const normalizedSystemName = 'M252';
      const systemId = systemIds.get(normalizedSystemName);
      const roundKey = `${row.Shell}_${row.Diameter}`;
      const roundId = roundIds.get(roundKey);

      if (systemId && roundId) {
        const data = {
          mortarSystemId: systemId,
          mortarRoundId: roundId,
          charge: parseInt(row.Charge),
          rangeM: parseInt(row.Range),
          elevationMils: parseInt(row.Elevation),
          timeOfFlightS: parseFloat(row.TimeOfFlight),
          avgDispersionM: parseInt(row.AverageDeviation),
          dElevPer100mMils: row.DElevPer100MDr && row.DElevPer100MDr.trim() !== '' ? 
            parseFloat(row.DElevPer100MDr) : undefined,
          dTofPer100mS: row.ToFPer100MDr && row.ToFPer100MDr.trim() !== '' ? 
            parseFloat(row.ToFPer100MDr) : undefined
        };

        await this.insertBallisticData(data);
        insertCount++;
      }
    }

    console.log(`   ✓ Inserted ${insertCount} ballistic data points`);

    // Print summary
    console.log('\n📋 Database Summary:');
    const systems = await this.getMortarSystems();
    const rounds = await this.getMortarRounds();
    const ballistic = await this.getBallisticData({});

    console.log(`   🎯 Mortar Systems: ${systems.length}`);
    systems.forEach(s => console.log(`      - ${s.name} (${s.caliberMm}mm)`));
    
    console.log(`   💥 Mortar Rounds: ${rounds.length}`);
    rounds.forEach(r => console.log(`      - ${r.name} (${r.roundType})`));
    
    console.log(`   📊 Ballistic Data Points: ${ballistic.length}`);
    
    console.log('\n✅ Database seeding completed successfully!');
  }

  // Fallback method for when CSV files aren't available
  private async seedWithFallbackData(): Promise<void> {
    return new Promise((resolve) => {
      this.db.serialize(() => {
        // M252 mortar system and M821 HE round data from CSV
        const systems = [
          { name: 'M252', caliberMm: 81, nationality: 'US' }
        ];

        // M821 HE round
        const rounds = [
          { name: 'M821 HE', roundType: 'HE', caliberMm: 81, nationality: 'US' }
        ];

        // Insert systems
        const systemStmt = this.db.prepare('INSERT OR IGNORE INTO mortar_system (name, caliberMm, nationality) VALUES (?, ?, ?)');
        systems.forEach(system => {
          systemStmt.run(system.name, system.caliberMm, system.nationality);
        });
        systemStmt.finalize();

        // Insert rounds
        const roundStmt = this.db.prepare('INSERT OR IGNORE INTO mortar_round (name, roundType, caliberMm, nationality) VALUES (?, ?, ?, ?)');
        rounds.forEach(round => {
          roundStmt.run(round.name, round.roundType, round.caliberMm, round.nationality);
        });
        roundStmt.finalize();

        // Real M821 HE ballistic data from CSV (subset for different charges)
        const ballisticData = [
          // Charge 0
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 50, elevationMils: 1540, timeOfFlightS: 13.2, avgDispersionM: 6 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 100, elevationMils: 1479, timeOfFlightS: 13.2, avgDispersionM: 6 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 150, elevationMils: 1416, timeOfFlightS: 13.0, avgDispersionM: 6 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 200, elevationMils: 1350, timeOfFlightS: 12.8, avgDispersionM: 6 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 250, elevationMils: 1279, timeOfFlightS: 12.6, avgDispersionM: 6 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 300, elevationMils: 1201, timeOfFlightS: 12.3, avgDispersionM: 6 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 350, elevationMils: 1106, timeOfFlightS: 11.7, avgDispersionM: 6 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 400, elevationMils: 955, timeOfFlightS: 10.7, avgDispersionM: 6 },
          
          // Charge 1
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 100, elevationMils: 1547, timeOfFlightS: 20.0, avgDispersionM: 14 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 200, elevationMils: 1492, timeOfFlightS: 19.9, avgDispersionM: 14 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 300, elevationMils: 1437, timeOfFlightS: 19.7, avgDispersionM: 14 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 400, elevationMils: 1378, timeOfFlightS: 19.5, avgDispersionM: 14 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 500, elevationMils: 1317, timeOfFlightS: 19.2, avgDispersionM: 14 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 600, elevationMils: 1249, timeOfFlightS: 18.8, avgDispersionM: 14 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 700, elevationMils: 1174, timeOfFlightS: 18.3, avgDispersionM: 14 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 800, elevationMils: 1085, timeOfFlightS: 17.5, avgDispersionM: 14 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 900, elevationMils: 954, timeOfFlightS: 16.1, avgDispersionM: 14 },
          
          // Charge 2 
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 200, elevationMils: 1538, timeOfFlightS: 26.6, avgDispersionM: 24 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 400, elevationMils: 1475, timeOfFlightS: 26.4, avgDispersionM: 24 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 600, elevationMils: 1410, timeOfFlightS: 26.2, avgDispersionM: 24 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 800, elevationMils: 1341, timeOfFlightS: 25.8, avgDispersionM: 24 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 1000, elevationMils: 1266, timeOfFlightS: 25.2, avgDispersionM: 24 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 1200, elevationMils: 1180, timeOfFlightS: 24.4, avgDispersionM: 24 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 1400, elevationMils: 1076, timeOfFlightS: 23.2, avgDispersionM: 24 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 1600, elevationMils: 912, timeOfFlightS: 20.9, avgDispersionM: 24 },
          
          // Charge 3
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 400, elevationMils: 1511, timeOfFlightS: 31.6, avgDispersionM: 33 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 600, elevationMils: 1466, timeOfFlightS: 31.5, avgDispersionM: 33 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 800, elevationMils: 1419, timeOfFlightS: 31.3, avgDispersionM: 33 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 1000, elevationMils: 1370, timeOfFlightS: 31.0, avgDispersionM: 33 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 1200, elevationMils: 1318, timeOfFlightS: 30.6, avgDispersionM: 33 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 1400, elevationMils: 1263, timeOfFlightS: 30.1, avgDispersionM: 33 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 1600, elevationMils: 1202, timeOfFlightS: 29.4, avgDispersionM: 33 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 1800, elevationMils: 1133, timeOfFlightS: 28.5, avgDispersionM: 33 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 2000, elevationMils: 1051, timeOfFlightS: 27.3, avgDispersionM: 33 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 2200, elevationMils: 931, timeOfFlightS: 25.3, avgDispersionM: 33 },
          
          // Charge 4 (max range)
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 600, elevationMils: 1496, timeOfFlightS: 36.2, avgDispersionM: 42 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 800, elevationMils: 1460, timeOfFlightS: 36.0, avgDispersionM: 42 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 1000, elevationMils: 1424, timeOfFlightS: 35.8, avgDispersionM: 42 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 1200, elevationMils: 1385, timeOfFlightS: 35.6, avgDispersionM: 42 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 1400, elevationMils: 1346, timeOfFlightS: 35.3, avgDispersionM: 42 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 1600, elevationMils: 1305, timeOfFlightS: 34.9, avgDispersionM: 42 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 1800, elevationMils: 1261, timeOfFlightS: 34.4, avgDispersionM: 42 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 2000, elevationMils: 1214, timeOfFlightS: 33.8, avgDispersionM: 42 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 2200, elevationMils: 1162, timeOfFlightS: 33.1, avgDispersionM: 42 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 2400, elevationMils: 1104, timeOfFlightS: 32.2, avgDispersionM: 42 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 2600, elevationMils: 1034, timeOfFlightS: 31.0, avgDispersionM: 42 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 2800, elevationMils: 942, timeOfFlightS: 29.2, avgDispersionM: 42 },
          { mortarSystemId: 1, mortarRoundId: 1, rangeM: 2900, elevationMils: 870, timeOfFlightS: 27.7, avgDispersionM: 42 }
        ];

        const dataStmt = this.db.prepare(`
          INSERT OR IGNORE INTO mortar_round_data 
          (mortarSystemId, mortarRoundId, rangeM, elevationMils, timeOfFlightS, avgDispersionM, dElevPer100mMils, dTofPer100mS) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        ballisticData.forEach((data, index) => {
          // Calculate derivatives for interpolation
          const dElevPer100m = index < ballisticData.length - 1 ? 
            ((ballisticData[index + 1].elevationMils - data.elevationMils) / 
             (ballisticData[index + 1].rangeM - data.rangeM)) * 100 : null;
          
          const dTofPer100m = index < ballisticData.length - 1 ?
            ((ballisticData[index + 1].timeOfFlightS - data.timeOfFlightS) / 
             (ballisticData[index + 1].rangeM - data.rangeM)) * 100 : null;

          dataStmt.run(
            data.mortarSystemId, 
            data.mortarRoundId, 
            data.rangeM, 
            data.elevationMils, 
            data.timeOfFlightS, 
            data.avgDispersionM,
            dElevPer100m,
            dTofPer100m
          );
        });

        dataStmt.finalize(() => {
          resolve();
        });
      });
    });
  }

  // Get all mortar systems
  async getMortarSystems(): Promise<MortarSystem[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM mortar_system ORDER BY name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows as MortarSystem[]);
      });
    });
  }

  // Get all mortar rounds
  async getMortarRounds(caliberMm?: number): Promise<MortarRound[]> {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM mortar_round';
      const params: any[] = [];
      
      if (caliberMm) {
        query += ' WHERE caliberMm = ?';
        params.push(caliberMm);
      }
      
      query += ' ORDER BY name';
      
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as MortarRound[]);
      });
    });
  }

  // Get ballistic data with joined information
  async getBallisticData(params: BallisticQueryParams): Promise<MortarBallisticData[]> {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          mrd.*,
          ms.name as mortarSystemName,
          mr.name as mortarRoundName,
          mr.roundType as mortarRoundType
        FROM mortar_round_data mrd
        JOIN mortar_system ms ON mrd.mortarSystemId = ms.id
        JOIN mortar_round mr ON mrd.mortarRoundId = mr.id
        WHERE 1=1
      `;
      
      const queryParams: any[] = [];
      
      if (params.mortarSystemId) {
        query += ' AND mrd.mortarSystemId = ?';
        queryParams.push(params.mortarSystemId);
      }
      
      if (params.mortarRoundId) {
        query += ' AND mrd.mortarRoundId = ?';
        queryParams.push(params.mortarRoundId);
      }
      
      if (params.rangeMin) {
        query += ' AND mrd.rangeM >= ?';
        queryParams.push(params.rangeMin);
      }
      
      if (params.rangeMax) {
        query += ' AND mrd.rangeM <= ?';
        queryParams.push(params.rangeMax);
      }
      
      query += ' ORDER BY mrd.rangeM';
      
      this.db.all(query, queryParams, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as MortarBallisticData[]);
      });
    });
  }

  // Calculate fire solution for specific range
  async getFireSolution(request: FireSolutionRequest): Promise<FireSolutionResponse> {
    const data = await this.getBallisticData({
      mortarSystemId: request.mortarSystemId,
      mortarRoundId: request.mortarRoundId
    });

    if (data.length === 0) {
      throw new Error('No ballistic data found for this mortar system and round combination');
    }

    // Find exact match
    const exactMatch = data.find(d => d.rangeM === request.rangeM);
    if (exactMatch) {
      return {
        rangeM: exactMatch.rangeM,
        elevationMils: exactMatch.elevationMils,
        timeOfFlightS: exactMatch.timeOfFlightS,
        avgDispersionM: exactMatch.avgDispersionM,
        interpolated: false
      };
    }

    // Find bounding data points for interpolation
    const lowerBound = data.filter(d => d.rangeM < request.rangeM).pop();
    const upperBound = data.find(d => d.rangeM > request.rangeM);

    if (!lowerBound || !upperBound) {
      throw new Error(`Range ${request.rangeM}m is outside available ballistic data range`);
    }

    // Linear interpolation
    const rangeDiff = upperBound.rangeM - lowerBound.rangeM;
    const factor = (request.rangeM - lowerBound.rangeM) / rangeDiff;

    const elevationMils = Math.round(
      lowerBound.elevationMils + (upperBound.elevationMils - lowerBound.elevationMils) * factor
    );

    const timeOfFlightS = Number(
      (lowerBound.timeOfFlightS + (upperBound.timeOfFlightS - lowerBound.timeOfFlightS) * factor).toFixed(1)
    );

    const avgDispersionM = Number(
      (lowerBound.avgDispersionM + (upperBound.avgDispersionM - lowerBound.avgDispersionM) * factor).toFixed(1)
    );

    return {
      rangeM: request.rangeM,
      elevationMils,
      timeOfFlightS,
      avgDispersionM,
      interpolated: true
    };
  }

  // Insert methods for seeding

  async insertMortarSystem(system: Omit<MortarSystem, 'id'>): Promise<number> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare('INSERT INTO mortar_system (name, caliberMm, nationality) VALUES (?, ?, ?)');
      stmt.run(system.name, system.caliberMm, system.nationality, function(this: sqlite3.RunResult, err: Error | null) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
      stmt.finalize();
    });
  }

  async insertMortarRound(round: Omit<MortarRound, 'id'>): Promise<number> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare('INSERT INTO mortar_round (name, roundType, caliberMm, nationality) VALUES (?, ?, ?, ?)');
      stmt.run(round.name, round.roundType, round.caliberMm, round.nationality, function(this: sqlite3.RunResult, err: Error | null) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
      stmt.finalize();
    });
  }

  async insertBallisticData(data: {
    mortarSystemId: number;
    mortarRoundId: number;
    charge?: number;
    rangeM: number;
    elevationMils: number;
    timeOfFlightS: number;
    avgDispersionM: number;
    dElevPer100mMils?: number;
    dTofPer100mS?: number;
  }): Promise<number> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO mortar_round_data 
        (mortarSystemId, mortarRoundId, charge, rangeM, elevationMils, timeOfFlightS, avgDispersionM, dElevPer100mMils, dTofPer100mS) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        data.mortarSystemId, 
        data.mortarRoundId, 
        data.charge || 0,
        data.rangeM, 
        data.elevationMils, 
        data.timeOfFlightS, 
        data.avgDispersionM,
        data.dElevPer100mMils || null,
        data.dTofPer100mS || null,
        function(this: sqlite3.RunResult, err: Error | null) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
      stmt.finalize();
    });
  }

  async clearAllData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('DELETE FROM mortar_round_data');
        this.db.run('DELETE FROM mortar_round');
        this.db.run('DELETE FROM mortar_system', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.db.close(() => {
        resolve();
      });
    });
  }

  async hasData(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT COUNT(*) as count FROM mortar_system', (err: Error | null, row: any) => {
        if (err) reject(err);
        else resolve(row.count > 0);
      });
    });
  }
}
