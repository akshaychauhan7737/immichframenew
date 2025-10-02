# Stage 1: Build the Next.js application
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Create the production image with Nginx
FROM nginx:1.25-alpine
WORKDIR /app

# Copy built assets from the builder stage
COPY --from=builder /app/out ./out

# Copy Nginx configuration files
COPY nginx.conf /etc/nginx/nginx.conf
COPY templates/default.conf.template /etc/nginx/templates/default.conf.template

# Copy and set permissions for the entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port 80 for Nginx
EXPOSE 80

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]
