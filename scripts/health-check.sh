#!/bin/bash

# Health Check Script
# Construction Master App - Service Health Monitoring

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
DOCKER_COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"
HEALTH_CHECK_TIMEOUT=30

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

log "Starting health check for environment: $ENVIRONMENT"

# Check if Docker Compose file exists
if [[ ! -f "$DOCKER_COMPOSE_FILE" ]]; then
    error "Docker compose file not found: $DOCKER_COMPOSE_FILE"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if services are running
log "Checking if services are running..."
if ! docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q | grep -q .; then
    error "No services are running. Please start the services first."
    exit 1
fi

# Function to check HTTP endpoint
check_http_endpoint() {
    local url=$1
    local service_name=$2
    local expected_status=${3:-200}
    
    log "Checking $service_name at $url..."
    
    if response=$(curl -s -w "%{http_code}" -o /dev/null --max-time $HEALTH_CHECK_TIMEOUT "$url" 2>/dev/null); then
        if [[ "$response" == "$expected_status" ]]; then
            success "$service_name is healthy (HTTP $response)"
            return 0
        else
            error "$service_name returned HTTP $response (expected $expected_status)"
            return 1
        fi
    else
        error "$service_name is not responding"
        return 1
    fi
}

# Function to check Docker container health
check_container_health() {
    local container_name=$1
    local service_name=$2
    
    log "Checking $service_name container health..."
    
    if docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q "$container_name" | grep -q .; then
        local health_status=$(docker inspect --format='{{.State.Health.Status}}' "$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q "$container_name")" 2>/dev/null || echo "unknown")
        
        if [[ "$health_status" == "healthy" ]]; then
            success "$service_name container is healthy"
            return 0
        elif [[ "$health_status" == "unhealthy" ]]; then
            error "$service_name container is unhealthy"
            return 1
        else
            warning "$service_name container health status: $health_status"
            return 0
        fi
    else
        error "$service_name container is not running"
        return 1
    fi
}

# Function to check database connection
check_database() {
    local container_name=$1
    local service_name=$2
    
    log "Checking $service_name database connection..."
    
    if docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q "$container_name" | grep -q .; then
        if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T "$container_name" mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
            success "$service_name database is accessible"
            return 0
        else
            error "$service_name database is not accessible"
            return 1
        fi
    else
        error "$service_name container is not running"
        return 1
    fi
}

# Function to check Redis connection
check_redis() {
    local container_name=$1
    local service_name=$2
    
    log "Checking $service_name Redis connection..."
    
    if docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q "$container_name" | grep -q .; then
        if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T "$container_name" redis-cli ping > /dev/null 2>&1; then
            success "$service_name Redis is accessible"
            return 0
        else
            error "$service_name Redis is not accessible"
            return 1
        fi
    else
        error "$service_name container is not running"
        return 1
    fi
}

# Initialize health check results
HEALTH_CHECK_FAILED=0

# Check MongoDB
if ! check_container_health "mongodb" "MongoDB"; then
    HEALTH_CHECK_FAILED=1
fi

if ! check_database "mongodb" "MongoDB"; then
    HEALTH_CHECK_FAILED=1
fi

# Check Redis
if ! check_container_health "redis" "Redis"; then
    HEALTH_CHECK_FAILED=1
fi

if ! check_redis "redis" "Redis"; then
    HEALTH_CHECK_FAILED=1
fi

# Check Server
if ! check_container_health "server" "Server"; then
    HEALTH_CHECK_FAILED=1
fi

# Determine server port based on environment
if [[ "$ENVIRONMENT" == "staging" ]]; then
    SERVER_PORT="3017"
elif [[ "$ENVIRONMENT" == "production" ]]; then
    SERVER_PORT="3016"
else
    SERVER_PORT="3016"
fi

if ! check_http_endpoint "http://localhost:$SERVER_PORT/api/health" "Server API"; then
    HEALTH_CHECK_FAILED=1
fi

# Check Client
if ! check_container_health "client" "Client"; then
    HEALTH_CHECK_FAILED=1
fi

# Determine client port based on environment
if [[ "$ENVIRONMENT" == "staging" ]]; then
    CLIENT_PORT="3228"
elif [[ "$ENVIRONMENT" == "production" ]]; then
    CLIENT_PORT="3227"
else
    CLIENT_PORT="3227"
fi

if ! check_http_endpoint "http://localhost:$CLIENT_PORT" "Client Application"; then
    HEALTH_CHECK_FAILED=1
fi

# Check Nginx (if running)
if docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q nginx | grep -q .; then
    if ! check_container_health "nginx" "Nginx"; then
        HEALTH_CHECK_FAILED=1
    fi
    
    # Determine nginx port based on environment
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        NGINX_PORT="8080"
    elif [[ "$ENVIRONMENT" == "production" ]]; then
        NGINX_PORT="80"
    else
        NGINX_PORT="80"
    fi
    
    if ! check_http_endpoint "http://localhost:$NGINX_PORT/health" "Nginx Proxy"; then
        HEALTH_CHECK_FAILED=1
    fi
fi

# Check Prometheus (if running)
if docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q prometheus | grep -q .; then
    if ! check_container_health "prometheus" "Prometheus"; then
        HEALTH_CHECK_FAILED=1
    fi
    
    if ! check_http_endpoint "http://localhost:9090" "Prometheus"; then
        HEALTH_CHECK_FAILED=1
    fi
fi

# Check Grafana (if running)
if docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q grafana | grep -q .; then
    if ! check_container_health "grafana" "Grafana"; then
        HEALTH_CHECK_FAILED=1
    fi
    
    if ! check_http_endpoint "http://localhost:3000" "Grafana"; then
        HEALTH_CHECK_FAILED=1
    fi
fi

# Show service status
log "Service Status Summary:"
docker-compose -f "$DOCKER_COMPOSE_FILE" ps

# Show resource usage
log "Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" $(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q)

# Final result
if [[ $HEALTH_CHECK_FAILED -eq 1 ]]; then
    error "Health check failed - some services are not healthy"
    log "Showing recent logs for failed services:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail=20
    exit 1
else
    success "All services are healthy!"
    log "Health check completed successfully for $ENVIRONMENT environment"
    exit 0
fi

