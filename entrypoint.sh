#!/bin/sh

# Substitute environment variables in the Nginx config template
envsubst '${NEXT_PUBLIC_IMMICH_API_URL} ${NEXT_PUBLIC_IMMICH_API_KEY} ${NEXT_PUBLIC_LATITUDE} ${NEXT_PUBLIC_LONGITUDE} ${OPENWEATHER_API_KEY}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Ensure log files exist and have correct permissions
touch /var/log/nginx/access.log /var/log/nginx/error.log
chown nginx:nginx /var/log/nginx/access.log /var/log/nginx/error.log

# Start Nginx in the foreground
echo "Starting Nginx..."
nginx -g 'daemon off;'
