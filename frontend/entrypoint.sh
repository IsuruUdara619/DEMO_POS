#!/bin/sh
set -e

# Debug: Show current environment
echo "--- ENVIRONMENT CHECK ---"
echo "PORT: ${PORT:-not set}"
echo "BACKEND_URL: ${BACKEND_URL:-not set}"
echo "VITE_API_URL: ${VITE_API_URL:-not set}"

# Ensure PORT is set
export PORT=${PORT:-80}

# Determine Backend URL (prioritize BACKEND_URL, fallback to VITE_API_URL, then default)
if [ -z "$BACKEND_URL" ]; then
    if [ -n "$VITE_API_URL" ]; then
        echo "BACKEND_URL is not set, using VITE_API_URL..."
        export BACKEND_URL="$VITE_API_URL"
    else
        echo "Neither BACKEND_URL nor VITE_API_URL is set, defaulting to http://backend:5000"
        export BACKEND_URL="http://backend:5000"
    fi
fi

# Ensure URL has protocol (http:// or https://)
if ! echo "$BACKEND_URL" | grep -q "^http://\|^\https://"; then
    echo "Warning: BACKEND_URL ($BACKEND_URL) missing protocol. Assuming https://..."
    export BACKEND_URL="https://$BACKEND_URL"
fi

# Strip trailing slash from BACKEND_URL if present (to avoid double slashes)
export BACKEND_URL=$(echo "$BACKEND_URL" | sed 's:/*$::')

echo "Final BACKEND_URL to use: $BACKEND_URL"

# Substitute variables in Nginx config
echo "Substituting variables in nginx.conf..."
envsubst '${PORT} ${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Debug: Show the final config to verify substitution
echo "--- FINAL NGINX CONFIG ---"
cat /etc/nginx/conf.d/default.conf | head -n 35

# Start Nginx
echo "Starting Nginx..."
exec nginx -g 'daemon off;'
