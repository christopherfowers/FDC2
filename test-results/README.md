# Test Results

This directory contains test files and test results for the FDC2 application.

## Test Files

- **test-csv-browser.html** - Browser-based CSV parsing tests
- **test-csv-service.js** - CSV service unit tests
- **test-elevation.js** - Elevation calculation tests
- **test-fd-flow.js** - Fire direction flow tests
- **test-mgrs.js** - MGRS coordinate system tests

## Running Tests

### Unit Tests

From the project root:

```bash
# Run all tests with Vitest
npm test

# Run tests in UI mode
npm run test:ui

# Run tests in watch mode
npm run test:watch
```

### Browser Tests

Open the HTML test files directly in a browser:

```bash
# Using Firefox
firefox test-results/test-csv-browser.html

# Using Chrome
google-chrome test-results/test-csv-browser.html
```

### Individual Test Files

```bash
# Run specific test file
npm test test-elevation

# Run with Node
node test-results/test-csv-service.js
```

## Test Coverage

Test files cover:
- **CSV Parsing** - Data loading and parsing validation
- **MGRS Coordinates** - Coordinate conversion and validation
- **Elevation Calculations** - Terrain elevation and ballistics
- **Fire Direction** - Complete fire mission calculations
- **Service Integration** - Service layer functionality

## Adding New Tests

1. Create test file in `src/__tests__/` for source code tests
2. Or create standalone test file in `test-results/` for integration tests
3. Follow naming convention: `test-*.js` or `*.test.ts`
4. Run `npm test` to verify
