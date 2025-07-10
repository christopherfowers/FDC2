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

# Build the React app
RUN npm run build

# Compile the server TypeScript to JavaScript
RUN npx tsc src/server.ts --outDir dist --module es2022 --target es2022 --moduleResolution node

# Remove dev dependencies and source files not needed in production
RUN npm prune --production && \
    rm -rf src/components src/contexts src/hooks src/services/mgrsService.ts src/services/mortar*.ts src/types src/App.* src/main.tsx src/index.css && \
    rm -rf node_modules/@types && \
    rm -rf *.md && \
    rm -rf .env.example && \
    rm -rf scripts && \
    rm -rf public

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

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
CMD ["node", "dist/server.js"]
