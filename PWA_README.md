# Fire Direction Center (FDC) - PWA Ready

A Progressive Web Application for mortar fire direction calculations using MGRS coordinates. Features offline capability, service worker caching, and complete static client-side operation.

## 🚀 Features

### ✅ **PWA Ready**
- **Offline Support** - Works without internet connection
- **Service Worker** - Caches static assets and CSV data
- **App Installation** - Install on desktop and mobile devices  
- **Background Updates** - Automatic updates with user notification
- **Responsive Design** - Works on all device sizes

### ✅ **Complete Client-Side Operation**
- **MGRS Service** - Grid normalization, validation, distance/azimuth calculations
- **Fire Direction Service** - Ballistic calculations with interpolation
- **CSV Data Loading** - Static data assets with smart caching
- **Offline Mode** - Full functionality without any server dependencies

### ✅ **Static Data Assets**
- **CSV Files** - Mortar ballistic data as static assets
- **No Backend Required** - Fully client-side architecture
- **Fast Loading** - Pre-cached data for instant access

## 🏗️ Architecture

### Static Client-Side Design
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │    │  Service Worker  │    │  Static Assets  │
│                 │    │                  │    │                 │
│ • MGRS Service  │◄──►│ • Cache Static   │◄──►│ • CSV Data      │
│ • FD Service    │    │ • Cache CSV Data │    │ • App Assets    │
│ • CSV Service   │    │ • Offline Mode   │    │ • No Backend    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Data Flow
1. **App Loads** → Check cache → Load from service worker
2. **Data Load** → Load CSV files from static assets
3. **Calculate** → Use frontend services (MGRS + Fire Direction)
4. **Offline Mode** → Use cached data completely (no server needed)

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone and install
git clone <repository>
cd FDC2
npm install

# Start development (static with CSV data)
npm run dev

# Build for production
npm run build
npm run preview
```

### Development URLs
- **Frontend**: http://localhost:5173
- **Preview Build**: http://localhost:4173

## 📱 PWA Installation

### Desktop (Chrome/Edge)
1. Visit the app in browser
2. Look for install icon in address bar
3. Click "Install FDC"

### Mobile (iOS Safari)
1. Open app in Safari
2. Tap Share button
3. Select "Add to Home Screen"

### Mobile (Android Chrome)
1. Open app in Chrome
2. Tap menu (⋮)
3. Select "Install app"

## 🔧 Configuration

### Environment Variables (`.env`)
```bash
# PWA Configuration  
VITE_APP_NAME="Fire Direction Center"
VITE_APP_SHORT_NAME="FDC"
```

### Service Worker
- **Cache Strategy**: Cache-first for static assets and CSV data
- **Update Strategy**: Background update with user notification
- **Offline Fallback**: Cached data and app shell (no backend required)

## 🎯 Usage

### Fire Mission Calculation
1. **Enter Coordinates**
   - Observer grid (MGRS format)
   - Target grid (MGRS format)
   
2. **Select Equipment**
   - Choose round type (M819, M821, M853A1, M879)
   - Data loaded from static CSV files
   
3. **Calculate**
   - Distance and azimuth automatically calculated
   - Fire solution with elevation and time of flight
   - Interpolation for ranges between data points

### MGRS Coordinate Formats
```bash
# Full MGRS (with zone/band/square)
32SMT1234567890
32SMT 1234567890

# Coordinate-only (Arma-style)  
1234567890
123456 (6-digit)
12345678 (8-digit)
```

### Offline Capabilities
- ✅ **Complete fire mission calculations**
- ✅ **MGRS coordinate processing**
- ✅ **Ballistic data interpolation**
- ✅ **App installation and updates**
- ❌ Fresh data updates (requires connection)

## 🏗️ Building for Production

### PWA Build
```bash
# Build optimized PWA
npm run build

# Preview production build
npm run preview

# Build with backend
npm run build:pwa
```

### Deployment Checklist
- [ ] Configure HTTPS (required for PWA)
- [ ] Set correct `VITE_API_URL` for production
- [ ] Generate app icons (72x72 to 512x512)
- [ ] Test offline functionality
- [ ] Verify service worker caching
- [ ] Test app installation

## 🧪 Testing

### Run Tests
```bash
# Run unit tests
npm test

# Run tests with UI
npm test:ui

# Run once
npm test:run
```

### PWA Testing
1. **Lighthouse** - PWA score and performance
2. **Offline Mode** - Disconnect network and test
3. **Installation** - Test on different devices/browsers
4. **Updates** - Test service worker update flow

## 📊 Data Management

### Cache Strategy
- **Static Assets** - Cached indefinitely, updated on app version change
- **API Data** - Cached for 1 hour, background refresh
- **User Preference** - Force refresh and clear cache options

### Data Sources
- **Mortar Systems** - M252, M224, L16A2, RT-F1
- **Round Types** - HE, Smoke, Illumination
- **Ballistic Data** - Range 100m-5650m with interpolation

## 🔧 Technical Details

### Key Technologies
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Service Worker** for PWA features
- **CSV files** for data storage

### Performance Optimizations
- **Code Splitting** - Vendor and service chunks
- **Tree Shaking** - Remove unused code
- **Compression** - Gzip/Brotli for static assets
- **Caching** - Aggressive caching with smart invalidation

### Browser Support
- **Chrome** 80+ (recommended)
- **Firefox** 75+
- **Safari** 13.1+
- **Edge** 80+

## 🚀 Deployment Examples

### Static Hosting (Netlify/Vercel)
1. Build the app: `npm run build`
2. Deploy the `dist` folder
3. Configure redirects for SPA routing

### Self-Hosted with Backend
1. Build frontend: `npm run build`
2. Serve static files with backend
3. Configure reverse proxy (nginx/Apache)

### Container Deployment
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

## 📈 Future Enhancements

### Planned Features
- [ ] **GPS Integration** - Use device location
- [ ] **Map Integration** - Visual target plotting
- [ ] **Multi-Target** - Multiple simultaneous missions
- [ ] **Weather Corrections** - Wind/temperature adjustments
- [ ] **Export/Import** - Save/load mission data

### PWA Enhancements
- [ ] **Push Notifications** - Mission alerts
- [ ] **Background Sync** - Offline operation queue
- [ ] **Share API** - Share mission data
- [ ] **File System API** - Save mission logs

---

**Ready for Production PWA Deployment** ✅

The application is now fully configured as a Progressive Web App with offline capabilities, service worker caching, and complete frontend-based calculations. It can be deployed as a static site and will work completely offline after the initial data load.
