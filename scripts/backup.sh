#!/bin/bash

# Backup Script
# Construction Master App - Automated Backup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="probuilder_backup_${ENVIRONMENT}_${TIMESTAMP}"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌${NC} $1"
}

# Check if environment is valid
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    error "Invalid environment: $ENVIRONMENT"
    echo "Usage: $0 [development|staging|production]"
    exit 1
fi

log "Starting backup for environment: $ENVIRONMENT"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Load environment variables
ENV_FILE="env.${ENVIRONMENT}"
if [[ -f "$ENV_FILE" ]]; then
    log "Loading environment variables from $ENV_FILE"
    export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
fi

# Backup MongoDB
log "Backing up MongoDB..."
if docker-compose -f "docker-compose.${ENVIRONMENT}.yml" ps -q mongodb | grep -q .; then
    docker-compose -f "docker-compose.${ENVIRONMENT}.yml" exec -T mongodb mongodump \
        --host localhost:27017 \
        --db probuilder \
        --out /tmp/backup
    
    docker-compose -f "docker-compose.${ENVIRONMENT}.yml" exec -T mongodb tar -czf /tmp/mongodb_backup.tar.gz -C /tmp backup
    
    docker cp $(docker-compose -f "docker-compose.${ENVIRONMENT}.yml" ps -q mongodb):/tmp/mongodb_backup.tar.gz "$BACKUP_DIR/${BACKUP_NAME}_mongodb.tar.gz"
    
    success "MongoDB backup completed"
else
    warning "MongoDB container not running, skipping MongoDB backup"
fi

# Backup Redis
log "Backing up Redis..."
if docker-compose -f "docker-compose.${ENVIRONMENT}.yml" ps -q redis | grep -q .; then
    docker-compose -f "docker-compose.${ENVIRONMENT}.yml" exec -T redis redis-cli BGSAVE
    
    # Wait for background save to complete
    sleep 5
    
    docker cp $(docker-compose -f "docker-compose.${ENVIRONMENT}.yml" ps -q redis):/data/dump.rdb "$BACKUP_DIR/${BACKUP_NAME}_redis.rdb"
    
    success "Redis backup completed"
else
    warning "Redis container not running, skipping Redis backup"
fi

# Backup application data
log "Backing up application data..."
if docker-compose -f "docker-compose.${ENVIRONMENT}.yml" ps -q server | grep -q .; then
    docker cp $(docker-compose -f "docker-compose.${ENVIRONMENT}.yml" ps -q server):/app/uploads "$BACKUP_DIR/${BACKUP_NAME}_uploads" 2>/dev/null || true
    docker cp $(docker-compose -f "docker-compose.${ENVIRONMENT}.yml" ps -q server):/app/logs "$BACKUP_DIR/${BACKUP_NAME}_logs" 2>/dev/null || true
    
    success "Application data backup completed"
else
    warning "Server container not running, skipping application data backup"
fi

# Backup configuration files
log "Backing up configuration files..."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}_config.tar.gz" \
    "docker-compose.${ENVIRONMENT}.yml" \
    "nginx.${ENVIRONMENT}.conf" \
    "env.${ENVIRONMENT}" \
    "monitoring/" \
    "scripts/" \
    2>/dev/null || true

success "Configuration backup completed"

# Create backup manifest
log "Creating backup manifest..."
cat > "$BACKUP_DIR/${BACKUP_NAME}_manifest.txt" << EOF
ProBuilder Backup Manifest
=========================
Environment: $ENVIRONMENT
Timestamp: $(date)
Backup Name: $BACKUP_NAME

Files included:
$(ls -la "$BACKUP_DIR/${BACKUP_NAME}"*)

Backup completed successfully.
EOF

success "Backup manifest created"

# Compress all backup files
log "Compressing backup files..."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}_complete.tar.gz" -C "$BACKUP_DIR" "${BACKUP_NAME}"*

# Clean up individual files
rm -f "$BACKUP_DIR/${BACKUP_NAME}_"*

success "Backup compressed: $BACKUP_DIR/${BACKUP_NAME}_complete.tar.gz"

# Upload to S3 (if configured)
if [[ -n "$BACKUP_S3_BUCKET" && -n "$AWS_ACCESS_KEY_ID" ]]; then
    log "Uploading backup to S3..."
    if command -v aws > /dev/null 2>&1; then
        aws s3 cp "$BACKUP_DIR/${BACKUP_NAME}_complete.tar.gz" "s3://$BACKUP_S3_BUCKET/backups/"
        success "Backup uploaded to S3"
    else
        warning "AWS CLI not found, skipping S3 upload"
    fi
else
    warning "S3 configuration not found, skipping S3 upload"
fi

# Clean up old backups (keep last 7 days)
log "Cleaning up old backups..."
find "$BACKUP_DIR" -name "probuilder_backup_*_complete.tar.gz" -mtime +7 -delete 2>/dev/null || true

success "Old backups cleaned up"

# Show backup summary
log "Backup Summary:"
echo "  📁 Backup Directory: $BACKUP_DIR"
echo "  📦 Backup File: ${BACKUP_NAME}_complete.tar.gz"
echo "  📊 Backup Size: $(du -h "$BACKUP_DIR/${BACKUP_NAME}_complete.tar.gz" | cut -f1)"
echo "  🕐 Created: $(date)"

success "Backup completed successfully for $ENVIRONMENT environment!"

