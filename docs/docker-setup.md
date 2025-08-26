# 🐳 Docker Setup Guide

## Should You Use Docker?

### **Quick Decision Matrix:**

| Your Situation | Recommendation | Why |
|----------------|----------------|-----|
| **Complete beginner** | Start without Docker | Simpler initial setup |
| **Want easy database management** | Use Docker | Much easier MongoDB/Redis |
| **Planning to deploy to production** | Use Docker | Matches production environment |
| **Want to experiment safely** | Use Docker | Easy to reset and clean up |
| **Have limited system resources** | Skip Docker initially | Docker uses more RAM |

## 🚀 Quick Start Options

### **Option 1: No Docker (Simplest)**
```bash
# Use cloud services
MONGODB_URI=mongodb+srv://your-atlas-cluster
N8N_WEBHOOK_URL=https://your-n8n-cloud-instance

# Run your app directly
npm run dev
```

### **Option 2: Docker for Services Only (Recommended)**
```bash
# Install Docker Desktop
# Start services with Docker
docker run -d --name mongodb-local -p 27017:27017 mongo:6
docker run -d --name redis-local -p 6379:6379 redis:alpine
docker run -d --name n8n-local -p 5678:5678 n8nio/n8n

# Run your app directly
npm run dev
```

### **Option 3: Everything in Docker (Advanced)**
```bash
# Use docker-compose for everything
docker-compose up -d
```

## 📦 Installing Docker

### **Windows**
1. **Download Docker Desktop**:
   - Go to [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
   - Download Windows version
   - Run installer (requires admin rights)

2. **System Requirements**:
   - Windows 10/11 Pro, Enterprise, or Education
   - WSL 2 enabled (installer will help)
   - Virtualization enabled in BIOS

3. **Verify Installation**:
   ```powershell
   docker --version
   docker run hello-world
   ```

### **macOS**
```bash
# Option 1: Homebrew (recommended)
brew install --cask docker

# Option 2: Direct download
# Download from docker.com and drag to Applications

# Verify installation
docker --version
docker run hello-world
```

### **Linux (Ubuntu/Debian)**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (avoid sudo)
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

## 🛠️ Docker Setup for AI Calling System

### **Method 1: Individual Containers**

Start each service separately:

```bash
# MongoDB
docker run -d \
  --name mongodb-local \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:6

# Redis
docker run -d \
  --name redis-local \
  -p 6379:6379 \
  -v redis_data:/data \
  redis:alpine

# n8n
docker run -d \
  --name n8n-local \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n

# Check all containers are running
docker ps
```

### **Method 2: Docker Compose (Recommended)**

Create `docker-compose.yml` in your project root:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    container_name: ai-calling-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password123
    restart: unless-stopped

  redis:
    image: redis:alpine
    container_name: ai-calling-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  n8n:
    image: n8nio/n8n
    container_name: ai-calling-n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=password123
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://localhost:5678/
    volumes:
      - n8n_data:/home/node/.n8n
    restart: unless-stopped
    depends_on:
      - mongodb
      - redis

volumes:
  mongodb_data:
  redis_data:
  n8n_data:
```

Start everything:
```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### **Method 3: Full Application in Docker**

Create `Dockerfile` in `webhooks/` directory:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Create necessary directories
RUN mkdir -p logs audio uploads && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]
```

Extended `docker-compose.yml`:
```yaml
version: '3.8'

services:
  app:
    build: ./webhooks
    container_name: ai-calling-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongodb:27017/ai-calling-system
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - N8N_WEBHOOK_URL=http://n8n:5678/webhook
    volumes:
      - ./webhooks/logs:/app/logs
      - ./config:/app/config
    depends_on:
      - mongodb
      - redis
      - n8n
    restart: unless-stopped

  mongodb:
    # ... (same as above)

  redis:
    # ... (same as above)

  n8n:
    # ... (same as above)
```

## 🔧 Environment Configuration

### **Update your `.env` file for Docker:**

```bash
# Database Configuration (Docker)
MONGODB_URI=mongodb://localhost:27017/ai-calling-system-dev
REDIS_HOST=localhost
REDIS_PORT=6379

# n8n Configuration (Docker)
N8N_WEBHOOK_URL=http://localhost:5678/webhook
N8N_BASE_URL=http://localhost:5678

# If using docker-compose with internal networking:
# MONGODB_URI=mongodb://mongodb:27017/ai-calling-system-dev
# REDIS_HOST=redis
# N8N_WEBHOOK_URL=http://n8n:5678/webhook
```

## 🎯 Recommended Workflow

### **For Beginners:**
1. **Start without Docker** - Use cloud services
2. **Learn the system** - Get comfortable with the AI calling features
3. **Add Docker later** - When you want local development

### **For Developers:**
1. **Install Docker Desktop**
2. **Use docker-compose** - For databases and n8n
3. **Run app directly** - For easier debugging

### **For Production-like Setup:**
1. **Full Docker setup** - Everything in containers
2. **Use docker-compose** - For orchestration
3. **Volume mapping** - For persistent data

## 🚨 Troubleshooting

### **Docker Desktop Issues**

**Windows - WSL 2 Error:**
```powershell
# Enable WSL 2
wsl --install
wsl --set-default-version 2

# Update WSL
wsl --update
```

**macOS - Permission Issues:**
```bash
# Fix Docker permissions
sudo chown -R $(whoami) ~/.docker
```

**Linux - Permission Denied:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### **Container Issues**

**Port Already in Use:**
```bash
# Find what's using the port
docker ps
lsof -i :27017

# Stop conflicting container
docker stop mongodb-local
```

**Container Won't Start:**
```bash
# Check logs
docker logs mongodb-local

# Remove and recreate
docker rm mongodb-local
docker run -d --name mongodb-local -p 27017:27017 mongo:6
```

**Data Persistence Issues:**
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect mongodb_data

# Backup volume
docker run --rm -v mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb-backup.tar.gz /data
```

## 🎮 Useful Docker Commands

### **Container Management:**
```bash
# List running containers
docker ps

# List all containers
docker ps -a

# Start/stop containers
docker start mongodb-local
docker stop mongodb-local

# Remove containers
docker rm mongodb-local

# View logs
docker logs -f mongodb-local
```

### **Volume Management:**
```bash
# List volumes
docker volume ls

# Remove unused volumes
docker volume prune

# Backup data
docker run --rm -v mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz /data
```

### **System Cleanup:**
```bash
# Remove unused containers, networks, images
docker system prune

# Remove everything (careful!)
docker system prune -a --volumes
```

## 🎉 Success Indicators

When Docker setup is working correctly:

```bash
# All containers running
docker ps
# Should show: mongodb-local, redis-local, n8n-local

# Services accessible
curl http://localhost:27017  # MongoDB
curl http://localhost:6379  # Redis  
curl http://localhost:5678  # n8n

# Your app connects successfully
npm run test-local
# Should show all services as "configured"
```

## 💡 Pro Tips

1. **Use Docker Desktop GUI** - Easier container management
2. **Set up aliases** - `alias dps='docker ps'`
3. **Use volumes** - For data persistence
4. **Monitor resources** - Docker can use lots of RAM
5. **Learn docker-compose** - Much easier than individual containers

## 🎯 My Recommendation for You

**Start with Option 2: Docker for Services Only**

1. Install Docker Desktop
2. Run databases in Docker
3. Run your app directly
4. Upgrade to full Docker later if needed

This gives you the best of both worlds - easy service management with simple app development!
