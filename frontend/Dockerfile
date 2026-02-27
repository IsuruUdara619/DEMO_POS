# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Use Railway's PORT
ENV PORT 80
# Copy directly as template
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Use custom main configuration (forces worker_processes 1)
COPY nginx-main.conf /etc/nginx/nginx.conf

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
# Fix line endings (CRLF to LF) for Windows compatibility
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

# Use entrypoint script
ENTRYPOINT ["/entrypoint.sh"]