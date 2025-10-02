#!/bin/sh

# Substitute environment variables in the Nginx config template
envsubst '${NEXT_PUBLIC_IMMICH_API_URL} ${NEXT_PUBLIC_IMMICH_API_KEY}' < /nginx.conf.template > /etc/nginx/nginx.conf

# Ensure log files exist and have correct permissions
touch /var/log/nginx/access.log /var/log/nginx/error.log
chown nginx:nginx /var/log/nginx/access.log /var/log/nginx/error.log

# Start the Next.js server in the background
echo "Starting Next.js server..."
npm run start &

# Start Nginx in the foreground
echo "Starting Nginx..."
nginx -g 'daemon off;'
