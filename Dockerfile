# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Create the production image with Nginx
FROM node:20-alpine
WORKDIR /app

# Install Nginx and gettext for envsubst utility
RUN apk add --no-cache nginx gettext

# Copy built app from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/src ./src

# Copy Nginx configuration template and entrypoint script
COPY nginx.conf /nginx.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose the port Nginx will listen on
EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
