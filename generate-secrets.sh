#!/bin/bash
# Generate strong secrets for production

generate_password() {
    openssl rand -base64 32
}

echo "🔐 Production Secrets Generator"
echo "================================"
echo ""
echo "POSTGRES_PASSWORD=$(generate_password)"
echo "JWT_SECRET=$(generate_password)"
echo ""
echo "Copy these values into your .env.production file"
