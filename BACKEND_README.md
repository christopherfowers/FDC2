# Mortar Fire Direction Center (FDC) Backend API

A Node.js/Express backend with SQLite database for serving mortar ballistic data and fire solutions.

## Features

- **SQLite Database** with 3 tables:
  - `mortar_system` - Mortar system specifications
  - `mortar_round` - Round types and specifications  
  - `mortar_round_data` - Ballistic data (range, elevation, time of flight, dispersion)

- **REST API** with endpoints for:
  - Mortar systems and rounds
  - Ballistic data queries with filters
  - Fire solution calculations with interpolation
  - Compatible round lookups

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the backend server:**
   ```bash
   npm run server
   ```

3. **Server will start on port 3001** with automatic database initialization

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and timestamp.

### Mortar Systems
```
GET /api/mortar-systems
```
Returns all mortar systems (M252, M224, L16A2, RT-F1).

### Mortar Rounds
```
GET /api/mortar-rounds
GET /api/mortar-rounds?caliberMm=81
```
Returns all rounds, optionally filtered by caliber.

### Ballistic Data
```
GET /api/ballistic-data
GET /api/ballistic-data?mortarSystemId=1&mortarRoundId=1
GET /api/ballistic-data?rangeMin=1000&rangeMax=3000
```
Returns ballistic data with optional filters for system, round, and range.

### Fire Solution Calculation
```
POST /api/fire-solution
Content-Type: application/json

{
  "mortarSystemId": 1,
  "mortarRoundId": 1,
  "rangeM": 1500
}
```
Returns calculated fire solution:
```json
{
  "rangeM": 1500,
  "elevationMils": 1225,
  "timeOfFlightS": 19.0,
  "avgDispersionM": 35.0,
  "interpolated": true
}
```

### Compatible Rounds
```
GET /api/mortar-systems/1/compatible-rounds
```
Returns rounds compatible with a specific mortar system (same caliber).

### Ballistic Table
```
GET /api/ballistic-table/1/1
```
Returns complete ballistic table for a mortar system and round combination.

## Sample Data

The database includes realistic ballistic data for:
- **M252 81mm Mortar** with **M931 HE** rounds
- Range data from 100m to 5650m
- Elevation, time of flight, and dispersion values
- Interpolation support for ranges between data points

## Technology Stack

- **Node.js** with **Express**
- **SQLite3** database
- **TypeScript** for type safety
- **tsx** for running TypeScript directly
- **CORS** enabled for frontend integration

## Integration with MGRS Service

The backend pairs with the MGRS service for complete fire direction calculations:

1. Use MGRS service to calculate distance between observer and target
2. Use backend API to get fire solution for that range
3. Combine for complete fire mission data

Example workflow:
```typescript
import { MGRSService } from './services/mgrsService';

// Calculate distance using MGRS
const distance = MGRSService.getDistance('32SMT1234567890', '32SMT1250068500');

// Get fire solution from API
const response = await fetch('/api/fire-solution', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mortarSystemId: 1,
    mortarRoundId: 1,
    rangeM: Math.round(distance)
  })
});

const fireSolution = await response.json();
console.log(`Range: ${fireSolution.rangeM}m, Elevation: ${fireSolution.elevationMils} mils`);
```

## Scripts

- `npm run server` - Start the backend server
- `npm run server:watch` - Start with auto-restart on changes
- `npm test` - Run tests
- `npm run dev` - Start frontend development server (Vite)
