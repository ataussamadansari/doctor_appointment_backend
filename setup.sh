#!/bin/bash

# Doctor Appointment System - Automated Setup Script
# This script automates the initial setup process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Print banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════╗"
echo "║   Doctor Appointment System - Setup Script           ║"
echo "║   Production-Ready MERN Stack Application            ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running on Windows (Git Bash)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    print_warning "Detected Windows environment"
    print_info "Some commands may need to be run manually"
fi

# Step 1: Check prerequisites
echo ""
print_info "Step 1: Checking prerequisites..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js is installed: $NODE_VERSION"
else
    print_error "Node.js is not installed"
    print_info "Please install Node.js v18+ from https://nodejs.org/"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm is installed: $NPM_VERSION"
else
    print_error "npm is not installed"
    exit 1
fi

# Check MongoDB
if command -v mongod &> /dev/null || command -v mongo &> /dev/null; then
    print_success "MongoDB is installed"
else
    print_warning "MongoDB is not installed or not in PATH"
    print_info "Please install MongoDB from https://www.mongodb.com/try/download/community"
    print_info "Or use Docker: docker run -d -p 27017:27017 mongo:7.0"
fi

# Check Redis
if command -v redis-server &> /dev/null || command -v redis-cli &> /dev/null; then
    print_success "Redis is installed"
else
    print_warning "Redis is not installed or not in PATH"
    print_info "Please install Redis from https://redis.io/download"
    print_info "Or use Docker: docker run -d -p 6379:6379 redis:7-alpine"
fi

# Step 2: Install dependencies
echo ""
print_info "Step 2: Installing dependencies..."
npm install
print_success "Dependencies installed successfully"

# Step 3: Setup environment file
echo ""
print_info "Step 3: Setting up environment configuration..."

if [ -f ".env" ]; then
    print_warning ".env file already exists"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Keeping existing .env file"
    else
        cp .env.example .env
        print_success "Created new .env file from template"
    fi
else
    cp .env.example .env
    print_success "Created .env file from template"
fi

# Step 4: Generate JWT secrets
echo ""
print_info "Step 4: Generating secure JWT secrets..."

# Generate random secrets
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
JWT_REFRESH_SECRET=$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

# Update .env file (cross-platform compatible)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    sed -i '' "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|" .env
else
    # Linux and Git Bash on Windows
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|" .env
fi

print_success "JWT secrets generated and saved to .env"

# Step 5: Create logs directory
echo ""
print_info "Step 5: Creating logs directory..."
mkdir -p logs
print_success "Logs directory created"

# Step 6: Test database connections
echo ""
print_info "Step 6: Testing database connections..."

# Test MongoDB
print_info "Testing MongoDB connection..."
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.version()" --quiet &> /dev/null; then
        print_success "MongoDB connection successful"
    else
        print_warning "Could not connect to MongoDB"
        print_info "Make sure MongoDB is running: mongod"
    fi
elif command -v mongo &> /dev/null; then
    if mongo --eval "db.version()" --quiet &> /dev/null; then
        print_success "MongoDB connection successful"
    else
        print_warning "Could not connect to MongoDB"
        print_info "Make sure MongoDB is running: mongod"
    fi
else
    print_warning "MongoDB client not found, skipping connection test"
fi

# Test Redis
print_info "Testing Redis connection..."
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        print_success "Redis connection successful"
    else
        print_warning "Could not connect to Redis"
        print_info "Make sure Redis is running: redis-server"
    fi
else
    print_warning "Redis client not found, skipping connection test"
fi

# Step 7: Display next steps
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Setup completed successfully! 🎉            ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

print_info "Next steps:"
echo ""
echo "1. Review and update .env file with your configuration:"
echo "   - MongoDB URI (if not using default)"
echo "   - Redis configuration (if not using default)"
echo "   - Payment gateway credentials (Razorpay/Stripe)"
echo "   - Email SMTP settings"
echo "   - Frontend URLs"
echo ""
echo "2. Start the required services:"
echo "   ${BLUE}mongod${NC}                    # Start MongoDB"
echo "   ${BLUE}redis-server${NC}              # Start Redis"
echo ""
echo "3. Start the backend server:"
echo "   ${BLUE}npm run dev${NC}               # Development mode with auto-reload"
echo "   ${BLUE}npm start${NC}                 # Production mode"
echo ""
echo "4. (Optional) Start the background worker:"
echo "   ${BLUE}npm run worker${NC}            # In a separate terminal"
echo ""
echo "5. Test the API:"
echo "   ${BLUE}curl http://localhost:5000/health${NC}"
echo ""
echo "6. Read the documentation:"
echo "   - README.md              # Complete documentation"
echo "   - QUICK_START.md         # Quick start guide"
echo "   - API_DOCUMENTATION.md   # API reference"
echo ""

print_info "Using Docker? Run: ${BLUE}docker-compose up -d${NC}"
echo ""

print_success "Happy coding! 🚀"
echo ""
