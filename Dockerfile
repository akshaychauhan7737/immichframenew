# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Create the production image
FROM node:20-alpine AS slideshow
WORKDIR /app

# Install Nginx and envsubst
RUN apk add --no-cache nginx gettext

# Copy built app from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

# Copy Nginx configuration and entrypoint script
COPY nginx.conf /nginx.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose the port Nginx will run on
EXPOSE 80

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]
