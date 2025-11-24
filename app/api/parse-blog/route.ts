import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import {
  parseBlogPost,
  generateContentId,
  ParsedContent,
} from "@/src/lib/blog-parser";

export const runtime = "nodejs";

type ParseBlogRequest = {
  url: string;
  sentencesPerChunk?: number;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ParseBlogRequest;
    const { url, sentencesPerChunk = 15 } = body || {};

    if (!url) {
      return new Response(JSON.stringify({ error: "url_required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: "invalid_url" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Parse the blog post
    const parsedContent = await parseBlogPost(url, sentencesPerChunk);

    // Generate a unique content ID
    const contentId = generateContentId();

    // Store the parsed content in Vercel Blob
    const blob = await put(
      `reader/${contentId}.json`,
      JSON.stringify(parsedContent),
      {
        access: "public",
        addRandomSuffix: false,
      }
    );

    // Return the content ID and metadata
    return new Response(
      JSON.stringify({
        ok: true,
        contentId,
        title: parsedContent.title,
        totalChunks: parsedContent.totalChunks,
        url: blob.url,
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  } catch (e) {
    console.error("Parse blog error:", e);
    const errorMessage = e instanceof Error ? e.message : "parse_failed";
    return new Response(
      JSON.stringify({ error: "parse_failed", details: errorMessage }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }
}
