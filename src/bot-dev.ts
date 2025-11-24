import { Bot } from "grammy";
import { setupBotHandlers } from "./lib/telegram-bot";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error(
    "❌ TELEGRAM_BOT_TOKEN not found in environment variables"
  );
  console.error(
    "Make sure you have a .env.local file with TELEGRAM_BOT_TOKEN set"
  );
  process.exit(1);
}

const bot = new Bot(token);

// Setup all bot handlers (shared with production webhook)
setupBotHandlers(bot, token);

// Start the bot in development mode (long polling)
console.log("🤖 Starting bot in development mode (long polling)...");
console.log("📡 Bot will poll Telegram for updates");
console.log("🔧 Press Ctrl+C to stop\n");

bot.start({
  onStart: (botInfo) => {
    console.log(`✅ Bot started successfully!`);
    console.log(`📱 Bot username: @${botInfo.username}`);
    console.log(`🆔 Bot ID: ${botInfo.id}`);
    console.log(
      `\n💡 Send a message to @${botInfo.username} to test it!\n`
    );
  },
});
