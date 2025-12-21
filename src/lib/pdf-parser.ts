// Lazy load pdf-extraction
let pdfExtract: any = null;
async function loadPdfExtract() {
  if (!pdfExtract) {
    const pdfExtractModule = await import("pdf-extraction");
    pdfExtract = pdfExtractModule.default;
  }
  return pdfExtract;
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
  fileName?: string
): Promise<ParsedPDFContent> {
  // Suppress console warnings/errors during PDF parsing to avoid noisy logs
  // The pdf-extraction library can be verbose about PDF structural issues
  const originalWarn = console.warn;
  const originalError = console.error;
  console.warn = () => {}; // Suppress warnings
  console.error = () => {}; // Suppress errors

  try {
    // Load pdf-extraction dynamically
    const extractPdf = await loadPdfExtract();

    // Parse the PDF
    const result = await extractPdf(buffer);

    // Extract metadata
    const title = extractTitle(result, fileName);
    const pageCount = result.numpages || 0;

    // Get the text content (pdf-extraction returns text directly)
    let text = result.text || "";

    // Clean up the text
    text = cleanPDFText(text);

    // Return raw text for client-side chunking
    return {
      title,
      text,
      pageCount,
    };
  } catch (error) {
    // Restore console methods before handling errors
    console.warn = originalWarn;
    console.error = originalError;

    // pdf-parse throws various errors for invalid PDFs
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('invalid') || errorMessage.includes('corrupt') ||
          errorMessage.includes('malformed') || errorMessage.includes('pdf')) {
        throw new Error(`PDF has invalid structure and cannot be parsed: ${error.message}`);
      }
    }

    throw new Error(
      `Failed to parse PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    // Always restore console methods
    console.warn = originalWarn;
    console.error = originalError;
  }
}

/**
 * Extracts title from PDF metadata or filename
 */
function extractTitle(data: any, fileName?: string): string {
  // Try to get title from PDF metadata (pdf-parse structure)
  if (data.info?.Title && data.info.Title.trim().length > 0) {
    return data.info.Title.trim();
  }

  // Try to get title from metadata object if it exists
  if (data.metadata?.Title && data.metadata.Title.trim().length > 0) {
    return data.metadata.Title.trim();
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
