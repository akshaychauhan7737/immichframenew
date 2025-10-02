#!/bin/sh

# Start the Next.js server in the background
echo "Starting Next.js server..."
npm run start &

# Start Nginx in the foreground
echo "Starting Nginx..."
nginx -g 'daemon off;'
