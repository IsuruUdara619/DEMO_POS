# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Node.js
FROM node:20-alpine

WORKDIR /app

# Copy package files to install production dependencies
COPY package*.json ./
# Install ONLY production dependencies (express, http-proxy-middleware)
# We use npm install because we want to install dependencies added to package.json even if lockfile is old
# But to be safe, we can just install express and http-proxy-middleware explicitly if needed, 
# but copying package.json is better practice.
RUN npm install --omit=dev

# Copy the build output
COPY --from=builder /app/dist ./dist

# Copy the server script
COPY server.js .

# Expose port (optional, but good for documentation)
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
