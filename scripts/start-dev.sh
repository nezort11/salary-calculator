#!/bin/bash

# Blog Reader Bot - Quick Start Script
# This script helps you get started with local development

echo "🤖 Blog Reader Bot - Local Development Setup"
echo "=============================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo ""
    echo "Creating .env.local template..."
    cat > .env.local << 'EOF'
# Telegram Bot Token (from @BotFather)
TELEGRAM_BOT_TOKEN=

# Vercel Blob Storage (from Vercel dashboard)
BLOB_READ_WRITE_TOKEN=

# Public App URL (for local dev)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Blob Store ID (from Vercel dashboard)
NEXT_PUBLIC_BLOB_STORE_ID=
EOF
    echo "✅ Created .env.local template"
    echo ""
    echo "⚠️  Please edit .env.local and add your tokens:"
    echo "   1. TELEGRAM_BOT_TOKEN - Get from @BotFather"
    echo "   2. BLOB_READ_WRITE_TOKEN - Get from Vercel dashboard"
    echo "   3. NEXT_PUBLIC_BLOB_STORE_ID - Get from Vercel dashboard"
    echo ""
    echo "Then run this script again!"
    exit 1
fi

# Check if required variables are set
source .env.local

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ TELEGRAM_BOT_TOKEN is not set in .env.local"
    echo "   Get your token from @BotFather on Telegram"
    exit 1
fi

if [ -z "$BLOB_READ_WRITE_TOKEN" ]; then
    echo "❌ BLOB_READ_WRITE_TOKEN is not set in .env.local"
    echo "   Get this from your Vercel project dashboard"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_BLOB_STORE_ID" ]; then
    echo "❌ NEXT_PUBLIC_BLOB_STORE_ID is not set in .env.local"
    echo "   Get this from your Vercel Blob Storage dashboard"
    exit 1
fi

echo "✅ Environment variables configured"
echo ""

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    pnpm install
    echo ""
fi

echo "✅ Dependencies installed"
echo ""

# Check if any webhook is set
echo "🔍 Checking if webhook is set (should be empty for local dev)..."
WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo")
WEBHOOK_URL=$(echo $WEBHOOK_INFO | grep -o '"url":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$WEBHOOK_URL" ]; then
    echo "⚠️  Warning: Webhook is currently set to: $WEBHOOK_URL"
    echo ""
    read -p "Do you want to remove the webhook for local development? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook" > /dev/null
        echo "✅ Webhook removed"
    else
        echo "⚠️  Note: Bot may not work locally if webhook is set"
    fi
    echo ""
else
    echo "✅ No webhook set (good for local dev)"
    echo ""
fi

# Get bot info
echo "📱 Bot Information:"
BOT_INFO=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe")
BOT_USERNAME=$(echo $BOT_INFO | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
BOT_NAME=$(echo $BOT_INFO | grep -o '"first_name":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$BOT_USERNAME" ]; then
    echo "   Name: $BOT_NAME"
    echo "   Username: @$BOT_USERNAME"
    echo "   Link: https://t.me/$BOT_USERNAME"
else
    echo "   ❌ Could not fetch bot info. Check your TELEGRAM_BOT_TOKEN"
    exit 1
fi

echo ""
echo "✅ Setup complete! Ready to start development."
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Open TWO terminal windows:"
echo ""
echo "   Terminal 1 - Start Next.js:"
echo "   $ pnpm dev"
echo ""
echo "   Terminal 2 - Start Bot:"
echo "   $ pnpm bot:dev"
echo ""
echo "2. Open your bot on Telegram: https://t.me/$BOT_USERNAME"
echo ""
echo "3. Send a blog URL to test:"
echo "   https://paulgraham.com/articles.html"
echo ""
echo "4. The bot will send you a web app link - open it!"
echo ""
echo "📚 Documentation:"
echo "   - LOCAL_DEVELOPMENT.md - Detailed local dev guide"
echo "   - BLOG_READER_QUICKSTART.md - User guide"
echo "   - BLOG_READER_SETUP.md - Production setup"
echo ""
echo "🎉 Happy coding!"



