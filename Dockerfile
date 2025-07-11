# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the React app and backend (if applicable)
RUN npm run build

# Verify the build output exists
RUN ls -la dist/

# Remove dev dependencies and unnecessary source files for production
RUN npm prune --production && \
    rm -rf src/components src/contexts src/hooks src/types src/App.* src/main.tsx src/index.css && \
    rm -rf src/services/mgrsService.ts src/services/serviceWorkerManager.ts && \
    rm -rf *.md && \
    rm -rf .env.example && \
    rm -rf public && \
    rm -rf node_modules/.cache && \
    npm install tsx --save-prod

# Verify CSV data files are present after cleanup
RUN ls -la data/ || echo "❌ Data directory missing after cleanup"

# Ensure dist directory and server files are accessible
RUN ls -la && ls -la dist/ && ls -la src/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create data directory for SQLite database
RUN mkdir -p /app/data && \
    chown -R nodejs:nodejs /app

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3001

# Set production environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http=require('http');const options={hostname:'localhost',port:3001,path:'/health',method:'GET'};const req=http.request(options,(res)=>{if(res.statusCode===200){process.exit(0)}else{process.exit(1)}});req.on('error',()=>{process.exit(1)});req.end();"

# Start the server
CMD ["npm", "run", "server"]
