import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { MortarDatabase } from './services/mortarDatabase';
import type { 
  BallisticQueryParams, 
  FireSolutionRequest 
} from './types/mortar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
const mortarDb = new MortarDatabase();

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get all mortar systems
app.get('/api/mortar-systems', async (_req, res) => {
  try {
    const systems = await mortarDb.getMortarSystems();
    res.json(systems);
  } catch (error) {
    console.error('Error fetching mortar systems:', error);
    res.status(500).json({ error: 'Failed to fetch mortar systems' });
  }
});

// Get mortar rounds, optionally filtered by caliber
app.get('/api/mortar-rounds', async (req, res) => {
  try {
    const caliberMm = req.query.caliberMm ? Number(req.query.caliberMm) : undefined;
    const rounds = await mortarDb.getMortarRounds(caliberMm);
    res.json(rounds);
  } catch (error) {
    console.error('Error fetching mortar rounds:', error);
    res.status(500).json({ error: 'Failed to fetch mortar rounds' });
  }
});

// Get ballistic data with optional filters
app.get('/api/ballistic-data', async (req, res) => {
  try {
    const params: BallisticQueryParams = {
      mortarSystemId: req.query.mortarSystemId ? Number(req.query.mortarSystemId) : undefined,
      mortarRoundId: req.query.mortarRoundId ? Number(req.query.mortarRoundId) : undefined,
      rangeMin: req.query.rangeMin ? Number(req.query.rangeMin) : undefined,
      rangeMax: req.query.rangeMax ? Number(req.query.rangeMax) : undefined
    };

    const data = await mortarDb.getBallisticData(params);
    res.json(data);
  } catch (error) {
    console.error('Error fetching ballistic data:', error);
    res.status(500).json({ error: 'Failed to fetch ballistic data' });
  }
});

// Calculate fire solution for specific range
app.post('/api/fire-solution', async (req, res) => {
  try {
    const request: FireSolutionRequest = req.body;
    
    // Validate request
    if (!request.mortarSystemId || !request.mortarRoundId || !request.rangeM) {
      return res.status(400).json({ 
        error: 'Missing required fields: mortarSystemId, mortarRoundId, rangeM' 
      });
    }

    if (request.rangeM <= 0) {
      return res.status(400).json({ 
        error: 'Range must be greater than 0' 
      });
    }

    const solution = await mortarDb.getFireSolution(request);
    res.json(solution);
  } catch (error) {
    console.error('Error calculating fire solution:', error);
    
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to calculate fire solution' });
    }
  }
});

// Get compatible rounds for a mortar system
app.get('/api/mortar-systems/:systemId/compatible-rounds', async (req, res) => {
  try {
    const systemId = Number(req.params.systemId);
    
    // Get the mortar system to find its caliber
    const systems = await mortarDb.getMortarSystems();
    const system = systems.find(s => s.id === systemId);
    
    if (!system) {
      return res.status(404).json({ error: 'Mortar system not found' });
    }

    // Get rounds matching the caliber
    const compatibleRounds = await mortarDb.getMortarRounds(system.caliberMm);
    res.json(compatibleRounds);
  } catch (error) {
    console.error('Error fetching compatible rounds:', error);
    res.status(500).json({ error: 'Failed to fetch compatible rounds' });
  }
});

// Get ballistic table for specific mortar system and round combination
app.get('/api/ballistic-table/:systemId/:roundId', async (req, res) => {
  try {
    const systemId = Number(req.params.systemId);
    const roundId = Number(req.params.roundId);
    
    const data = await mortarDb.getBallisticData({
      mortarSystemId: systemId,
      mortarRoundId: roundId
    });

    if (data.length === 0) {
      return res.status(404).json({ 
        error: 'No ballistic data found for this mortar system and round combination' 
      });
    }

    res.json({
      mortarSystem: data[0].mortarSystemName,
      mortarRound: data[0].mortarRoundName,
      roundType: data[0].mortarRoundType,
      ballisticData: data.map(d => ({
        rangeM: d.rangeM,
        elevationMils: d.elevationMils,
        timeOfFlightS: d.timeOfFlightS,
        avgDispersionM: d.avgDispersionM
      }))
    });
  } catch (error) {
    console.error('Error fetching ballistic table:', error);
    res.status(500).json({ error: 'Failed to fetch ballistic table' });
  }
});

// Serve static files in production
if (NODE_ENV === 'production') {
  // Serve static files from the React app build directory
  const buildPath = path.join(__dirname, '../dist');
  console.log('Build Path:', buildPath);
  app.use(express.static(buildPath));
  
  console.log(`🗂️  Serving static files from: ${buildPath}`);
}

// Error handling middleware
app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (!_next) {
    console.debug('No next function provided, using default error handler');  
  }
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database with sample data and start server
async function startServer() {
  try {
    console.log('Initializing database...');
    
    // Check if database already has data
    const hasData = await mortarDb.hasData();
    if (!hasData) {
      await mortarDb.seedDatabase();
      console.log('Database initialized with sample data');
    } else {
      console.log('Database already contains data, skipping seeding');
    }
    
    app.listen(PORT, () => {
      console.log('\n🎯 Fire Direction Calculator Server');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      
      if (NODE_ENV === 'production') {
        console.log(`🗂️  Serving React app at http://localhost:${PORT}`);
      } else {
        console.log(`🧑‍💻 Development mode - API only at http://localhost:${PORT}`);
      }
      
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🎯 API endpoints:`);
      console.log(`   GET  /api/mortar-systems`);
      console.log(`   GET  /api/mortar-rounds`);
      console.log(`   GET  /api/ballistic-data`);
      console.log(`   POST /api/fire-solution`);
      console.log(`   GET  /api/mortar-systems/:systemId/compatible-rounds`);
      console.log(`   GET  /api/ballistic-table/:systemId/:roundId`);
      
      if (NODE_ENV === 'production') {
        console.log(`\n🚀 Ready for production deployment!`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  mortarDb.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  mortarDb.close();
  process.exit(0);
});

// Start the server
startServer();

export default app;
