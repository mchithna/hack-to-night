#!/bin/bash
# Quick Vercel deployment setup

echo "🚀 Vercel Deployment Setup"
echo "=========================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm i -g vercel
fi

echo "Step 1: Login to Vercel"
vercel login

echo ""
echo "Step 2: Create/link project"
vercel link

echo ""
echo "Step 3: Set environment variables"
echo "Run these commands:"
echo ""
echo "vercel env add DATABASE_URL"
echo "vercel env add JWT_SECRET"
echo ""

echo "Step 4: Deploy to production"
read -p "Ready to deploy? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    vercel --prod
    echo ""
    echo "✓ Deployed! Check your Vercel dashboard"
fi
