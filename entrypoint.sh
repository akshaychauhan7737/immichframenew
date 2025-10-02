#!/bin/sh

# Substitute environment variables in the Nginx config template
envsubst '${NEXT_PUBLIC_IMMICH_API_URL} ${NEXT_PUBLIC_IMMICH_API_KEY} ${NEXT_PUBLIC_LATITUDE} ${NEXT_PUBLIC_LONGITUDE} ${OPENWEATHER_API_KEY}' < /app/nginx.conf > /etc/nginx/conf.d/default.conf

# Ensure log files exist and have correct permissions
touch /var/log/nginx/access.log /var/log/nginx/error.log
chown nginx:nginx /var/log/nginx/access.log /var/log/nginx/error.log

# Start Next.js server in the background
echo "Starting Next.js server..."
npm run start &

# Start Nginx in the foreground
echo "Starting Nginx..."
nginx -g 'daemon off;'
