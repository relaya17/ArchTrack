# 🚀 Deployment Guide

# Construction Master App - Production Deployment

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Monitoring Setup](#monitoring-setup)
- [Backup & Recovery](#backup--recovery)
- [Health Checks](#health-checks)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### System Requirements

- **Docker**: 20.10+ with Docker Compose
- **Node.js**: 18+ (for development)
- **pnpm**: 8+ (for package management)
- **Git**: Latest version
- **SSL Certificates**: For production deployment

### Cloud Requirements (Production)

- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 100GB+ SSD
- **Network**: 1Gbps+ bandwidth
- **Load Balancer**: For high availability

## 🌍 Environment Setup

### 1. Environment Files

Copy and configure environment files for each environment:

```bash
# Development
cp env.example env.development
# Edit env.development with your development settings

# Staging
cp env.example env.staging
# Edit env.staging with your staging settings

# Production
cp env.example env.production
# Edit env.production with your production settings
```

### 2. Required Environment Variables

#### Production Secrets (Must be set):

```bash
# Database
MONGODB_URI=mongodb://admin:secure-password@mongodb:27017/probuilder?authSource=admin

# JWT Secrets (Generate secure random strings)
JWT_SECRET=your-super-secure-jwt-secret
JWT_REFRESH_SECRET=your-super-secure-refresh-secret
SESSION_SECRET=your-super-secure-session-secret

# Email (SendGrid recommended)
SMTP_HOST=smtp.sendgrid.net
SMTP_PASS=your-sendgrid-api-key

# AWS (For file storage)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-s3-bucket

# Monitoring
SENTRY_DSN=your-sentry-dsn
GOOGLE_ANALYTICS_ID=your-ga-id

# AI Services
OPENAI_API_KEY=your-openai-api-key
```

## 🐳 Docker Deployment

### Development

```bash
# Start development environment
pnpm deploy:dev

# Check health
pnpm health:dev

# View logs
pnpm docker:logs
```

### Staging

```bash
# Deploy to staging
pnpm deploy:staging

# Check health
pnpm health:staging

# Access staging
open http://localhost:8080
```

### Production

```bash
# Deploy to production
pnpm deploy:prod

# Check health
pnpm health:prod

# Access production
open https://probuilder.app
```

## ☸️ Kubernetes Deployment

### 1. Prerequisites

- Kubernetes cluster (1.20+)
- kubectl configured
- Docker images pushed to registry

### 2. Deploy to Kubernetes

```bash
# Apply all manifests
pnpm k8s:apply

# Check deployment status
pnpm k8s:status

# View logs
kubectl logs -f deployment/probuilder-server -n probuilder
```

### 3. Scale Services

```bash
# Scale server replicas
kubectl scale deployment probuilder-server --replicas=5 -n probuilder

# Scale client replicas
kubectl scale deployment probuilder-client --replicas=3 -n probuilder
```

## 📊 Monitoring Setup

### 1. Start Monitoring Stack

```bash
# Start Prometheus + Grafana
pnpm monitoring:up

# Access Grafana
open http://localhost:3000
# Default credentials: admin/admin
```

### 2. Configure Alerts

- Prometheus alerts are pre-configured
- Grafana dashboards are auto-imported
- Sentry error tracking is enabled

### 3. Monitor Metrics

```bash
# View Prometheus metrics
open http://localhost:9090

# View application metrics
curl http://localhost:3016/api/health/metrics
```

## 💾 Backup & Recovery

### 1. Automated Backups

```bash
# Create backup
pnpm backup:prod

# Backup includes:
# - MongoDB database
# - Redis data
# - Application uploads
# - Configuration files
# - Logs
```

### 2. Restore from Backup

```bash
# Extract backup
tar -xzf backups/probuilder_backup_production_YYYYMMDD_HHMMSS_complete.tar.gz

# Restore MongoDB
docker-compose -f docker-compose.prod.yml exec -T mongodb mongorestore /tmp/backup

# Restore Redis
docker cp backups/probuilder_backup_production_YYYYMMDD_HHMMSS_redis.rdb $(docker-compose -f docker-compose.prod.yml ps -q redis):/data/dump.rdb
```

### 3. Backup Schedule

- **Development**: Manual only
- **Staging**: Daily at 2 AM
- **Production**: Daily at 2 AM + S3 upload

## 🏥 Health Checks

### 1. Application Health

```bash
# Basic health check
curl http://localhost:3016/api/health

# Detailed health check
curl http://localhost:3016/api/health/detailed

# Readiness check
curl http://localhost:3016/api/health/ready

# Liveness check
curl http://localhost:3016/api/health/live
```

### 2. Service Health

```bash
# Check all services
pnpm health:prod

# Check specific service
docker-compose -f docker-compose.prod.yml exec server curl localhost:3016/api/health
```

### 3. Database Health

```bash
# MongoDB health
docker-compose -f docker-compose.prod.yml exec mongodb mongosh --eval "db.adminCommand('ping')"

# Redis health
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Service Won't Start

```bash
# Check logs
pnpm docker:logs

# Check resource usage
docker stats

# Restart services
pnpm docker:down && pnpm docker:up
```

#### 2. Database Connection Issues

```bash
# Check MongoDB logs
docker-compose -f docker-compose.prod.yml logs mongodb

# Check network connectivity
docker-compose -f docker-compose.prod.yml exec server ping mongodb

# Verify credentials
docker-compose -f docker-compose.prod.yml exec mongodb mongosh --eval "db.adminCommand('listUsers')"
```

#### 3. High Memory Usage

```bash
# Check memory usage
docker stats --no-stream

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Scale down if needed
docker-compose -f docker-compose.prod.yml scale server=1
```

#### 4. SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in ssl/cert.pem -text -noout

# Renew certificate (Let's Encrypt)
certbot renew

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### Performance Optimization

#### 1. Database Optimization

```bash
# Enable MongoDB profiling
docker-compose -f docker-compose.prod.yml exec mongodb mongosh --eval "db.setProfilingLevel(2)"

# Check slow queries
docker-compose -f docker-compose.prod.yml exec mongodb mongosh --eval "db.system.profile.find().sort({ts:-1}).limit(5)"
```

#### 2. Cache Optimization

```bash
# Check Redis memory usage
docker-compose -f docker-compose.prod.yml exec redis redis-cli info memory

# Clear cache if needed
docker-compose -f docker-compose.prod.yml exec redis redis-cli flushall
```

#### 3. Load Balancing

```bash
# Scale server instances
docker-compose -f docker-compose.prod.yml scale server=3

# Check load distribution
curl -H "Host: probuilder.app" http://localhost/api/health
```

## 📞 Support

### Emergency Contacts

- **System Admin**: admin@probuilder.app
- **DevOps Team**: devops@probuilder.app
- **On-Call**: +1-555-PROBUILDER

### Useful Commands

```bash
# Quick status check
pnpm health:prod && pnpm k8s:status

# Emergency restart
pnpm docker:down && pnpm deploy:prod

# View all logs
pnpm docker:logs | tail -100

# Check disk space
df -h && docker system df
```

---

## 🎯 Quick Start Checklist

- [ ] Configure environment files
- [ ] Set up SSL certificates
- [ ] Deploy to staging first
- [ ] Run health checks
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Test failover procedures
- [ ] Deploy to production
- [ ] Monitor initial deployment
- [ ] Document any issues

**Happy Deploying! 🚀**

