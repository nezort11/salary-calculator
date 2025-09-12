import { NextRequest } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const contentType =
      req.headers.get("content-type") || "application/octet-stream";
    const rawFilename =
      req.headers.get("x-filename") || `plan-${Date.now()}.pdf`;
    const filename = (() => {
      try {
        return decodeURIComponent(rawFilename);
      } catch {
        return rawFilename;
      }
    })();
    const access = (req.headers.get("x-access") as "public") || "public";
    const cacheControlMaxAge = parseInt(
      req.headers.get("x-ttl") || "600",
      10
    );

    // Build an ASCII-only, URL-safe pathname to avoid percent-encoded filenames in links
    const base = filename.replace(/\.[^/.]+$/, "");
    const asciiBase =
      base
        .normalize("NFKD")
        .replace(/[^\w\-\s]+/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase() || `plan-${Date.now()}`;
    const pathname = `plans/${asciiBase}.pdf`;

    const arrayBuffer = await req.arrayBuffer();
    const body = new Blob([arrayBuffer], { type: contentType });
    const blob = await put(pathname, body, {
      access,
      contentType,
      cacheControlMaxAge,
      allowOverwrite: true,
    });

    return new Response(
      JSON.stringify({ url: blob.url, downloadUrl: blob.downloadUrl }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "upload_failed" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
