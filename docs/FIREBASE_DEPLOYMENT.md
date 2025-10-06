# Firebase Hosting Deployment

## Overview

This project is configured for automatic deployment to Firebase Hosting using GitHub Actions.

## Configuration

### Firebase Project

- **Project ID:** `reforgerfdc`
- **Hosting URL:** `https://reforgerfdc.web.app` or `https://reforgerfdc.firebaseapp.com`

### Build Configuration

- **Framework:** Vite + React + TypeScript
- **Build Command:** `npm run build`
- **Output Directory:** `dist/`
- **Public Directory:** `dist/` (configured in firebase.json)

### SPA Configuration

The `firebase.json` includes rewrite rules for Single Page Application routing:
```json
{
  "rewrites": [
    {
      "source": "**",
      "destination": "/index.html"
    }
  ]
}
```

This ensures all routes (e.g., `/calculator`, `/results`) properly load the React app.

## GitHub Actions Workflows

### 1. Production Deployment (Merge to Master)

**File:** `.github/workflows/firebase-hosting-merge.yml`

**Trigger:** Push to `master` branch

**Process:**
1. Checkout code
2. Install dependencies (`npm ci`)
3. Build project (`npm run build`)
4. Deploy to Firebase Hosting live channel
5. Site becomes immediately available at production URL

**Required Secret:**
- `FIREBASE_SERVICE_ACCOUNT_REFORGERFDC`

### 2. Preview Deployment (Pull Requests)

**File:** `.github/workflows/firebase-hosting-pull-request.yml`

**Trigger:** Pull request opened/updated

**Process:**
1. Checkout code
2. Install dependencies and build
3. Deploy to temporary Firebase preview channel
4. Adds comment to PR with preview URL
5. Preview expires after configured time

**Security:** Only runs for PRs from the same repository

## Manual Deployment

### Prerequisites

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login
```

### Deploy Commands

```bash
# Build the project
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy with specific project
firebase deploy --only hosting --project reforgerfdc

# Preview before deploying
firebase hosting:channel:deploy preview
```

## Local Testing with Firebase

```bash
# Build the project
npm run build

# Serve locally using Firebase emulator
firebase serve

# Or use Firebase emulator suite
firebase emulators:start --only hosting
```

The site will be available at `http://localhost:5000`

## GitHub Actions Setup

The Firebase CLI automatically created these workflows during `firebase init`. To ensure they work:

1. **Verify GitHub Secret:**
   - Go to GitHub repository → Settings → Secrets and variables → Actions
   - Confirm `FIREBASE_SERVICE_ACCOUNT_REFORGERFDC` exists
   - This was automatically created by Firebase CLI

2. **Workflow Permissions:**
   - The workflows use `GITHUB_TOKEN` for PR comments
   - No additional permissions needed

3. **First Deployment:**
   - Push to master branch or create a PR
   - Check Actions tab in GitHub to see deployment progress
   - Production: `https://reforgerfdc.web.app`
   - Preview: URL posted in PR comments

## Deployment Best Practices

### Pre-Deployment Checklist

- [ ] Run `npm run build` locally to verify build succeeds
- [ ] Test build locally with `firebase serve`
- [ ] Check for TypeScript/ESLint errors
- [ ] Verify all routes work with SPA rewrites
- [ ] Test on mobile viewport

### Branch Strategy

1. **Development:**
   - Create feature branch from `master`
   - Open PR → triggers preview deployment
   - Review preview URL
   - Merge to master after approval

2. **Production:**
   - Merge to `master` → automatic production deployment
   - Monitor GitHub Actions for deployment status
   - Verify production site after deployment

### Rollback

If you need to rollback a deployment:

```bash
# List previous deployments
firebase hosting:releases:list

# Rollback to previous version
firebase hosting:rollback
```

## Custom Domain (Optional)

To add a custom domain:

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow DNS configuration steps
4. Firebase automatically provisions SSL certificate

## Monitoring

### Firebase Console

- **URL:** https://console.firebase.google.com/project/reforgerfdc/hosting
- View deployment history
- Monitor traffic and bandwidth
- Check errors and performance

### GitHub Actions

- **URL:** https://github.com/christopherfowers/FDC2/actions
- Monitor deployment status
- View build logs
- Check for failures

## Troubleshooting

### Build Fails in GitHub Actions

1. Check Actions tab for error logs
2. Verify `package-lock.json` is committed
3. Ensure all dependencies are in `package.json`
4. Test `npm ci && npm run build` locally

### 404 Errors on Routes

- Verify rewrite rules in `firebase.json`
- Check that routes exist in React Router
- Test locally with `firebase serve`

### Slow Builds

- GitHub Actions caches `node_modules`
- Consider optimizing build process
- Check for large dependencies

### Preview Deployments Not Working

- Verify PR is from same repository (security check)
- Check workflow permissions in `.github/workflows/firebase-hosting-pull-request.yml`
- Ensure `FIREBASE_SERVICE_ACCOUNT_REFORGERFDC` secret exists

## Cost Considerations

Firebase Hosting Free Tier includes:
- 10 GB storage
- 360 MB/day bandwidth
- Custom domain SSL

Your static React app should easily stay within free tier limits.

## Files

- `.firebaserc` - Project configuration
- `firebase.json` - Hosting configuration
- `.github/workflows/firebase-hosting-merge.yml` - Production deployment
- `.github/workflows/firebase-hosting-pull-request.yml` - Preview deployment
- `.gitignore` - Includes Firebase cache exclusions

## Additional Resources

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [GitHub Actions for Firebase](https://github.com/FirebaseExtended/action-hosting-deploy)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
