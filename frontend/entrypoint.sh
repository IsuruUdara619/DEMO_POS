#!/bin/sh
set -e

# Debug: Show current environment
echo "--- ENVIRONMENT CHECK ---"
echo "PORT: ${PORT:-not set, defaulting to 80}"
echo "BACKEND_URL: ${BACKEND_URL:-not set}"

# Ensure PORT is set for envsubst
export PORT=${PORT:-80}
export BACKEND_URL=${BACKEND_URL:-http://backend:5000}

# Substitute variables in Nginx config
echo "Substituting variables in nginx.conf..."
envsubst '${PORT} ${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Debug: Show the final config to verify substitution
echo "--- FINAL NGINX CONFIG ---"
cat /etc/nginx/conf.d/default.conf | head -n 10

# Start Nginx
echo "Starting Nginx..."
exec nginx -g 'daemon off;'
