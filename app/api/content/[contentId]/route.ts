import { NextRequest } from "next/server";
import { head } from "@vercel/blob";
import * as fs from "fs";
import * as path from "path";

export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60 seconds

export async function GET(
  req: NextRequest,
  { params }: { params: { contentId: string } }
) {
  try {
    const contentId = params.contentId;

    if (!contentId) {
      return new Response(
        JSON.stringify({ error: "Content ID required" }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        }
      );
    }

    console.log(`Fetching content for ID: ${contentId}`);

    const isDev = process.env.NODE_ENV !== "production";

    if (isDev) {
      // Read from local storage in development
      const localFilePath = path.join(
        process.cwd(),
        ".local-storage",
        "reader",
        `${contentId}.json`
      );

      console.log(`Reading from local file: ${localFilePath}`);

      if (!fs.existsSync(localFilePath)) {
        console.log(`Local file not found: ${localFilePath}`);
        return new Response(
          JSON.stringify({ error: "Content not found" }),
          {
            status: 404,
            headers: { "content-type": "application/json" },
          }
        );
      }

      const content = JSON.parse(fs.readFileSync(localFilePath, "utf-8"));
      console.log(
        `Successfully fetched content from local file. Has text: ${!!content.text}, Text length: ${
          content.text?.length || 0
        }`
      );

      return new Response(JSON.stringify(content), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-cache", // Don't cache in dev
        },
      });
    } else {
      // Use Vercel Blob in production
      const pathname = `reader/${contentId}.json`;
      console.log(`Looking for blob at pathname: ${pathname}`);

      try {
        // Use head() to get the blob metadata and download URL
        const blobDetails = await head(pathname);
        console.log(
          `Found blob. URL: ${blobDetails.url}, Size: ${blobDetails.size} bytes`
        );

        // Fetch the actual content from the blob's download URL
        console.log(`Downloading blob content...`);
        const response = await fetch(blobDetails.downloadUrl);

        if (!response.ok) {
          throw new Error(
            `Failed to download blob: ${response.status} ${response.statusText}`
          );
        }

        const content = await response.json();
        console.log(
          `Successfully fetched content. Has text: ${!!content.text}, Text length: ${
            content.text?.length || 0
          }`
        );

        return new Response(JSON.stringify(content), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "cache-control": "public, max-age=31536000", // Cache for 1 year
          },
        });
      } catch (blobError: any) {
        // If blob doesn't exist, head() will throw an error
        if (
          blobError.message?.includes("not found") ||
          blobError.message?.includes("BlobNotFoundError")
        ) {
          console.log(`Blob not found: ${pathname}`);
          return new Response(
            JSON.stringify({ error: "Content not found" }),
            {
              status: 404,
              headers: { "content-type": "application/json" },
            }
          );
        }
        throw blobError;
      }
    }
  } catch (error) {
    console.error("Error fetching content:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch content",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }
}
