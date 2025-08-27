# Outleads Deployment Scripts

This repository includes automated deployment scripts to simplify server setup and deployment.

## Quick Start

### Option 1: Complete Automated Setup
Run this single script to set up everything (Node.js, PostgreSQL, Nginx, SSL):

```bash
# Download and run the complete setup script
wget https://raw.githubusercontent.com/manyinyire/Outleads/main/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```

### Option 2: Step-by-Step Setup

1. **Deploy Application Only**:
```bash
chmod +x quick-deploy.sh
./quick-deploy.sh
```

2. **Setup Nginx**:
```bash
chmod +x setup-nginx.sh
./setup-nginx.sh
```

3. **Setup SSL Certificate**:
```bash
chmod +x setup-ssl.sh
./setup-ssl.sh
```

## Script Descriptions

### `setup-server.sh` (Complete Setup)
- Installs Node.js 22, PostgreSQL, Nginx
- Sets up database with proper permissions
- Clones repository and configures environment
- Deploys application with PM2
- Configures Nginx reverse proxy
- Installs SSL certificate
- Sets up firewall

**What it prompts for:**
- Domain name
- Database password
- JWT secret
- Repository URL (optional)

### `quick-deploy.sh` (App Only)
- Clones repository
- Configures environment variables
- Runs deployment script
- Sets up systemd service

### `setup-nginx.sh` (Nginx Configuration)
- Creates optimized Nginx configuration
- Includes security headers, gzip compression
- Sets up rate limiting for API endpoints
- Configures static file caching

### `setup-ssl.sh` (SSL Certificate)
- Installs Certbot
- Obtains Let's Encrypt SSL certificate
- Sets up auto-renewal

## Prerequisites

- Ubuntu 20.04+ server
- Root or sudo access
- Domain name pointing to your server

## Usage Examples

### Complete Fresh Server Setup
```bash
# Run on a fresh Ubuntu server
curl -sSL https://raw.githubusercontent.com/manyinyire/Outleads/main/setup-server.sh | bash
```

### Update Existing Deployment
```bash
cd /var/www/outleads
./deploy.sh
```

## Configuration

The scripts will create a `.env` file with:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Your provided JWT secret
- `NEXT_PUBLIC_BASE_URL`: Your domain URL
- `NODE_ENV`: Set to "production"

## Monitoring Commands

After deployment, use these commands:

```bash
# Check application status
pm2 status
pm2 logs outleads

# Check system service
sudo systemctl status outleads

# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# View logs
pm2 logs outleads --lines 100
tail -f /var/log/nginx/error.log
```

## Troubleshooting

### Database Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql -h localhost -U outleads_user -d outleads
```

### Application Issues
```bash
# Restart application
pm2 restart outleads

# Check environment variables
pm2 env 0
```

### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Security Features

The scripts include:
- Firewall configuration (UFW)
- Nginx security headers
- Rate limiting on API endpoints
- SSL certificate with auto-renewal
- Database user with minimal required permissions

## File Structure After Deployment

```
/var/www/outleads/
├── .env                    # Environment configuration
├── deploy.sh              # Deployment script
├── setup-server.sh        # Complete setup script
├── quick-deploy.sh        # App deployment script
├── setup-nginx.sh         # Nginx configuration script
├── setup-ssl.sh          # SSL setup script
├── outleads.service       # Systemd service file
└── [application files]
```
