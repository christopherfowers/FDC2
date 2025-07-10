# Fire Direction Center PWA

A modern Progressive Web Application for military fire direction calculations, built with React, TypeScript, and Vite.

## Features

### 🎯 Fire Mission Calculator
- Calculate firing solutions using MGRS coordinates
- Support for observer, mortar, and target positions
- Real-time ballistic calculations with interpolation
- Compatible mortar systems and ammunition types

### 🚀 Progressive Web App
- Full offline functionality with service worker caching
- Automatic updates when new data is available
- Responsive design for desktop and mobile devices
- Install as native app on supported platforms

### 🧭 Navigation & UI
- Clean, modern interface with Font Awesome icons
- React Router navigation between Calculator and Settings
- Mobile-responsive design with sticky navigation
- Real-time PWA status indicators

### ⚙️ Backend Integration
- SQLite database with comprehensive ballistic data
- REST API for mortar systems, rounds, and calculations
- Smart data caching with localStorage
- Background update checks

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd FDC2
```

2. Install dependencies:
```bash
npm install
```

3. Start the development environment:
```bash
npm run dev:full
```

This will start both the frontend (port 5174) and backend API server (port 3001).

### Available Scripts

- `npm run dev` - Start frontend development server
- `npm run dev:full` - Start both frontend and backend servers
- `npm run build` - Build for production
- `npm run server` - Start backend API server
- `npm run test` - Run unit tests

## Architecture

### Frontend
- **React 19** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **React Router** for client-side navigation
- **Tailwind CSS v4** for responsive styling
- **Font Awesome** icons for enhanced UI

### Backend
- **Node.js/Express** REST API server
- **SQLite** database with mortar and ballistic data
- **CORS** enabled for cross-origin requests

### PWA Features
- Service worker for offline caching
- Web app manifest for installation
- Background sync for data updates
- Responsive design for all devices

## Key Components

### Navigation
- Sticky navigation bar with active state indicators
- Mobile-responsive with collapsible text
- Font Awesome icons for visual clarity

### Calculator Page
- Three-position input system (Observer, Mortar, Target)
- Real-time validation and error handling
- Comprehensive results display with firing commands

### Settings Page
- PWA status and update management
- Data cache controls and offline capabilities
- Application information and version details

## MGRS Support

The application uses the Military Grid Reference System (MGRS) for all coordinate inputs:
- Full validation of MGRS grid formats
- Distance and azimuth calculations
- Support for all UTM zones and grid squares

## Offline Functionality

- All calculations run client-side for offline capability
- Ballistic data cached in localStorage
- Service worker caches static assets and API responses
- Graceful degradation when offline

## Mobile Support

- Responsive design adapts to all screen sizes
- Touch-friendly interface elements
- Progressive enhancement for mobile browsers
- PWA installation on mobile devices
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
