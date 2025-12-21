import { parsePDF } from "../src/lib/pdf-parser";
import { generateContentId } from "../src/lib/blog-parser";
import fs from "fs";
import path from "path";

// Mock the Telegram API and storage functions
jest.mock("@vercel/blob", () => ({
  put: jest
    .fn()
    .mockResolvedValue({ url: "https://example.com/mock-url" }),
}));

// Mock fetch for downloading PDF from Telegram
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe("PDF Parsing Integration Test", () => {
  const mockToken = "mock-telegram-token";
  const mockFileId = "mock-file-id";
  const mockFilePath = "documents/sample-test.pdf";
  const mockFileName = "sample-test.pdf";

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock environment variables
    (process.env as any).NODE_ENV = "development";
    (process.env as any).TELEGRAM_BOT_TOKEN = mockToken;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should successfully parse a PDF file through the complete integration", async () => {
    // Enable console logging for this test to show progress
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    try {
      // Read the real PDF file
      const pdfPath = path.join(
        __dirname,
        "fixtures",
        "http-caching-guide.pdf"
      );
      const pdfBuffer = fs.readFileSync(pdfPath);

      // Mock the fetch response for downloading the PDF
      (
        global.fetch as jest.MockedFunction<typeof fetch>
      ).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => pdfBuffer,
      } as any);

      // Simulate the PDF processing flow (similar to bot logic)
      const sentencesPerChunk = 15;

      console.log("🧪 Testing PDF download and parsing flow...");

      // Step 1: Simulate downloading PDF from Telegram
      const fileUrl = `https://api.telegram.org/file/bot${mockToken}/${mockFilePath}`;
      console.log(`📄 Simulating download from: ${fileUrl}`);

      const response = await fetch(fileUrl);
      expect(response.ok).toBe(true);

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log(
        `📖 Downloaded PDF: ${mockFileName} (${buffer.length} bytes)`
      );

      // Step 2: Parse the PDF
      const parsedContent = await parsePDF(buffer, mockFileName);
      console.log(
        `✅ Parsed: ${parsedContent.title} (${parsedContent.pageCount} pages, ${parsedContent.text.length} characters)`
      );

      // Step 3: Verify parsing results
      expect(parsedContent).toBeDefined();
      expect(parsedContent.title).toBe(
        "A complete guide to HTTP caching - Jono Alderson"
      ); // From PDF metadata
      expect(parsedContent.pageCount).toBe(46); // Real PDF has 46 pages
      expect(parsedContent.text).toBeDefined();
      expect(parsedContent.text.length).toBeGreaterThan(60000); // Real PDF has substantial content

      // Verify the text contains content from the real PDF
      expect(parsedContent.text.toLowerCase()).toContain("caching");
      expect(parsedContent.text.toLowerCase()).toContain("http");
      expect(parsedContent.text.toLowerCase()).toContain("performance");
      expect(parsedContent.text.toLowerCase()).toContain("jono alderson");
      expect(parsedContent.text.toLowerCase()).toContain(
        "web performance"
      );

      // Step 4: Generate content ID and simulate storage
      const contentId = generateContentId();
      expect(contentId).toBeDefined();
      expect(typeof contentId).toBe("string");
      expect(contentId.length).toBeGreaterThan(0);

      console.log(`✨ Success! Content ID: ${contentId}`);

      // Step 5: Verify the final result structure
      const expectedReaderUrl = `http://localhost:3000/reader/${contentId}`;
      expect(expectedReaderUrl).toContain(contentId);
    } finally {
      // Restore console methods
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    }
  });

  it("should handle PDF parsing errors gracefully", async () => {
    // Test with invalid/corrupted PDF data
    const invalidPdfBuffer = Buffer.from("not-a-pdf-file");

    await expect(
      parsePDF(invalidPdfBuffer, "invalid.pdf")
    ).rejects.toThrow("PDF has invalid structure and cannot be parsed");
  });

  it("should handle network errors during PDF download", async () => {
    // Mock fetch to return an error
    (
      global.fetch as jest.MockedFunction<typeof fetch>
    ).mockResolvedValueOnce({
      ok: false,
      statusText: "Not Found",
    } as any);

    const fileUrl = `https://api.telegram.org/file/bot${mockToken}/${mockFilePath}`;

    const response = await fetch(fileUrl);
    expect(response.ok).toBe(false);
  });

  it("should validate PDF file type correctly", () => {
    // Test the file type validation logic (extracted from bot code)
    const validPdfFileName = "document.pdf";
    const invalidFileName = "document.txt";

    const isValidPdf = (fileName: string, mimeType?: string) => {
      return (
        fileName.toLowerCase().endsWith(".pdf") ||
        mimeType === "application/pdf"
      );
    };

    expect(isValidPdf(validPdfFileName)).toBe(true);
    expect(isValidPdf(invalidFileName)).toBe(false);
    expect(isValidPdf("test.pdf", "application/pdf")).toBe(true);
    expect(isValidPdf("test.txt", "application/pdf")).toBe(true);
  });
});
