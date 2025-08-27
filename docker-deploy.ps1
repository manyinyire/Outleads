# Docker Deployment Script for Outleads (PowerShell)
# Usage: .\docker-deploy.ps1 [dev|prod]

param(
    [string]$Environment = "prod"
)

$ComposeFile = "docker-compose.yml"

if ($Environment -eq "dev") {
    $ComposeFile = "docker-compose.dev.yml"
}

Write-Host "🚀 Deploying Outleads in $Environment mode..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Create necessary directories
Write-Host "📁 Creating necessary directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "uploads" -Force | Out-Null
New-Item -ItemType Directory -Path "docker\ssl" -Force | Out-Null
New-Item -ItemType Directory -Path "logs" -Force | Out-Null

# Copy environment file if it doesn't exist
if (-not (Test-Path ".env.local")) {
    if (Test-Path ".env.docker") {
        Write-Host "📋 Copying .env.docker to .env.local..." -ForegroundColor Yellow
        Copy-Item ".env.docker" ".env.local"
        Write-Host "⚠️  Please update .env.local with your actual values before running again!" -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "❌ No environment file found. Please create .env.local with your configuration." -ForegroundColor Red
        exit 1
    }
}

# Build and start services
Write-Host "🔨 Building and starting services..." -ForegroundColor Yellow
docker-compose -f $ComposeFile down --remove-orphans
docker-compose -f $ComposeFile build --no-cache
docker-compose -f $ComposeFile up -d

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Run database migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Yellow
docker-compose -f $ComposeFile exec app npx prisma migrate deploy

# Seed database if in development
if ($Environment -eq "dev") {
    Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
    docker-compose -f $ComposeFile exec app npm run db:seed
}

# Show status
Write-Host "📊 Service status:" -ForegroundColor Yellow
docker-compose -f $ComposeFile ps

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Application available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "📊 View logs: docker-compose -f $ComposeFile logs -f" -ForegroundColor Cyan
Write-Host "🛑 Stop services: docker-compose -f $ComposeFile down" -ForegroundColor Cyan
