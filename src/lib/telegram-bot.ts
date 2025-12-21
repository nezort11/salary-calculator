import { Bot } from "grammy";
import { parseBlogPost, generateContentId } from "./blog-parser";
import { parsePDF } from "./pdf-parser";
import { put } from "@vercel/blob";
import * as fs from "fs";
import * as path from "path";

// ============================================================================
// Storage
// ============================================================================

/**
 * Stores parsed content either locally (for development) or in Vercel Blob (for production)
 */
export async function storeContent(
  contentId: string,
  data: any
): Promise<void> {
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    // Store locally for development
    const localStorageDir = path.join(
      process.cwd(),
      ".local-storage",
      "reader"
    );
    if (!fs.existsSync(localStorageDir)) {
      fs.mkdirSync(localStorageDir, { recursive: true });
    }

    const filePath = path.join(localStorageDir, `${contentId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data), "utf-8");
    console.log(`📁 Stored locally: ${filePath}`);
  } else {
    // Use Vercel Blob for production
    await put(`reader/${contentId}.json`, JSON.stringify(data), {
      access: "public",
      addRandomSuffix: false,
    });
    console.log(`☁️  Stored in Vercel Blob`);
  }
}

/**
 * Gets the base URL for the web app (for generating reader links)
 */
export function getAppBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  console.log(
    `🌐 getAppBaseUrl: NEXT_PUBLIC_APP_URL="${process.env.NEXT_PUBLIC_APP_URL}", trimmed="${envUrl}", NODE_ENV="${process.env.NODE_ENV}"`
  );

  if (envUrl) {
    console.log(`🌐 Using env URL: "${envUrl}"`);
    return envUrl;
  }

  const fallbackUrl =
    process.env.NODE_ENV === "production"
      ? "https://salary-calculator-gray.vercel.app"
      : "http://localhost:3000";

  console.log(`🌐 Using fallback URL: "${fallbackUrl}"`);
  return fallbackUrl;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Validates if a string is a valid HTTP/HTTPS URL
 */
export function isValidUrl(text: string): boolean {
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// ============================================================================
// Bot Handlers
// ============================================================================

/**
 * Sets up all bot command and message handlers
 * This function is used by both development (long polling) and production (webhook) modes
 */
export function setupBotHandlers(bot: Bot, token: string) {
  // Command: /start
  bot.command("start", async (ctx) => {
    await ctx.reply(
      "👋 Welcome to the Blog Reader Bot!\n\n" +
        "Convert any content into chunks you can listen to using ChatGPT's text-to-speech!\n\n" +
        "📄 Send a PDF file - Best option! Bypasses anti-bot protections\n" +
        "🔗 Send a URL - Direct link to blog post\n\n" +
        "Commands:\n" +
        "/read <url> - Parse a blog post URL\n" +
        "/help - Show detailed help\n\n" +
        "💡 Pro tip: Print any webpage to PDF and send it here!"
    );
  });

  // Command: /help
  bot.command("help", async (ctx) => {
    await ctx.reply(
      "🎧 How to use:\n\n" +
        "📄 Option 1: Send a PDF file\n" +
        "   - Print any webpage to PDF and send it\n" +
        "   - Bypasses anti-bot protections!\n\n" +
        "🔗 Option 2: Send a blog post URL\n" +
        "   - Send the URL directly\n" +
        "   - Or use: /read <url>\n\n" +
        "Then:\n" +
        "3. Open the web app and copy each chunk\n" +
        "4. Paste in ChatGPT app and listen!\n\n" +
        "Example URL:\n" +
        "/read https://blog.example.com/article"
    );
  });

  bot.command("me", async (ctx) => {
    await ctx.reply(
      "👤 Your update event: " + JSON.stringify(ctx.update, null, 2)
    );
  });

  // Handle PDF documents
  bot.on("message:document", async (ctx) => {
    const document = ctx.message.document;
    const fileName = document.file_name || "document.pdf";

    // Check if it's a PDF
    if (
      !fileName.toLowerCase().endsWith(".pdf") &&
      document.mime_type !== "application/pdf"
    ) {
      await ctx.reply(
        "❌ Please send a PDF file.\n\n" +
          "Supported: .pdf files only\n\n" +
          "💡 Tip: You can print any webpage to PDF and send it to bypass anti-bot protections!"
      );
      return;
    }

    // Send processing message
    const processingMsg = await ctx.reply(
      "🔄 Processing your PDF...\n\nThis may take a few moments."
    );

    try {
      console.log(`📄 Downloading PDF: ${fileName}`);

      // Get the file from Telegram
      const file = await ctx.api.getFile(document.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

      // Download the PDF
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error("Failed to download PDF from Telegram");
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log(
        `📖 Parsing PDF: ${fileName} (${(buffer.length / 1024).toFixed(
          2
        )} KB)`
      );

      // Parse the PDF
      const parsedContent = await parsePDF(buffer, fileName);
      console.log(
        `✅ Parsed: ${parsedContent.title} (${parsedContent.pageCount} pages, ${parsedContent.text.length} characters)`
      );

      // Generate a unique content ID
      const contentId = generateContentId();

      // Store the parsed content
      console.log(`💾 Storing content with ID: ${contentId}`);
      await storeContent(contentId, parsedContent);

      // Get the base URL for the web app
      const baseUrl = getAppBaseUrl();
      const readerUrl = `${baseUrl}/reader/${contentId}`.replace(
        /\s/g,
        ""
      ); // Remove any whitespace
      console.log(
        `🔗 Generated reader URL: "${readerUrl}" (length: ${readerUrl.length})`
      );

      // Send success message with the web app link
      const message = `✅ Done! Your PDF is ready.

📖 Title: ${parsedContent.title}
📄 Pages: ${parsedContent.pageCount}
📝 You can adjust chunk size in the web app

Open the web app to start listening:
${readerUrl}

Tap the link, adjust chunk size, copy each chunk, and paste in ChatGPT app to listen!`;

      await ctx.api.editMessageText(
        ctx.chat.id,
        processingMsg.message_id,
        message
      );

      console.log(`✨ Success! Sent link to user: ${readerUrl}`);
    } catch (error) {
      console.error("❌ Error processing PDF:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      await ctx.api.editMessageText(
        ctx.chat.id,
        processingMsg.message_id,
        "❌ Failed to process the PDF.\n\n" +
          `Error: ${errorMessage}\n\n` +
          "Please make sure:\n" +
          "- The file is a valid PDF\n" +
          "- The PDF contains readable text (not just images)\n" +
          "- The file is not too large (max ~20MB)"
      );
    }
  });

  // Command: /read <url> or direct URL message
  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text.trim();

    // Ignore if it's a command we've already handled
    if (text.startsWith("/start") || text.startsWith("/help")) {
      return;
    }

    // Extract URL from message
    let url = text;
    if (text.startsWith("/read ")) {
      url = text.substring(6).trim();
    }

    // Validate URL
    if (!isValidUrl(url)) {
      await ctx.reply(
        "❌ Please send a valid URL.\n\n" +
          "Example: https://blog.example.com/article\n\n" +
          "Or use: /read <url>"
      );
      return;
    }

    // Send processing message
    const processingMsg = await ctx.reply(
      "🔄 Processing your blog post...\n\nThis may take a few moments."
    );

    try {
      // Parse the blog post
      console.log(`📖 Parsing: ${url}`);
      const parsedContent = await parseBlogPost(url);
      console.log(
        `✅ Parsed: ${parsedContent.title} (${parsedContent.text.length} characters)`
      );

      // Generate a unique content ID
      const contentId = generateContentId();

      // Store the parsed content
      console.log(`💾 Storing content with ID: ${contentId}`);
      await storeContent(contentId, parsedContent);

      // Get the base URL for the web app
      const baseUrl = getAppBaseUrl();
      const readerUrl = `${baseUrl}/reader/${contentId}`.replace(
        /\s/g,
        ""
      ); // Remove any whitespace
      console.log(
        `🔗 Generated reader URL: "${readerUrl}" (length: ${readerUrl.length})`
      );

      // Send success message with the web app link
      const message = `✅ Done! Your blog post is ready.

📖 Title: ${parsedContent.title}
📝 You can adjust chunk size in the web app

Open the web app to start listening:
${readerUrl}

Tap the link, adjust chunk size, copy each chunk, and paste in ChatGPT app to listen!`;

      await ctx.api.editMessageText(
        ctx.chat.id,
        processingMsg.message_id,
        message
      );

      console.log(`✨ Success! Sent link to user: ${readerUrl}`);
    } catch (error) {
      console.error("❌ Error processing blog post:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      await ctx.api.editMessageText(
        ctx.chat.id,
        processingMsg.message_id,
        "❌ Failed to process the blog post.\n\n" +
          `Error: ${errorMessage}\n\n` +
          "Please make sure the URL is accessible and try again."
      );
    }
  });

  // Error handling
  bot.catch((err) => {
    console.error("❌ Bot error:", err);
  });
}
