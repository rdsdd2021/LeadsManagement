#!/bin/bash

# Deployment script for Lead Management Application
# This script should be run on the server

set -e

echo "===== Lead Management App Deployment ====="
echo ""

# Navigate to app directory
APP_DIR="$HOME/lead-management-app"
cd "$APP_DIR"

echo "📦 Pulling latest changes..."
git pull origin main || echo "⚠️  Not a git repository or no remote configured"

echo ""
echo "🛑 Stopping existing containers..."
docker-compose down || true

echo ""
echo "🏗️  Building Docker image..."
docker-compose build --no-cache

echo ""
echo "🚀 Starting containers..."
docker-compose up -d

echo ""
echo "⏳ Waiting for application to start..."
sleep 10

echo ""
echo "🔍 Checking container status..."
docker-compose ps

echo ""
echo "📊 Container logs (last 20 lines):"
docker-compose logs --tail=20

echo ""
echo "✅ Deployment complete!"
echo "🌐 Application should be available at http://localhost:3000"
echo ""
echo "📝 To view logs, run: docker-compose logs -f"
echo "📝 To check status, run: docker-compose ps"
