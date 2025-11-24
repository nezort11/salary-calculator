import { ContentChunk } from "./blog-parser";

// Lazy load pdf-parse to avoid build-time errors
let pdfParse: any = null;
async function loadPdfParse() {
  if (!pdfParse) {
    pdfParse = require("pdf-parse");
  }
  return pdfParse;
}

export interface ParsedPDFContent {
  title: string;
  text: string; // Store raw text for client-side chunking
  pageCount: number;
}

/**
 * Parses a PDF buffer and creates chunks
 * @param buffer PDF file buffer
 * @param sentencesPerChunk Number of sentences per chunk (default: 15)
 * @param fileName Original filename (used for title)
 * @returns Parsed content with chunks
 */
export async function parsePDF(
  buffer: Buffer,
  sentencesPerChunk: number = 15,
  fileName?: string
): Promise<ParsedPDFContent> {
  try {
    // Load pdf-parse dynamically
    const parse = await loadPdfParse();

    // Parse the PDF (pdf-parse v1 API)
    const result = await parse(buffer);

    // Extract metadata
    const title = extractTitle(result, fileName);
    const pageCount = result.numpages;

    // Get the text content
    let text = result.text;

    // Clean up the text
    text = cleanPDFText(text);

    // Return raw text for client-side chunking
    return {
      title,
      text,
      pageCount,
    };
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error(
      `Failed to parse PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Extracts title from PDF metadata or filename
 */
function extractTitle(data: any, fileName?: string): string {
  // Try to get title from PDF metadata
  if (data.info?.Title && data.info.Title.trim().length > 0) {
    return data.info.Title.trim();
  }

  // Fall back to filename
  if (fileName) {
    // Remove .pdf extension and clean up
    return fileName
      .replace(/\.pdf$/i, "")
      .replace(/[-_]/g, " ")
      .trim();
  }

  // Default title
  return "PDF Document";
}

/**
 * Cleans up PDF text (removes excessive whitespace, page numbers, etc.)
 */
function cleanPDFText(text: string): string {
  // Replace multiple newlines with double newline
  text = text.replace(/\n{3,}/g, "\n\n");

  // Replace multiple spaces with single space
  text = text.replace(/[ \t]{2,}/g, " ");

  // Remove common PDF artifacts
  // - Isolated numbers (often page numbers)
  text = text.replace(/^\d+$/gm, "");

  // Remove lines with only special characters
  text = text.replace(/^[^\w\s]+$/gm, "");

  // Normalize whitespace around punctuation
  text = text.replace(/\s+([.,!?;:])/g, "$1");

  // Remove hyphenation at line breaks
  text = text.replace(/-\n/g, "");

  // Normalize line breaks
  text = text.replace(/\n\s*\n/g, "\n\n");

  // Trim each line
  text = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return text.trim();
}

/**
 * Splits text into sentences
 */
function splitIntoSentences(text: string): string[] {
  const sentences: string[] = [];
  const paragraphs = text.split(/\n\n+/);

  for (const paragraph of paragraphs) {
    if (paragraph.trim().length === 0) continue;

    // Split by sentence-ending punctuation
    const paragraphSentences = paragraph
      .split(/([.!?]+)\s+/)
      .reduce((acc: string[], part, idx, arr) => {
        if (idx % 2 === 0) {
          // Text part
          const nextPart = arr[idx + 1] || "";
          const sentence = (part + nextPart).trim();
          if (sentence.length > 0) {
            acc.push(sentence);
          }
        }
        return acc;
      }, []);

    sentences.push(...paragraphSentences);
  }

  return sentences.filter((s) => s.length > 0);
}
