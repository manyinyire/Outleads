#!/bin/bash

# VPS Deployment Script for Outleads
# Exit immediately if a command exits with a non-zero status.
set -e

# Print commands and their arguments as they are executed.
set -x

echo "🚀 Starting Outleads VPS deployment..."

# 1. Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found. Please create it from .env.example"
    exit 1
fi

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# 3. Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# 4. Apply database migrations
echo "🗄️ Applying database migrations..."
npx prisma migrate deploy

# 5. Build the application
echo "🏗️ Building the application..."
npm run build

# 6. Install pm2 if it's not already installed
if ! command -v pm2 &> /dev/null
then
    echo "📋 pm2 not found, installing globally..."
    npm install pm2 -g
fi

# 7. Stop existing pm2 process if running
echo "🛑 Stopping existing Outleads process..."
pm2 stop outleads || true
pm2 delete outleads || true

# 8. Start the application with pm2
echo "▶️ Starting Outleads with pm2..."
pm2 start npm --name "outleads" -- start

# 9. Save pm2 configuration
echo "💾 Saving pm2 configuration..."
pm2 save

# 10. Setup pm2 startup (run once)
echo "🔄 Setting up pm2 startup script..."
pm2 startup || echo "⚠️ pm2 startup may need manual configuration"

echo "✅ Deployment completed successfully!"
echo "📊 Check status: pm2 status"
echo "📋 View logs: pm2 logs outleads"
