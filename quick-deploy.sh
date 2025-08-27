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

echo -e "${GREEN}=== Outleads Quick Deploy Script ===${NC}"

# Get configuration from user
read -p "Repository URL [$REPO_URL]: " input_repo
REPO_URL="${input_repo:-$REPO_URL}"

read -p "Database password for outleads_user: " DB_PASSWORD
read -p "JWT Secret (32+ characters): " JWT_SECRET
read -p "Domain name (e.g., yourdomain.com): " DOMAIN_NAME

echo -e "\n${GREEN}Starting deployment...${NC}"

# 1. Create application directory
echo -e "${YELLOW}Setting up application directory...${NC}"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# 2. Clone repository
echo -e "${YELLOW}Cloning repository...${NC}"
cd $APP_DIR
git clone $REPO_URL .

# 3. Configure environment
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

# 4. Deploy application
echo -e "${YELLOW}Running deployment...${NC}"
chmod +x deploy.sh
./deploy.sh

# 5. Setup systemd service
echo -e "${YELLOW}Setting up systemd service...${NC}"
sudo cp outleads.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable outleads
sudo systemctl start outleads

echo -e "\n${GREEN}=== Deployment Complete! ===${NC}"
echo -e "${GREEN}Application deployed to: $APP_DIR${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Configure Nginx: ${GREEN}./setup-nginx.sh${NC}"
echo -e "2. Setup SSL: ${GREEN}./setup-ssl.sh${NC}"
echo -e "\n${YELLOW}Useful commands:${NC}"
echo -e "  Check app status: ${GREEN}pm2 status${NC}"
echo -e "  View app logs: ${GREEN}pm2 logs outleads${NC}"
echo -e "  Check service: ${GREEN}sudo systemctl status outleads${NC}"
