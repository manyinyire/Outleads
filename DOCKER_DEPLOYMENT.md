# Docker Deployment Guide for Outleads

## Overview

This guide covers deploying Outleads using Docker containers for better consistency, scalability, and easier management.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

## Quick Start

### 1. Development Environment

```bash
# Start development services (PostgreSQL + Redis only)
docker-compose -f docker-compose.dev.yml up -d

# Run the app locally with hot reload
npm run dev
```

### 2. Production Environment

```bash
# Copy environment template
cp .env.docker .env.local

# Update .env.local with your actual values
# Then run deployment script
./docker-deploy.ps1 prod  # Windows
# or
./docker-deploy.sh prod   # Linux/Mac
```

## Configuration Files

### Core Files
- `Dockerfile` - Multi-stage build for Next.js app
- `docker-compose.yml` - Production stack
- `docker-compose.dev.yml` - Development services only
- `.dockerignore` - Excludes unnecessary files from build

### Nginx Configuration
- `docker/nginx/nginx.conf` - Main Nginx config
- `docker/nginx/conf.d/outleads.conf` - App-specific routing

### Environment
- `.env.docker` - Template with all required variables
- `.env.local` - Your actual environment (create from template)

## Services Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │   Next.js App   │    │   PostgreSQL    │
│   (Port 80/443) │────│   (Port 3000)   │────│   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │      Redis      │
                       │   (Port 6379)   │
                       └─────────────────┘
```

## Environment Variables

### Required Variables
```bash
# Database
DATABASE_URL="postgresql://outleads_user:password@postgres:5432/outleads?schema=public"
DB_PASSWORD="your_secure_password"

# Redis
REDIS_URL="redis://:password@redis:6379"
REDIS_PASSWORD="your_redis_password"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# Application
NODE_ENV="production"
NEXT_PUBLIC_BASE_URL="https://your-domain.com"
```

## Deployment Commands

### Development
```bash
# Start dev services only
docker-compose -f docker-compose.dev.yml up -d

# Stop dev services
docker-compose -f docker-compose.dev.yml down
```

### Production
```bash
# Full deployment
./docker-deploy.ps1 prod

# Manual steps
docker-compose build --no-cache
docker-compose up -d
docker-compose exec app npx prisma migrate deploy
```

### Monitoring
```bash
# View all services status
docker-compose ps

# View logs
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f nginx

# Execute commands in containers
docker-compose exec app bash
docker-compose exec postgres psql -U outleads_user -d outleads
```

## SSL/HTTPS Setup

### Option 1: Let's Encrypt with Certbot
```bash
# Install certbot in nginx container
docker-compose exec nginx sh
apk add certbot certbot-nginx

# Get certificate
certbot --nginx -d your-domain.com
```

### Option 2: Manual Certificate
```bash
# Place certificates in docker/ssl/
docker/ssl/
├── your-domain.crt
└── your-domain.key

# Update nginx config to use SSL
# Uncomment HTTPS server block in docker/nginx/conf.d/outleads.conf
```

## Scaling

### Horizontal Scaling
```bash
# Scale app instances
docker-compose up -d --scale app=3

# Use Docker Swarm for advanced orchestration
docker swarm init
docker stack deploy -c docker-compose.yml outleads
```

### Resource Limits
Add to docker-compose.yml:
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Backup & Recovery

### Database Backup
```bash
# Create backup
docker-compose exec postgres pg_dump -U outleads_user outleads > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U outleads_user outleads < backup.sql
```

### Volume Backup
```bash
# Backup all volumes
docker run --rm -v outleads_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear build cache
   docker system prune -a
   docker-compose build --no-cache
   ```

2. **Database Connection Issues**
   ```bash
   # Check database status
   docker-compose exec postgres pg_isready -U outleads_user
   
   # View database logs
   docker-compose logs postgres
   ```

3. **App Won't Start**
   ```bash
   # Check app logs
   docker-compose logs app
   
   # Verify environment variables
   docker-compose exec app env | grep DATABASE_URL
   ```

4. **Nginx Issues**
   ```bash
   # Test nginx config
   docker-compose exec nginx nginx -t
   
   # Reload nginx
   docker-compose exec nginx nginx -s reload
   ```

### Performance Optimization

1. **Enable BuildKit**
   ```bash
   export DOCKER_BUILDKIT=1
   export COMPOSE_DOCKER_CLI_BUILD=1
   ```

2. **Multi-stage Build Optimization**
   - Uses Alpine Linux for smaller images
   - Separates build and runtime dependencies
   - Leverages Docker layer caching

3. **Resource Monitoring**
   ```bash
   # Monitor resource usage
   docker stats
   
   # View container processes
   docker-compose top
   ```

## Security Best Practices

- [ ] Use non-root user in containers
- [ ] Scan images for vulnerabilities
- [ ] Keep base images updated
- [ ] Use secrets management for sensitive data
- [ ] Enable Docker Content Trust
- [ ] Configure proper firewall rules
- [ ] Regular security updates

## Migration from VPS

1. **Export existing data**
   ```bash
   pg_dump -h localhost -U outleads_user outleads > migration.sql
   ```

2. **Update DNS** to point to new Docker deployment

3. **Import data**
   ```bash
   docker-compose exec -T postgres psql -U outleads_user outleads < migration.sql
   ```

4. **Verify functionality** and update monitoring

## Monitoring & Logging

### Log Management
```bash
# Configure log rotation
echo '{"log-driver":"json-file","log-opts":{"max-size":"10m","max-file":"3"}}' > /etc/docker/daemon.json
```

### Health Checks
- App: `http://localhost:3000/api/health`
- Nginx: `http://localhost/health`
- Database: Built-in PostgreSQL health check
- Redis: Built-in Redis health check

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify configuration: `docker-compose config`
3. Test connectivity: `docker-compose exec app curl http://localhost:3000/api/health`
