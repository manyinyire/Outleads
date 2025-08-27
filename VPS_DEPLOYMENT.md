# VPS Deployment Guide for Outleads

## Prerequisites

### Server Requirements
- Ubuntu 20.04+ or similar Linux distribution
- Node.js 22+ and npm (required by project dependencies)
- PostgreSQL 12+
- Nginx
- SSL certificate (Let's Encrypt recommended)

### Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22 (required for this project)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install PM2 globally
sudo npm install -g pm2
```

## Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE outleads;
CREATE USER outleads_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE outleads TO outleads_user;
\q
```

## Application Deployment

### 1. Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /var/www/outleads
sudo chown $USER:$USER /var/www/outleads

# Clone your repository
cd /var/www/outleads
git clone <your-repo-url> .

# Create .env file from .env.example
cp .env.example .env
nano .env
```

### 2. Configure Environment Variables

Edit `/var/www/outleads/.env`:

```bash
DATABASE_URL="postgresql://outleads_user:your_secure_password@localhost:5432/outleads?schema=public"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
NEXT_PUBLIC_BASE_URL="https://your-domain.com"
NODE_ENV="production"
PORT="3000"
```

### 3. Deploy Application

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### 4. Setup Systemd Service

```bash
# Copy service file
sudo cp outleads.service /etc/systemd/system/

# Edit service file to match your setup
sudo nano /etc/systemd/system/outleads.service

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable outleads
sudo systemctl start outleads

# Check status
sudo systemctl status outleads
```

### 5. Configure Nginx

```bash
# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/outleads

# Update domain name in config
sudo nano /etc/nginx/sites-available/outleads

# Enable site
sudo ln -s /etc/nginx/sites-available/outleads /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### 6. Setup SSL with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## Post-Deployment

### Monitoring Commands

```bash
# Check application status
pm2 status
pm2 logs outleads

# Check system service
sudo systemctl status outleads

# Check nginx
sudo systemctl status nginx
sudo nginx -t

# View application logs
pm2 logs outleads --lines 100
```

### Updates and Redeployment

```bash
cd /var/www/outleads

# Pull latest changes
git pull origin main

# Redeploy
./deploy.sh
```

### Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow SSH, HTTP, and HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Check status
sudo ufw status
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check PostgreSQL is running: `sudo systemctl status postgresql`
   - Verify database credentials in `.env`
   - Test connection: `psql -h localhost -U outleads_user -d outleads`

2. **Application Won't Start**
   - Check PM2 logs: `pm2 logs outleads`
   - Verify Node.js version: `node --version`
   - Check environment variables: `pm2 env 0`

3. **Nginx Issues**
   - Test configuration: `sudo nginx -t`
   - Check error logs: `sudo tail -f /var/log/nginx/error.log`
   - Verify SSL certificates: `sudo certbot certificates`

### Performance Optimization

```bash
# PM2 cluster mode (use all CPU cores)
pm2 start npm --name "outleads" -i max -- start

# Enable PM2 monitoring
pm2 install pm2-server-monit
```

## Security Checklist

- [ ] Database user has minimal required permissions
- [ ] Strong JWT secret (32+ characters)
- [ ] SSL certificate installed and auto-renewal configured
- [ ] Firewall configured (UFW or iptables)
- [ ] Regular security updates scheduled
- [ ] Application logs monitored
- [ ] Database backups configured
- [ ] Environment variables secured (not in git)

## Backup Strategy

```bash
# Database backup
pg_dump -h localhost -U outleads_user outleads > backup_$(date +%Y%m%d_%H%M%S).sql

# Application backup
tar -czf outleads_backup_$(date +%Y%m%d_%H%M%S).tar.gz /var/www/outleads
```
