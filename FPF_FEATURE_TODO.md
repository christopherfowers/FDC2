# Mission-Centric FDC Workflow Implementation TODO

## Overview
Restructuring the FDC app to use a mission-based workflow with three distinct phases:
1. **Mission Prep** - Setup positions, FPF targets, equipment, and initial parameters
2. **Fire Mission Calculations** - Configure specific Call for Fire (CFF) details and optimizations  
3. **Fire Solution** - Generate clean fire solution with command script and corrections interface

## Phase 1: Core Data Models & Mission Structure
- [x] Create mission-centric data models
  - [x] `Mission` interface (replaces Operation)
  - [x] `FPFTarget` interface  
  - [x] `FireMissionRecord` interface (enhanced)
  - [x] Mission state enums (`prep`, `active`, `complete`)
- [x] Extend AppContext for mission workflow
  - [x] Current mission state management
  - [x] Mission phase tracking
  - [x] Mission CRUD operations
- [x] Create mission service (`missionService.ts`)
  - [x] Mission lifecycle management
  - [x] Phase transitions
  - [x] Data persistence and validation
- [x] Update history service for mission-based tracking
  - [x] Group fire missions under parent mission
  - [x] Mission-level history and statistics
  - [x] Enhanced search and filtering

## Phase 2: Mission Prep Page (Phase 1 of User Workflow)
- [x] Create MissionPrepPage component ✅ Complete
  - [x] Mission name and description ✅ Complete
  - [x] Mortar position setup (MGRS input) ✅ Complete
  - [x] Gun platform selection and configuration ✅ Complete
  - [x] Number of guns/tubes setup ✅ Complete
  - [x] Initial FO position (if known) ✅ Complete
- [x] FPF Target Management within Mission Prep ✅ Complete
  - [x] Add/edit/delete FPF targets ✅ Complete
  - [x] Target priority assignment ✅ Complete
  - [x] Pre-calculate FPF solutions ✅ Complete
  - [x] FPF target validation ✅ Complete
- [x] Equipment Configuration ✅ Complete
  - [x] Mortar system selection ✅ Complete
  - [x] Available ammunition types ✅ Complete
  - [x] Default settings for mission ✅ Complete
- [x] Mission Prep validation and completion ✅ Complete
  - [x] Required field validation ✅ Complete
  - [x] Proceed to Fire Mission phase ✅ Complete

## Phase 3: Fire Mission Calculations Page (Phase 2 of User Workflow)  
- [x] Create FireMissionPage component ✅ Complete
  - [x] Update FO position (if needed from prep) ✅ Complete
  - [x] Target grid input and validation ✅ Complete
  - [x] FO to target details (azimuth, distance) ✅ Complete
  - [x] Fire mission type selection ✅ Complete
- [x] Call for Fire (CFF) Configuration ✅ Complete
  - [x] Fire control (fire when ready vs. on command) ✅ Complete
  - [x] Shell/round type selection for this mission ✅ Complete
  - [x] Number of rounds to fire ✅ Complete
  - [x] Special instructions/notes ✅ Complete
- [x] Tactical Optimization Selection ✅ Complete
  - [x] Speed (fastest time of flight) ✅ Complete
  - [x] Accuracy (best precision) ✅ Complete
  - [x] Dispersion (area target coverage) ✅ Complete
  - [x] High angle (obstacle clearance) ✅ Complete
  - [x] Efficiency (lowest charge) ✅ Complete
- [x] Quick FPF Target Selection ✅ Complete
  - [x] Select from pre-planned FPF targets ✅ Complete
  - [x] Auto-populate target coordinates ✅ Complete
  - [x] FPF-specific optimizations ✅ Complete

## Phase 4: Fire Solution Page (Phase 3 of User Workflow)
- [x] Create FireSolutionPage component ✅ Complete
  - [x] Clean, minimal fire solution display ✅ Complete
  - [x] Generated command script for firing line ✅ Complete
  - [x] Copy/share functionality for commands ✅ Complete
  - [x] **FIXED**: Integrate real FireDirectionService calculations ✅ Complete
