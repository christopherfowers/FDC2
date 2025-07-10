# CI/CD FontAwesome Configuration

This commit updates the CI/CD pipeline to use FontAwesome Pro authentication.

## Changes
- Added FontAwesome Pro token configuration for GitHub Actions
- Docker build now supports FontAwesome Pro packages
- CI pipeline will use the FONTAWESOME_NPM_AUTH_TOKEN secret

Make sure to add the GitHub secret `FONTAWESOME_NPM_AUTH_TOKEN` with your FontAwesome Pro package token.
