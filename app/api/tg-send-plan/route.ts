import { NextRequest } from "next/server";
import { Bot, InputFile } from "grammy";

export const runtime = "nodejs";

type SendPlanRequest = {
  initData: string; // tg init data from Mini App
  fileName: string; // suggested file name, e.g. "План чтения ....pdf"
  fileDataUrl: string; // data URL of the PDF (data:application/pdf;base64,....)
};

// Simple HMAC verification for initData using Telegram Bot Token per TMA docs
// Spec: https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
// NOTE: Edge runtime has no crypto.subtle HMAC-SHA256 for Node-style; use Web Crypto
async function verifyInitData(
  initData: string,
  botToken: string
): Promise<{
  ok: boolean;
  userId?: number;
}> {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    if (!hash) return { ok: false };

    // Build data_check_string
    const pairs: string[] = [];
    urlParams.forEach((value, key) => {
      if (key === "hash") return;
      pairs.push(`${key}=${value}`);
    });
    pairs.sort();
    const dataCheckString = pairs.join("\n");

    const encoder = new TextEncoder();
    const secretKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode("WebAppData"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const secret = await crypto.subtle.sign(
      "HMAC",
      secretKey,
      encoder.encode(botToken)
    );
    const hmacKey = await crypto.subtle.importKey(
      "raw",
      secret,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      hmacKey,
      encoder.encode(dataCheckString)
    );

    const calcHash = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (calcHash !== hash) return { ok: false };

    // Optional: enforce auth_date freshness (<= 1 day)
    const authDateStr = urlParams.get("auth_date");
    if (authDateStr) {
      const authDate = Number(authDateStr) * 1000;
      const ageMs = Date.now() - authDate;
      // Accept only if initData is not older than 10 minutes
      if (isNaN(authDate) || ageMs > 10 * 60 * 1000) {
        return { ok: false };
      }
    }

    // Extract user id from user payload
    const userRaw = urlParams.get("user");
    if (!userRaw) return { ok: false };
    const user = JSON.parse(userRaw) as { id: number };
    if (!user?.id) return { ok: false };

    return { ok: true, userId: user.id };
  } catch {
    return { ok: false };
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ error: "missing_token" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    const body = (await req.json()) as SendPlanRequest;
    const { initData, fileName, fileDataUrl } = body || {};
    if (!initData || !fileName || !fileDataUrl) {
      return new Response(JSON.stringify({ error: "bad_request" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const verification = await verifyInitData(initData, token);
    if (!verification.ok || !verification.userId) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    const userId = verification.userId;
    const bot = new Bot(token);

    // Decode Data URL to a Blob
    const match = /^data:application\/pdf(?:;[^,]*)?;base64,(.+)$/i.exec(
      fileDataUrl
    );
    if (!match) {
      return new Response(JSON.stringify({ error: "invalid_file" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    const pdfBytes = Uint8Array.from(atob(match[1]), (c) =>
      c.charCodeAt(0)
    );
    const inputFile = new InputFile(pdfBytes, fileName);

    // Send as document to the user who opened the Mini App
    // We avoid allowing arbitrary chat ids to prevent abuse
    await bot.api.sendDocument(userId, inputFile, {
      caption: "Ваш план чтения",
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "send_failed" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