- [x] Command Script Generation ✅ Complete
  - [x] Standard military fire command format ✅ Complete
  - [x] Mission-specific parameters included ✅ Complete
  - [x] Radio transmission ready format ✅ Complete
- [x] FO Corrections Interface ✅ Complete
  - [x] Quick correction input (add/drop, left/right) ✅ Complete
  - [x] Real-time solution recalculation ✅ Complete
  - [x] Correction history tracking ✅ Complete
  - [x] Apply corrections and update solution ✅ Complete
- [x] Mission Completion ✅ Complete
  - [x] Save complete mission to history ✅ Complete
  - [x] **FIXED**: Implement fire mission record creation and storage ✅ Complete
  - [x] Mission summary and statistics ✅ Complete
  - [x] Option to start new fire mission or new mission ✅ Complete

## Phase 5: Navigation & Workflow Integration
- [x] Update Navigation component ✅ Complete
  - [x] Add "New Mission" prominent button/tab ✅ Complete
  - [x] Show current mission status ✅ Complete
  - [x] Phase progress indicator ✅ Complete
  - [x] Quick access to current mission phases ✅ Complete
- [x] Update App.tsx routing ✅ Complete
  - [x] Mission-based routes (`/mission/prep`, `/mission/calculate`, `/mission/solution`) ✅ Complete
  - [x] Mission state persistence across navigation ✅ Complete
  - [x] Route guards for incomplete phases ✅ Complete
- [x] Create MissionDashboard component (landing page) ✅ Complete
  - [x] Start new mission ✅ Complete
  - [x] Resume incomplete missions ✅ Complete
  - [x] Recent mission history ✅ Complete
  - [x] Quick mission statistics ✅ Complete

## Phase 6: Enhanced Mission Features
- [x] Mission Templates ✅ Complete
  - [x] Save mission prep as template ✅ Complete
  - [x] Common FPF configurations ✅ Complete
  - [x] Quick mission setup from templates ✅ Complete
- [x] Mission History Enhancements ✅ Complete
  - [x] Mission-grouped history view ✅ Complete
  - [x] Search and filter by mission ✅ Complete
  - [x] Mission performance analytics ✅ Complete
  - [x] Export mission reports ✅ Complete
- [x] Advanced FPF Management ✅ Complete
  - [x] FPF sector assignments (service logic) ✅ Complete
  - [x] Overlapping field of fire analysis (service logic) ✅ Complete  
  - [x] FPF coverage visualization (UI component) ✅ Complete
  - [x] Integration into mission prep workflow ✅ Complete
- [x] Multi-gun Calculations ✅ Complete
  - [x] Gun spread calculations ✅ Complete
  - [x] Synchronized firing solutions ✅ Complete
  - [x] Load distribution across guns ✅ Complete

## Phase 7: User Experience & Polish
- [ ] Workflow Optimization
  - [ ] Smooth phase transitions
  - [ ] Auto-save progress
  - [ ] Quick edit capabilities
  - [ ] Keyboard shortcuts
- [ ] Mobile Experience
  - [ ] Touch-optimized phase navigation
  - [ ] Simplified mobile workflow
  - [ ] Offline mission capability
- [ ] Visual Enhancements
  - [ ] Mission phase progress visualization
  - [ ] Fire solution diagrams
  - [ ] Target relationship mapping
  - [ ] Command script formatting

## Phase 8: Testing & Deployment
- [ ] Legacy Migration
  - [ ] Migrate existing calculator state
  - [ ] Convert existing history to mission format
  - [ ] Preserve user settings
- [ ] Testing
  - [ ] Mission workflow testing
  - [ ] Phase transition testing
  - [ ] Data persistence testing
  - [ ] User acceptance testing
- [ ] Documentation
  - [ ] Mission workflow guide
  - [ ] FPF planning documentation
  - [ ] Updated user manual

## Phase 9: Search Engine Optimization

## Implementation Notes

