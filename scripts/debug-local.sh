#!/bin/bash

echo "🐛 Starting Local Debug Setup..."
echo ""

# Load token
export TELEGRAM_BOT_TOKEN=$(grep TELEGRAM_BOT_TOKEN .env.local | cut -d '=' -f2 | tr -d '"')

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
  echo "❌ Error: TELEGRAM_BOT_TOKEN not found in .env.local"
  exit 1
fi

echo "✅ Token loaded: ${TELEGRAM_BOT_TOKEN:0:10}..."
echo ""

# Check current webhook status
echo "📊 Current webhook status:"
pnpm webhook:info
echo ""

# Ask if we should delete webhook
read -p "Delete webhook to enable local mode? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🗑️  Deleting webhook..."
  pnpm webhook:delete
  echo ""
  echo "✅ Webhook deleted! Local bot can now receive messages."
  echo ""
  echo "📝 Next steps:"
  echo "   1. In Terminal 6, run: pnpm bot:dev"
  echo "   2. Send /start to @calcsalarybot in Telegram"
  echo "   3. Watch Terminal 6 for logs"
  echo "   4. Copy your user info from the logs and share it"
  echo ""
else
  echo "⚠️  Webhook NOT deleted. Bot will still use webhook mode."
  echo ""
  echo "To manually delete: pnpm webhook:delete"
  echo ""
fi

echo "🔧 Quick commands:"
echo "   pnpm bot:dev          - Start local bot"
echo "   pnpm webhook:info     - Check webhook status"
echo "   pnpm webhook:set      - Set webhook (back to production)"
echo "   pnpm deploy           - Deploy to production"
echo ""



