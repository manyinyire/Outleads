#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/manyinyire/Outleads.git"
APP_DIR="/var/www/outleads"
SERVICE_NAME="outleads"

echo -e "${GREEN}=== Outleads Server Setup Script ===${NC}"

# Function to prompt for input
prompt_input() {
    local prompt="$1"
    local var_name="$2"
    local default="$3"
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " input
        eval "$var_name=\"\${input:-$default}\""
    else
        read -p "$prompt: " input
        eval "$var_name=\"$input\""
    fi
}

# Get configuration from user
echo -e "${YELLOW}Please provide the following configuration:${NC}"
prompt_input "Domain name (e.g., yourdomain.com)" DOMAIN_NAME
prompt_input "Database password for outleads_user" DB_PASSWORD
prompt_input "JWT Secret (32+ characters)" JWT_SECRET
prompt_input "Repository URL" REPO_URL "$REPO_URL"

echo -e "\n${GREEN}Starting server setup...${NC}"

# 1. Update system
echo -e "${YELLOW}Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 22
echo -e "${YELLOW}Installing Node.js 22...${NC}"
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PostgreSQL
echo -e "${YELLOW}Installing PostgreSQL...${NC}"
sudo apt install postgresql postgresql-contrib -y

# 4. Install Nginx
echo -e "${YELLOW}Installing Nginx...${NC}"
sudo apt install nginx -y

# 5. Install global packages
echo -e "${YELLOW}Installing global packages...${NC}"
sudo npm install -g pm2 pnpm

# 6. Setup PostgreSQL database
echo -e "${YELLOW}Setting up PostgreSQL database...${NC}"
sudo -u postgres psql << EOF
CREATE DATABASE outleads;
CREATE USER outleads_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE outleads TO outleads_user;
GRANT ALL ON SCHEMA public TO outleads_user;
GRANT CREATE ON SCHEMA public TO outleads_user;
GRANT USAGE ON SCHEMA public TO outleads_user;
ALTER USER outleads_user CREATEDB;
ALTER USER outleads_user WITH SUPERUSER;
\q
EOF

# 7. Create application directory
echo -e "${YELLOW}Setting up application directory...${NC}"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# 8. Clone repository
echo -e "${YELLOW}Cloning repository...${NC}"
cd $APP_DIR
git clone $REPO_URL .

# 9. Configure environment
echo -e "${YELLOW}Configuring environment variables...${NC}"
cp .env.example .env

# Update .env file
cat > .env << EOF
DATABASE_URL="postgresql://outleads_user:$DB_PASSWORD@localhost:5432/outleads"
JWT_SECRET="$JWT_SECRET"
NEXT_PUBLIC_BASE_URL="https://$DOMAIN_NAME"
NODE_ENV="production"
PORT="3000"
EOF

# 10. Make deploy script executable and run initial deployment
echo -e "${YELLOW}Running initial deployment...${NC}"
chmod +x deploy.sh
./deploy.sh

# 11. Setup systemd service
echo -e "${YELLOW}Setting up systemd service...${NC}"
sudo cp outleads.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable outleads
sudo systemctl start outleads

# 12. Create Nginx configuration
echo -e "${YELLOW}Setting up Nginx configuration...${NC}"
sudo tee /etc/nginx/sites-available/outleads > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 13. Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/outleads /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# 14. Setup firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# 15. Install SSL certificate
echo -e "${YELLOW}Installing SSL certificate...${NC}"
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos --email admin@$DOMAIN_NAME

# 16. Remove superuser privileges from database user
echo -e "${YELLOW}Securing database user...${NC}"
sudo -u postgres psql << EOF
ALTER USER outleads_user WITH NOSUPERUSER;
\q
EOF

echo -e "\n${GREEN}=== Setup Complete! ===${NC}"
echo -e "${GREEN}Your Outleads application is now running at: https://$DOMAIN_NAME${NC}"
echo -e "\n${YELLOW}Useful commands:${NC}"
echo -e "  Check app status: ${GREEN}pm2 status${NC}"
echo -e "  View app logs: ${GREEN}pm2 logs outleads${NC}"
echo -e "  Check service: ${GREEN}sudo systemctl status outleads${NC}"
echo -e "  Update app: ${GREEN}cd $APP_DIR && ./deploy.sh${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Test your application at https://$DOMAIN_NAME"
echo -e "2. Set up regular backups"
echo -e "3. Configure monitoring"
