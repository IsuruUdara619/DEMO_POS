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

# Substitute variables at runtime
CMD ["/bin/sh", "-c", "export BACKEND_URL=${BACKEND_URL:-http://backend:5000} && export PORT=${PORT:-80} && envsubst '${BACKEND_URL} ${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]