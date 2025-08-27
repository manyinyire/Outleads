#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== SSL Certificate Setup Script ===${NC}"

# Get configuration
read -p "Domain name (e.g., yourdomain.com): " DOMAIN_NAME
read -p "Email address for SSL certificate: " EMAIL

echo -e "${YELLOW}Installing Certbot...${NC}"
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

echo -e "${YELLOW}Obtaining SSL certificate for $DOMAIN_NAME...${NC}"
sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos --email $EMAIL

echo -e "${YELLOW}Testing SSL certificate auto-renewal...${NC}"
sudo certbot renew --dry-run

echo -e "\n${GREEN}=== SSL Setup Complete! ===${NC}"
echo -e "${GREEN}SSL certificate installed for: $DOMAIN_NAME${NC}"
echo -e "${GREEN}Your site is now accessible at: https://$DOMAIN_NAME${NC}"
echo -e "\n${YELLOW}SSL certificate will auto-renew every 90 days${NC}"
