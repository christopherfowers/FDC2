# Fire Direction Center PWA

A modern Progressive Web Application for military fire direction calculations, built with React, TypeScript, and Vite. Fully static client-side application with CSV data assets.

## Features

### 🎯 Fire Mission Calculator
- Calculate firing solutions using MGRS coordinates
- Support for observer, mortar, and target positions
- Real-time ballistic calculations with interpolation
- Multiple ammunition types from static CSV data

### 🚀 Progressive Web App
- Full offline functionality with service worker caching
- Static CSV data loaded and cached for instant access
- Responsive design for desktop and mobile devices
- Install as native app on supported platforms

### 🧭 Navigation & UI
- Clean, modern interface with Font Awesome icons
- React Router navigation between Calculator and Settings
- Mobile-responsive design with sticky navigation
- Real-time PWA status indicators

### 📊 Static Data System
- CSV files as static assets for ballistic data
- Client-side CSV parsing and caching
- No backend server or database required
- Fast loading with smart data management

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
npm run dev
```

This will start the frontend development server on port 5173.

### Available Scripts

- `npm run dev` - Start frontend development server
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run Docker container
- `npm run test` - Run unit tests

## Architecture

### Frontend
- **React 19** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **React Router** for client-side navigation
- **Tailwind CSS v4** for responsive styling
- **Font Awesome** icons for enhanced UI

### Data Layer
- **CSV files** as static data assets
- **Client-side parsing** of ballistic data
- **No backend server** required - fully static

### PWA Features
- Service worker for offline caching
- Web app manifest for installation
- CSV data caching for offline access
- Responsive design for all devices

## Key Components

### Navigation
- Sticky navigation bar with active state indicators
- Mobile-responsive with collapsible text
- Font Awesome icons for visual clarity

### Calculator Page
- Round selection from available CSV data
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
- CSV data cached by service worker
- Static assets cached for complete offline operation
- No server dependencies

## Mobile Support

- Responsive design adapts to all screen sizes
- Touch-friendly interface elements
- Progressive enhancement for mobile browsers
- PWA installation on mobile devices

## Docker Deployment

Build and run as a static application:

```bash
# Build Docker image
docker build -t fdc2-app .

# Run container (serves on port 80)
docker run -p 80:80 fdc2-app
```

## Data Files

CSV ballistic data included:
- `M819_Smoke_Shell_Ballistics.csv`
- `M821_HE_mortar_data.csv`
- `M853A1_Illumination_Round_Ballistics.csv`
- `M879_Practice_Round_Ballistics.csv`
```
