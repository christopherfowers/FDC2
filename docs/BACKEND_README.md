# Mortar Fire Direction Center (FDC) - Static Data System

A fully client-side Fire Direction Center application with static CSV data assets for mortar ballistic calculations.

## Features

- **Static CSV Data** files:
  - M819_Smoke_Shell_Ballistics.csv
  - M821_HE_mortar_data.csv
  - M853A1_Illumination_Round_Ballistics.csv
  - M879_Practice_Round_Ballistics.csv

- **Client-side Data Service** with capabilities for:
  - Loading and parsing CSV ballistic data
  - Fire solution calculations with interpolation
  - Offline caching via service worker
  - No server dependencies

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build and serve the static app:**
   ```bash
   npm run build
   npm run preview
   ```

3. **App will be available on port 4173** as a fully static site

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and timestamp.

### Mortar Systems
```
## CSV Data Structure

Each CSV file contains columns for:
- Range (meters)
- Elevation (mils)
- Time of Flight (seconds)
- Dispersion (meters)

### Available Data Files
- `M819_Smoke_Shell_Ballistics.csv`
- `M821_HE_mortar_data.csv`
- `M853A1_Illumination_Round_Ballistics.csv`
- `M879_Practice_Round_Ballistics.csv`
## Data Structure

The CSV files contain ballistic data with columns:
- Range (meters)
- Elevation (mils)
- Time of Flight (seconds)
- Dispersion (meters)

### Fire Solution Calculation

The client-side service provides fire solution calculations with interpolation:

```typescript
import { csvDataService } from './services/csvDataService';

// Get fire solution for a specific range
const fireSolution = await csvDataService.getFireSolution('M821', 1500);

console.log(`Range: ${fireSolution.rangeM}m, Elevation: ${fireSolution.elevationMils} mils`);
```

### Available Round Types

- **M819** - Smoke Shell
- **M821** - High Explosive (HE)
- **M853A1** - Illumination Round
- **M879** - Practice Round

## Technology Stack

- **React** with **TypeScript**
- **Vite** for build tooling
- **CSV parsing** for data loading
- **Service Worker** for offline caching
- **Static hosting** ready

## Integration with MGRS Service

The application includes MGRS service for complete fire direction calculations:

1. Use MGRS service to calculate distance between observer and target
2. Use CSV data service to get fire solution for that range
3. Combine for complete fire mission data

Example workflow:
```typescript
import { MGRSService } from './services/mgrsService';
import { csvDataService } from './services/csvDataService';

// Calculate distance using MGRS
const distance = MGRSService.getDistance('32SMT1234567890', '32SMT1250068500');

// Get fire solution from CSV data
const fireSolution = await csvDataService.getFireSolution('M821', Math.round(distance));

console.log(`Range: ${fireSolution.rangeM}m, Elevation: ${fireSolution.elevationMils} mils`);
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run dev` - Start frontend development server (Vite)
