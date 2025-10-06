# Lighthouse Performance Reports

This directory contains Lighthouse performance, accessibility, SEO, and best practices audit reports.

## Report Files

- **lighthouse-*.json** - JSON format reports with detailed metrics
- **localhost_*.html** - HTML format reports viewable in browser

## Viewing Reports

HTML reports can be opened directly in a web browser:

```bash
firefox localhost_2025-07-14_*.html
# or
google-chrome localhost_2025-07-14_*.html
```

## Running New Lighthouse Audits

From the project root:

```bash
# Install Lighthouse globally if not already installed
npm install -g lighthouse

# Run audit (with dev server running on http://localhost:5173)
lighthouse http://localhost:5173 --output json --output html --output-path ./lighthouse-reports/lighthouse-$(date +%Y-%m-%d_%H-%M-%S)

# For production build
npm run build
npm run preview
lighthouse http://localhost:4173 --output json --output html --output-path ./lighthouse-reports/lighthouse-production-$(date +%Y-%m-%d_%H-%M-%S)
```

## Report Types

- **lighthouse-current.json** - Latest audit results
- **lighthouse-desktop.json** - Desktop-specific audit
- **lighthouse-landing.json** - Landing page audit
- **lighthouse-optimized.json** - Post-optimization audit
- **lighthouse-production.json** - Production build audit
- **lighthouse-simplified.json** - Simplified/minimal page audit

## Metrics

Lighthouse scores range from 0-100 in these categories:
- **Performance** - Load speed and runtime performance
- **Accessibility** - Accessibility best practices
- **Best Practices** - General web development best practices
- **SEO** - Search engine optimization
- **PWA** - Progressive Web App capabilities
