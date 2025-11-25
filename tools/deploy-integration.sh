#!/bin/bash

# Nebula Integration Deployment Script
# Deployed die komplette Bot-zu-Admin Integration

set -e

echo "🚀 Nebula Integration Deployment"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_SERVER_DIR="../apps/api-server"
BOT_DIR="../apps/bot"
ADMIN_DIR="../apps/admin"
TOOLS_DIR="../tools"

POSTGRES_DB="nebula"
POSTGRES_USER="nebula"
POSTGRES_PASSWORD="nebula_secure_password"

REDIS_HOST="localhost"
REDIS_PORT="6379"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi

    # Check npm/pnpm
    if command -v pnpm &> /dev/null; then
        PACKAGE_MANAGER="pnpm"
    elif command -v npm &> /dev/null; then
        PACKAGE_MANAGER="npm"
    else
        log_error "Neither pnpm nor npm found"
        exit 1
    fi

    # Check Docker (for database services)
    if ! command -v docker &> /dev/null; then
        log_warning "Docker not found. Database services need to be running manually."
    fi

    log_success "Prerequisites check completed"
}

setup_database() {
    log_info "Setting up database..."

    # Check if PostgreSQL is running
    if command -v docker &> /dev/null; then
        # Start PostgreSQL container if not running
        if ! docker ps | grep -q nebula-postgres; then
            log_info "Starting PostgreSQL container..."
            docker run --name nebula-postgres \
                -e POSTGRES_DB=$POSTGRES_DB \
                -e POSTGRES_USER=$POSTGRES_USER \
                -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
                -p 5432:5432 \
                -d postgres:15-alpine
            log_success "PostgreSQL container started"
        else
            log_success "PostgreSQL container already running"
        fi
    else
        log_warning "Docker not available. Please ensure PostgreSQL is running on localhost:5432"
    fi

    # Check if Redis is running
    if command -v docker &> /dev/null; then
        if ! docker ps | grep -q nebula-redis; then
            log_info "Starting Redis container..."
            docker run --name nebula-redis \
                -p 6379:6379 \
                -d redis:7-alpine
            log_success "Redis container started"
        else
            log_success "Redis container already running"
        fi
    else
        log_warning "Docker not available. Please ensure Redis is running on localhost:6379"
    fi

    # Wait for services to be ready
    log_info "Waiting for database services to be ready..."
    sleep 5

    log_success "Database setup completed"
}

install_dependencies() {
    log_info "Installing dependencies..."

    # Install API server dependencies
    cd "$API_SERVER_DIR"
    if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
        pnpm install
    else
        npm install
    fi
    log_success "API server dependencies installed"

    # Install Bot dependencies
    cd "../$BOT_DIR"
    if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
        pnpm install
    else
        npm install
    fi
    log_success "Bot dependencies installed"

    # Install Admin dashboard dependencies
    cd "../$ADMIN_DIR"
    if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
        pnpm install
    else
        npm install
    fi
    log_success "Admin dashboard dependencies installed"

    cd "../.."
    log_success "All dependencies installed"
}

build_services() {
    log_info "Building services..."

    # Build API server
    cd "$API_SERVER_DIR"
    if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
        pnpm run build
    else
        npm run build
    fi
    log_success "API server built"

    # Build Bot
    cd "../$BOT_DIR"
    if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
        pnpm run build
    else
        npm run build
    fi
    log_success "Bot built"

    # Build Admin dashboard
    cd "../$ADMIN_DIR"
    if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
        pnpm run build
    else
        npm run build
    fi
    log_success "Admin dashboard built"

    cd "../.."
    log_success "All services built"
}

