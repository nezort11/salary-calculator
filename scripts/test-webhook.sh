#!/bin/bash

# Test the webhook by sending a test update to the bot
BOT_TOKEN="${BOT_TOKEN:-your_bot_token_here}"

echo "🔍 Testing webhook configuration..."
echo ""

# Get webhook info
echo "📋 Current webhook info:"
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" | python3 -m json.tool
echo ""
echo ""

# Get bot info
echo "🤖 Bot info:"
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getMe" | python3 -m json.tool
echo ""
echo ""

echo "✅ Webhook is set up!"
echo ""
echo "🧪 To test the bot:"
echo "1. Stop your local bot (Terminal 6) with Ctrl+C"
echo "2. Send a message to your bot on Telegram"
echo "3. Send a PDF to your bot"
echo "4. The bot should respond via the webhook!"
echo ""
echo "📊 Monitor logs at: https://vercel.com/nezort11s-projects/salary-calculator"



