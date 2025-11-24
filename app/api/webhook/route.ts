import { Bot, webhookCallback } from "grammy";
import { setupBotHandlers } from "@/src/lib/telegram-bot";

export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60 seconds for PDF processing

// Force rebuild: 2025-11-25-21:03

// Initialize bot lazily on first request
let bot: Bot | null = null;
let handleWebhook: ((req: Request) => Promise<Response>) | null = null;

function initBot() {
  if (bot) return { bot, handleWebhook: handleWebhook! };

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("❌ TELEGRAM_BOT_TOKEN not found in environment");
    throw new Error("TELEGRAM_BOT_TOKEN environment variable not found.");
  }

  console.log(
    "✅ Initializing bot with token:",
    token.substring(0, 10) + "..."
  );

  bot = new Bot(token);

  // Log ALL incoming updates
  bot.use(async (ctx, next) => {
    console.log("📬 Telegram update received:", {
      update_id: ctx.update.update_id,
      type: Object.keys(ctx.update).filter((k) => k !== "update_id"),
      from: ctx.from?.id,
      chat: ctx.chat?.id,
      message_id: ctx.message?.message_id,
      text: ctx.message?.text?.substring(0, 50),
    });
    await next();
  });

  // Setup all bot handlers (shared with development mode)
  setupBotHandlers(bot, token);

  // Create webhook handler
  handleWebhook = webhookCallback(bot, "std/http");

  return { bot, handleWebhook };
}

const handleReaderRequest = async (req: Request) => {
  const startTime = Date.now();
  console.log("🔔 Webhook POST received at", new Date().toISOString());
  console.log("   URL:", req.url);
  console.log("   Method:", req.method);
  console.log("   Content-Type:", req.headers.get("content-type"));

  try {
    // Initialize bot on first request
    const { handleWebhook: webhook } = initBot();

    // Log the request body for debugging
    const clonedReq = req.clone();
    const body = await clonedReq.text();
    console.log("   Body preview:", body.substring(0, 200) + "...");

    // Grammy's webhookCallback expects standard Request/Response
    const response = await webhook(req);
    const duration = Date.now() - startTime;
    console.log("✅ Webhook processed successfully");
    console.log("   Status:", response.status);
    console.log("   Duration:", duration + "ms");
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("❌ Webhook error after", duration + "ms");
    console.error("   Error:", error);
    // Return 200 to Telegram even on error to avoid retries
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Wrap webhook handler with logging
export async function POST(req: Request) {
  return handleReaderRequest(req);
}

// Also export GET handler to avoid 405 errors
export async function GET() {
  return new Response(
    JSON.stringify({
      status: "Webhook endpoint active",
      bot: "calcsalarybot",
      timestamp: new Date().toISOString(),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