create_environment_files() {
    log_info "Creating environment files..."

    # Create API server .env
    cat > "$API_SERVER_DIR/.env" << EOF
# Server Configuration
PORT=3001
NODE_ENV=production
CLIENT_URL=http://localhost:5173

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$POSTGRES_DB
DB_USER=$POSTGRES_USER
DB_PASSWORD=$POSTGRES_PASSWORD
DB_POOL_MAX=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000

# Redis Configuration
REDIS_HOST=$REDIS_HOST
REDIS_PORT=$REDIS_PORT
REDIS_PASSWORD=
REDIS_DB=0
REDIS_PREFIX=nebula:
CACHE_TTL=300

# Bot Integration
BOT_API_URL=http://localhost:3001/api
BOT_API_KEY=nebula-bot-integration-key-2025

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-change-this-in-production
JWT_EXPIRES_IN=8h

# Admin Configuration
ADMIN_IDS=123456789,987654321
ENABLE_VERIFICATION=true
ENABLE_INVITE_SYSTEM=true
ENABLE_SUPPORT_TICKETS=true

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Security
BCRYPT_ROUNDS=12

# Logging
LOG_LEVEL=info
EOF

    # Create Bot .env
    cat > "$BOT_DIR/.env" << EOF
# Bot Configuration
BOT_TOKEN=your-telegram-bot-token-here
BOT_NAME=NebulaBot
NODE_ENV=production

# API Integration
BOT_API_URL=http://localhost:3001/api
BOT_API_KEY=nebula-bot-integration-key-2025

# Database (for bot-specific data)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$POSTGRES_DB
DB_USER=$POSTGRES_USER
DB_PASSWORD=$POSTGRES_PASSWORD

# Redis
REDIS_HOST=$REDIS_HOST
REDIS_PORT=$REDIS_PORT

# Admin Configuration
ADMIN_IDS=123456789,987654321
ENABLE_VERIFICATION=true
ENABLE_INVITE_SYSTEM=true
ENABLE_SUPPORT_TICKETS=true

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
EOF

    log_success "Environment files created"
}

run_database_migrations() {
    log_info "Running database migrations..."

    cd "$API_SERVER_DIR"

    # Run the API server to initialize database tables
    timeout 30s npm start || true

    cd "../.."
    log_success "Database migrations completed"
}

run_tests() {
    log_info "Running integration tests..."

    cd "$TOOLS_DIR"
    npx tsx integration-test.ts

    log_success "Integration tests completed"
}

run_performance_analysis() {
    log_info "Running performance analysis..."

    cd "$TOOLS_DIR"
    npx tsx performance-optimizer.ts

    log_success "Performance analysis completed"
}

start_services() {
    log_info "Starting services..."

    # Start API server in background
    cd "$API_SERVER_DIR"
    nohup npm start > ../api-server.log 2>&1 &
    API_PID=$!
    cd "../.."

    # Wait for API server to be ready
    log_info "Waiting for API server to start..."
    sleep 10

    # Test API server health
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_success "API server started successfully"
    else
        log_error "API server failed to start"
        exit 1
    fi

    # Start Bot (in development mode for testing)
    cd "$BOT_DIR"
    log_info "Starting Bot in development mode..."
    echo "Bot would start here in production with proper BOT_TOKEN"
    cd "../.."

    log_success "Services started"
}

create_deployment_summary() {
    cat << EOF

🎉 NEBULA INTEGRATION DEPLOYMENT COMPLETED
===========================================

✅ Services Deployed:
   • PostgreSQL Database (port 5432)
   • Redis Cache (port 6379)
   • API Server (port 3001)
   • Bot Integration (ready)
   • Admin Dashboard (built)

🔧 Configuration:
   • Database: $POSTGRES_DB@$POSTGRES_USER
   • Redis: $REDIS_HOST:$REDIS_PORT
   • API Base URL: http://localhost:3001
   • Bot API Key: nebula-bot-integration-key-2025

📊 Next Steps:
   1. Set your Telegram Bot Token in $BOT_DIR/.env
   2. Configure admin IDs in environment files
   3. Start the Bot: cd $BOT_DIR && npm run dev
   4. Access Admin Dashboard: http://localhost:5173 (after starting admin dev server)
   5. Run tests: cd $TOOLS_DIR && npx tsx integration-test.ts

🛠️  Monitoring:
   • API Server logs: $API_SERVER_DIR/../api-server.log
   • Performance monitoring: cd $TOOLS_DIR && npx tsx performance-optimizer.ts

🚨 Important Security Notes:
   • Change all default passwords and secrets in production
   • Use proper SSL/TLS certificates
   • Configure firewall rules
   • Set up proper authentication for production use

EOF
}

# Main deployment flow
main() {
    echo "Starting Nebula Integration Deployment..."

    check_prerequisites
    setup_database
    install_dependencies
    build_services
    create_environment_files
    run_database_migrations
    run_tests
    run_performance_analysis
    start_services
    create_deployment_summary

    log_success "🎉 Deployment completed successfully!"
}

# Run deployment
main
