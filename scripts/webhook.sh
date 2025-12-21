#!/bin/bash
# Telegram Bot Webhook Management Script

set -e

# Load environment
export TELEGRAM_BOT_TOKEN=$(grep TELEGRAM_BOT_TOKEN .env.local | cut -d '=' -f2 | tr -d '"')
export WEBHOOK_URL=$(grep WEBHOOK_URL .env.local | cut -d '=' -f2 | tr -d '"')

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ Error: TELEGRAM_BOT_TOKEN not found in .env.local"
    exit 1
fi

if [ -z "$WEBHOOK_URL" ]; then
    echo "❌ Error: WEBHOOK_URL not found in .env.local"
    exit 1
fi

case "$1" in
    set)
        echo "🔧 Setting webhook to: $WEBHOOK_URL"
        curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
          -d "url=$WEBHOOK_URL" \
          -d "drop_pending_updates=true" | python3 -m json.tool
        ;;

    delete)
        echo "🗑️  Deleting webhook..."
        curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/deleteWebhook?drop_pending_updates=true" | python3 -m json.tool
        ;;

    info)
        echo "📊 Webhook info:"
        curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo" | python3 -m json.tool
        ;;

    reset)
        echo "🔄 Resetting webhook..."
        $0 delete
        sleep 2
        $0 set
        ;;

    bot-info)
        echo "🤖 Bot info:"
        curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe" | python3 -m json.tool
        ;;

    *)
        echo "Usage: $0 {set|delete|info|reset|bot-info}"
        echo ""
        echo "Commands:"
        echo "  set       - Set webhook to production"
        echo "  delete    - Delete webhook (for local development)"
        echo "  info      - Show webhook status"
        echo "  reset     - Delete and set webhook again"
        echo "  bot-info  - Show bot information"
        exit 1
        ;;
esac
