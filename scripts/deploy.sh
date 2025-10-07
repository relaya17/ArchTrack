#!/bin/bash

# Deployment Script
# Construction Master App - Automated Deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
PROJECT_NAME="probuilder"
DOCKER_COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"
ENV_FILE="env.${ENVIRONMENT}"

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

log "Starting deployment for environment: $ENVIRONMENT"

# Check if required files exist
if [[ ! -f "$DOCKER_COMPOSE_FILE" ]]; then
    error "Docker compose file not found: $DOCKER_COMPOSE_FILE"
    exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
    error "Environment file not found: $ENV_FILE"
    exit 1
fi

# Load environment variables
log "Loading environment variables from $ENV_FILE"
export $(cat "$ENV_FILE" | grep -v '^#' | xargs)

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    error "Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Backup current deployment (if exists)
if docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q | grep -q .; then
    log "Creating backup of current deployment..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down --timeout 30
    success "Current deployment stopped"
fi

# Pull latest images
log "Pulling latest Docker images..."
docker-compose -f "$DOCKER_COMPOSE_FILE" pull

# Build images
log "Building Docker images..."
docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache

# Start services
log "Starting services..."
docker-compose -f "$DOCKER_COMPOSE_FILE" up -d

# Wait for services to be healthy
log "Waiting for services to be healthy..."
sleep 30

# Check service health
log "Checking service health..."
HEALTH_CHECK_FAILED=0

# Check server health
if ! curl -f http://localhost:3016/api/health > /dev/null 2>&1; then
    error "Server health check failed"
    HEALTH_CHECK_FAILED=1
else
    success "Server is healthy"
fi

# Check client health
if ! curl -f http://localhost:3227 > /dev/null 2>&1; then
    error "Client health check failed"
    HEALTH_CHECK_FAILED=1
else
    success "Client is healthy"
fi

# Check database connection
if ! docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    error "Database connection failed"
    HEALTH_CHECK_FAILED=1
else
    success "Database is healthy"
fi

# Check Redis connection
if ! docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli ping > /dev/null 2>&1; then
    error "Redis connection failed"
    HEALTH_CHECK_FAILED=1
else
    success "Redis is healthy"
fi

# Final status check
if [[ $HEALTH_CHECK_FAILED -eq 1 ]]; then
    error "Deployment failed - some services are not healthy"
    log "Showing service logs:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail=50
    exit 1
fi

# Show deployment status
log "Deployment completed successfully!"
docker-compose -f "$DOCKER_COMPOSE_FILE" ps

# Show service URLs
log "Service URLs:"
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "  🌐 Application: https://probuilder.app"
    echo "  📊 Grafana: https://probuilder.app:3000"
    echo "  📈 Prometheus: https://probuilder.app:9090"
elif [[ "$ENVIRONMENT" == "staging" ]]; then
    echo "  🌐 Application: http://localhost:8080"
    echo "  📊 Server: http://localhost:3017"
    echo "  📱 Client: http://localhost:3228"
else
    echo "  🌐 Application: http://localhost:80"
    echo "  📊 Server: http://localhost:3016"
    echo "  📱 Client: http://localhost:3227"
    echo "  📊 Grafana: http://localhost:3000"
    echo "  📈 Prometheus: http://localhost:9090"
fi

success "Deployment completed successfully for $ENVIRONMENT environment!"