### Data Models
```typescript
interface Mission {
  id: string;
  name: string;                    // "Operation Thunder", "Training Exercise Alpha"
  description?: string;
  status: 'prep' | 'active' | 'complete';
  currentPhase: 'prep' | 'calculate' | 'solution';
  
  // Mission Prep Data
  mortarPosition: string;          // MGRS grid
  numberOfGuns: number;            // Number of mortar tubes
  selectedSystem: string;          // Mortar system ID
  availableRounds: string[];       // Available ammunition types
  initialFOPosition?: string;      // Forward observer initial position
  fpfTargets: FPFTarget[];        // Pre-planned final protective fire targets
  
  // Fire Mission Data (populated during calculate phase)
  fireMissions: FireMissionRecord[];
  
  // Metadata
  created: Date;
  lastModified: Date;
  createdBy?: string;
}

interface FPFTarget {
  id: string;
  name: string;                    // "FPF Alpha", "FPF Bravo", etc.
  targetGrid: string;              // MGRS target location
  priority: 'primary' | 'alternate' | 'supplemental';
  sector?: string;                 // Assigned sector if applicable
  preplannedSolution?: {
    azimuthMils: number;
    elevationMils: number;
    chargeLevel: string;
    timeOfFlight: number;
    rangeMeters: number;
  };
  notes?: string;
  created: Date;
  lastCalculated?: Date;
}

interface FireMissionRecord {
  id: string;
  missionId: string;               // Parent mission ID
  timestamp: Date;
  
  // Call for Fire Details
  targetGrid: string;
  foPosition: string;              // FO position for this specific fire mission
  fireControl: 'fire_when_ready' | 'on_command';
  roundType: string;               // Shell type for this mission
  numberOfRounds: number;
  specialInstructions?: string;
  
  // Tactical Optimization
  optimization: 'speed' | 'accuracy' | 'dispersion' | 'high_angle' | 'efficiency';
  
  // Fire Solution
  fireSolution: {
    azimuthMils: number;
    elevationMils: number;
    chargeLevel: string;
    timeOfFlight: number;
    rangeMeters: number;
  };
  
  // Command Script
  generatedCommand: string;
  
  // Corrections (if any)
  corrections: {
    id: string;
    timestamp: Date;
    rangeCorrection: number;       // meters (+ add, - drop)
    directionCorrection: number;   // mils (+ right, - left)
    adjustedSolution: FireSolution;
  }[];
  
  // Status
  status: 'planned' | 'fired' | 'adjusted' | 'complete';
  notes?: string;
}
```

### Storage Keys
- `fdc-missions`: All mission data
- `fdc-current-mission-id`: ID of currently active mission
- `fdc-mission-phase`: Current phase of active mission

### User Workflow
1. **Landing/Dashboard**: Start new mission or resume existing
2. **Mission Prep** (`/mission/prep`): 
   - Set positions, equipment, FPF targets
   - Configure mission parameters
3. **Fire Mission** (`/mission/calculate`):
   - Configure specific CFF details
   - Select optimization and fire control
4. **Fire Solution** (`/mission/solution`):
   - Display clean fire solution
   - Provide command script
   - Handle FO corrections
5. **Mission Complete**: Save to history, start new fire mission or new mission

---

## Progress Tracking
- **Phase 1**: ✅ Complete
- **Phase 2**: ✅ Complete (Mission Prep Page fully implemented)  
- **Phase 3**: ✅ Complete (Fire Mission Calculations Page)
- **Phase 4**: ✅ Complete (Fire Solution Page)
- **Phase 5**: ✅ Complete (Navigation & Workflow Integration fully implemented)
- **Phase 6**: ✅ Complete (Enhanced Mission Features)
- **Phase 7**: ⏳ Not Started
- **Phase 8**: ⏳ Not Started

**Legend**: ⏳ Not Started | 🚧 In Progress | ✅ Complete | ❌ Blocked

---

**Last Updated**: July 12, 2025  
**Feature Branch**: `feature/fpf`  
**Target Release**: TBD
