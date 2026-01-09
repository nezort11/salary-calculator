import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { parsePDF } from "@/src/lib/pdf-parser";
import { generateContentId } from "@/src/lib/blog-parser";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let pdfBuffer: Buffer;
    let fileName: string;

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await req.formData();
      const file = formData.get("pdf") as File;

      if (!file) {
        return new Response(
          JSON.stringify({ error: "pdf_file_required" }),
          {
            status: 400,
            headers: { "content-type": "application/json" },
          }
        );
      }

      // Validate file type
      if (
        !file.name.toLowerCase().endsWith(".pdf") &&
        file.type !== "application/pdf"
      ) {
        return new Response(
          JSON.stringify({ error: "invalid_file_type" }),
          {
            status: 400,
            headers: { "content-type": "application/json" },
          }
        );
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
      fileName = file.name;
    } else if (contentType.includes("application/json")) {
      // Handle base64 encoded PDF
      const body = await req.json();
      const { pdf: pdfData, fileName: providedFileName } = body;

      if (!pdfData) {
        return new Response(
          JSON.stringify({ error: "pdf_data_required" }),
          {
            status: 400,
            headers: { "content-type": "application/json" },
          }
        );
      }

      // Decode base64 to buffer
      try {
        pdfBuffer = Buffer.from(pdfData, "base64");
        fileName = providedFileName || "uploaded.pdf";
      } catch {
        return new Response(JSON.stringify({ error: "invalid_base64" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
    } else {
      return new Response(
        JSON.stringify({ error: "unsupported_content_type" }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        }
      );
    }

    // Validate PDF buffer size (max 50MB)
    if (pdfBuffer.length > 50 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "file_too_large" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    console.log(
      `📄 Processing PDF: ${fileName} (${pdfBuffer.length} bytes)`
    );

    // Parse the PDF
    const parsedContent = await parsePDF(pdfBuffer, fileName);

    console.log(
      `✅ Parsed PDF: ${parsedContent.title} (${parsedContent.pageCount} pages, ${parsedContent.text.length} characters)`
    );

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
        pageCount: parsedContent.pageCount,
        textLength: parsedContent.text.length,
        url: blob.url,
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  } catch (e) {
    console.error("Parse PDF error:", e);
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
