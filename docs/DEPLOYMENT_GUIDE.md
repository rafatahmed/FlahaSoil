# FlahaSoil Deployment Guide

## 🚀 **Deployment Overview**

FlahaSoil uses a **backend-API-driven architecture** with separate frontend and backend deployments.

### **Architecture Components**
- **Frontend**: Static HTML/CSS/JavaScript (Port 3000)
- **Backend**: Node.js/Express API (Port 3001)
- **Database**: SQLite with Prisma ORM
- **Reports**: Puppeteer PDF generation

## 🔧 **Development Environment**

### **Prerequisites**
```bash
# Required software
Node.js >= 14.0.0
npm >= 6.0.0
Git
SQLite3

# Optional tools
Docker
PM2 (for production)
Nginx (for reverse proxy)
```

### **Local Development Setup**
```bash
# 1. Clone repository
git clone https://github.com/rafatahmed/FlahaSoil.git
cd FlahaSoil

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd api-implementation
npm install

# 4. Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# 5. Setup database
npx prisma generate
npx prisma db push

# 6. Seed database (optional)
npm run db:seed

# 7. Start development servers
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
npm run backend
```

### **Environment Variables**
```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"

# Email Configuration (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Report Generation
PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium-browser"
REPORT_STORAGE_PATH="./reports"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🏭 **Production Deployment**

### **Server Requirements**
```
Minimum:
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB SSD
- Network: 100Mbps

Recommended:
- CPU: 4 cores
- RAM: 8GB
- Storage: 50GB SSD
- Network: 1Gbps
```

### **Production Environment Setup**

#### **1. Server Preparation**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y

# Install Chromium for Puppeteer
sudo apt install chromium-browser -y
```

#### **2. Application Deployment**
```bash
# Clone repository
git clone https://github.com/rafatahmed/FlahaSoil.git
cd FlahaSoil

# Install dependencies
npm install --production
cd api-implementation
npm install --production

# Setup production environment
cp .env.example .env.production
# Edit .env.production with production values

# Setup database
npx prisma generate
npx prisma migrate deploy

# Build frontend (if needed)
npm run build
```

#### **3. PM2 Configuration**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'flahasoil-backend',
      script: 'api-implementation/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log'
    },
    {
      name: 'flahasoil-frontend',
      script: 'serve',
      args: '-s public -l 3000',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log'
    }
  ]
};
```

#### **4. Nginx Configuration**
```nginx
# /etc/nginx/sites-available/flahasoil
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for report generation
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static assets
    location /assets/ {
        root /path/to/FlahaSoil/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### **5. SSL Configuration**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### **Deployment Commands**
```bash
# Start services
pm2 start ecosystem.config.js

# Enable Nginx
sudo ln -s /etc/nginx/sites-available/flahasoil /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup PM2 startup
pm2 startup
pm2 save

# Monitor services
pm2 status
pm2 logs
pm2 monit
```

## 🐳 **Docker Deployment**

### **Dockerfile (Backend)**
```dockerfile
# api-implementation/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Install Chromium for Puppeteer
RUN apk add --no-cache chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "start"]
```

### **Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./api-implementation
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./prod.db
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped

  frontend:
    image: nginx:alpine
    ports:
      - "3000:80"
    volumes:
      - ./public:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
```

## 📊 **Monitoring & Maintenance**

### **Health Checks**
```bash
# API health check
curl http://localhost:3001/health

# Frontend availability
curl http://localhost:3000

# Database connectivity
cd api-implementation && npx prisma db pull
```

### **Log Management**
```bash
# PM2 logs
pm2 logs --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Application logs
tail -f logs/backend-combined.log
```

### **Database Backup**
```bash
# Create backup
cp api-implementation/prod.db backups/prod-$(date +%Y%m%d).db

# Automated backup script
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
cp api-implementation/prod.db backups/prod-$DATE.db
find backups/ -name "prod-*.db" -mtime +7 -delete
```

### **Performance Monitoring**
```bash
# System resources
htop
df -h
free -h

# Application metrics
pm2 monit

# Database size
ls -lh api-implementation/prod.db
```

## 🔄 **Updates & Rollbacks**

### **Update Procedure**
```bash
# 1. Backup current version
cp -r FlahaSoil FlahaSoil-backup-$(date +%Y%m%d)

# 2. Pull latest changes
cd FlahaSoil
git pull origin main

# 3. Update dependencies
npm install
cd api-implementation && npm install

# 4. Run database migrations
npx prisma migrate deploy

# 5. Restart services
pm2 restart all

# 6. Verify deployment
curl http://localhost:3001/health
```

### **Rollback Procedure**
```bash
# 1. Stop services
pm2 stop all

# 2. Restore backup
rm -rf FlahaSoil
mv FlahaSoil-backup-YYYYMMDD FlahaSoil

# 3. Restore database
cp backups/prod-YYYYMMDD.db api-implementation/prod.db

# 4. Restart services
cd FlahaSoil
pm2 start ecosystem.config.js
```

## 🔒 **Security Considerations**

### **Server Security**
- Keep system updated
- Configure firewall (UFW)
- Use SSH keys only
- Regular security audits
- Monitor access logs

### **Application Security**
- Strong JWT secrets
- HTTPS only in production
- Input validation
- Rate limiting
- Regular dependency updates

### **Database Security**
- Regular backups
- Access restrictions
- Data encryption at rest
- Audit logging

---

**Last Updated:** December 2024  
**Version:** 2.0  
**Maintainer:** Flaha Agri Tech - Precision Agriculture Division
