#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Print commands and their arguments as they are executed.
set -x

# 1. Install dependencies
echo "Installing dependencies..."
npm install

# 2. Install pm2 if it's not already installed
if ! command -v pm2 &> /dev/null
then
    echo "pm2 could not be found, installing it now..."
    npm install pm2 -g
fi

# 3. Apply database migrations
echo "Applying database migrations..."
npx prisma migrate deploy

# 4. Build the application
echo "Building the application..."
npm run build

# 5. Start the application with pm2
echo "Starting the application with pm2..."
pm2 start npm --name "outleads" -- start
