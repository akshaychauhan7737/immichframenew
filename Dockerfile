# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Install Nginx
RUN apk add --no-cache nginx

# Copy built assets from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/node_modules ./node_modules

# Copy Nginx configuration and entrypoint script
COPY nginx.conf /etc/nginx/nginx.conf
COPY entrypoint.sh ./entrypoint.sh

# Make entrypoint script executable
RUN chmod +x ./entrypoint.sh

# Expose the Nginx port
EXPOSE 80

# Run the entrypoint script
CMD ["./entrypoint.sh"]
