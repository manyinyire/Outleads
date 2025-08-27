#!/bin/bash
set -e

echo "Starting deployment..."

# 1. Pull latest changes from the git repository
echo "Pulling latest changes..."
git pull

# 2. Install dependencies using pnpm
echo "Installing dependencies..."
pnpm install

# 3. Run database migrations (production mode)
echo "Running database migrations..."
pnpm prisma migrate deploy

# 4. Build the application
echo "Building the application..."
pnpm run build

# 5. Start or restart the application using pm2
echo "Starting or restarting the application with pm2..."
pm2 startOrRestart ecosystem.config.js --env production

echo "Deployment finished."

# To check the status of your application, use:
# pm2 status

# To view logs, use:
# pm2 logs outleads
