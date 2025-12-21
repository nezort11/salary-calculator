import { parsePDF, ParsedPDFContent } from "../src/lib/pdf-parser";

const mockPdfExtract = require("pdf-extraction").default;

describe("pdf-parser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("parsePDF", () => {
    const validPdfBuffer = Buffer.from("%PDF-1.4 test content");
    const mockPdfData = {
      text: "Extracted PDF text content",
      numpages: 5,
      info: {
        Title: "Sample PDF Document",
      },
    };

    beforeEach(() => {
      mockPdfExtract.mockResolvedValue(mockPdfData);
    });

    it("should parse PDF successfully and return correct structure", async () => {
      const result = await parsePDF(validPdfBuffer, "test.pdf");

      expect(result).toBeDefined();
      expect(result.title).toBe("Sample PDF Document");
      expect(result.text).toBe("Extracted PDF text content");
      expect(result.pageCount).toBe(5);
      expect(typeof result).toBe("object");
    });

    it("should handle PDF without filename", async () => {
      const result = await parsePDF(validPdfBuffer);

      expect(result.title).toBe("Sample PDF Document");
    });

    it("should suppress console warnings and errors during parsing", async () => {
      const originalWarn = console.warn;
      const originalError = console.error;

      await parsePDF(validPdfBuffer, "test.pdf");

      // Console methods should be restored to their original state
      expect(console.warn).toBe(originalWarn);
      expect(console.error).toBe(originalError);
    });

    it("should restore console methods even if parsing fails", async () => {
      const originalWarn = console.warn;
      const originalError = console.error;

      mockPdfExtract.mockRejectedValue(new Error("Parse failed"));

      await expect(parsePDF(validPdfBuffer, "test.pdf")).rejects.toThrow();

      // Console methods should be restored even after failure
      expect(console.warn).toBe(originalWarn);
      expect(console.error).toBe(originalError);
    });

    it("should handle PDF parsing errors with specific error messages", async () => {
      mockPdfExtract.mockRejectedValue(new Error("PDF has invalid structure"));

      await expect(parsePDF(validPdfBuffer, "test.pdf")).rejects.toThrow(
        "PDF has invalid structure and cannot be parsed: PDF has invalid structure"
      );
    });

    it("should handle generic PDF parsing errors", async () => {
      mockPdfExtract.mockRejectedValue(new Error("Unknown parsing error"));

      await expect(parsePDF(validPdfBuffer, "test.pdf")).rejects.toThrow(
        "Failed to parse PDF: Unknown parsing error"
      );
    });

    it("should handle non-Error exceptions", async () => {
      mockPdfExtract.mockRejectedValue("String error");

      await expect(parsePDF(validPdfBuffer, "test.pdf")).rejects.toThrow(
        "Failed to parse PDF: Unknown error"
      );
    });
  });

  describe("extractTitle", () => {
    // We need to access the private function, so we'll test it through the public API
    it("should extract title from PDF info metadata", async () => {
      const mockData = {
        info: {
          Title: "Document Title from Info",
        },
        metadata: {
          Title: "Document Title from Metadata",
        },
        numpages: 1,
        text: "content",
      };

      mockPdfExtract.mockResolvedValue(mockData);

      const result = await parsePDF(Buffer.from("pdf"), "test.pdf");

      expect(result.title).toBe("Document Title from Info");
    });

    it("should extract title from PDF metadata when info is not available", async () => {
      const mockData = {
        info: {},
        metadata: {
          Title: "Document Title from Metadata",
        },
        numpages: 1,
        text: "content",
      };

      mockPdfExtract.mockResolvedValue(mockData);

      const result = await parsePDF(Buffer.from("pdf"), "test.pdf");

      expect(result.title).toBe("Document Title from Metadata");
    });

    it("should fall back to filename when no metadata title", async () => {
      const mockData = {
        info: {},
        metadata: {},
        numpages: 1,
        text: "content",
      };

      mockPdfExtract.mockResolvedValue(mockData);

      const result = await parsePDF(Buffer.from("pdf"), "my-document.pdf");

      expect(result.title).toBe("my document");
    });

    it("should clean filename by removing extension and replacing separators", async () => {
      const mockData = {
        info: {},
        metadata: {},
        numpages: 1,
        text: "content",
      };

      mockPdfExtract.mockResolvedValue(mockData);

      const result = await parsePDF(Buffer.from("pdf"), "My_Awesome-Document.pdf");

      expect(result.title).toBe("My Awesome Document");
    });

    it("should use default title when no filename provided", async () => {
      const mockData = {
        info: {},
        metadata: {},
        numpages: 1,
        text: "content",
      };

      mockPdfExtract.mockResolvedValue(mockData);

      const result = await parsePDF(Buffer.from("pdf"));

      expect(result.title).toBe("PDF Document");
    });

    it("should trim whitespace from titles", async () => {
      const mockData = {
        info: {
          Title: "  Document Title with Spaces  ",
        },
        numpages: 1,
        text: "content",
      };

      mockPdfExtract.mockResolvedValue(mockData);

      const result = await parsePDF(Buffer.from("pdf"), "test.pdf");

      expect(result.title).toBe("Document Title with Spaces");
    });
  });

  describe("cleanPDFText", () => {
    // Test the text cleaning through the public API
    it("should clean up excessive whitespace", async () => {
      const mockData = {
        info: { Title: "Test" },
        numpages: 1,
        text: "Line one.\n\n\n\n\nLine two.\n\n\nLine three.",
      };

      mockPdfExtract.mockResolvedValue(mockData);

      const result = await parsePDF(Buffer.from("pdf"), "test.pdf");

      expect(result.text).toBe("Line one.\nLine two.\nLine three.");
    });

    it("should replace multiple spaces with single space", async () => {
      const mockData = {
        info: { Title: "Test" },
        numpages: 1,
        text: "Text  with    multiple    spaces.",
      };

      mockPdfExtract.mockResolvedValue(mockData);

      const result = await parsePDF(Buffer.from("pdf"), "test.pdf");

      expect(result.text).toBe("Text with multiple spaces.");
    });

    it("should remove isolated numbers (page numbers)", async () => {
      const mockData = {
        info: { Title: "Test" },
        numpages: 1,
        text: "Page content here.\n1\nMore content.\n2\nFinal content.",
      };

      mockPdfExtract.mockResolvedValue(mockData);

      const result = await parsePDF(Buffer.from("pdf"), "test.pdf");

      expect(result.text).toBe("Page content here.\nMore content.\nFinal content.");
    });

    it("should remove lines with only special characters", async () => {
      const mockData = {
        info: { Title: "Test" },
        numpages: 1,
        text: "Valid content.\n---\nMore content.\n****\nFinal content.",
      };

      mockPdfExtract.mockResolvedValue(mockData);

      const result = await parsePDF(Buffer.from("pdf"), "test.pdf");

      expect(result.text).toBe("Valid content.\nMore content.\nFinal content.");
    });

    it("should normalize whitespace around punctuation", async () => {
      const mockData = {
        info: { Title: "Test" },
        numpages: 1,
        text: "Word , with spaces . around ! punctuation ?",
      };

      mockPdfExtract.mockResolvedValue(mockData);

      const result = await parsePDF(Buffer.from("pdf"), "test.pdf");

      expect(result.text).toBe("Word, with spaces. around! punctuation?");
    });

    it("should remove hyphenation at line breaks", async () => {
      const mockData = {
        info: { Title: "Test" },
        numpages: 1,
        text: "This is a hy-\nphenated word.\nAnother line.",
      };

      mockPdfExtract.mockResolvedValue(mockData);

      const result = await parsePDF(Buffer.from("pdf"), "test.pdf");

      expect(result.text).toBe("This is a hyphenated word.\nAnother line.");
    });

    it("should normalize line breaks", async () => {
      const mockData = {
        info: { Title: "Test" },
        numpages: 1,
        text: "Line one.\n \n \nLine two.",
      };

      mockPdfExtract.mockResolvedValue(mockData);

      const result = await parsePDF(Buffer.from("pdf"), "test.pdf");

      expect(result.text).toBe("Line one.\nLine two.");
    });

    it("should trim each line", async () => {
      const mockData = {
        info: { Title: "Test" },
        numpages: 1,
        text: "  Line one.  \n  Line two.  \n  Line three.  ",
      };

      mockPdfExtract.mockResolvedValue(mockData);

      const result = await parsePDF(Buffer.from("pdf"), "test.pdf");

      expect(result.text).toBe("Line one.\nLine two.\nLine three.");
    });

    it("should trim the final result", async () => {
      const mockData = {
        info: { Title: "Test" },
        numpages: 1,
        text: "\n\n\nContent here.\n\n\n",
      };

      mockPdfExtract.mockResolvedValue(mockData);

      const result = await parsePDF(Buffer.from("pdf"), "test.pdf");

      expect(result.text).toBe("Content here.");
    });

    it("should handle empty text", async () => {
      const mockData = {
        info: { Title: "Test" },
        numpages: 1,
        text: "",
      };

      mockPdfExtract.mockResolvedValue(mockData);

      const result = await parsePDF(Buffer.from("pdf"), "test.pdf");

      expect(result.text).toBe("");
    });

    it("should preserve intentional formatting", async () => {
      const mockData = {
        info: { Title: "Test" },
        numpages: 1,
        text: "Paragraph one.\n\nParagraph two.\n\nParagraph three.",
      };

      mockPdfExtract.mockResolvedValue(mockData);

      const result = await parsePDF(Buffer.from("pdf"), "test.pdf");

      expect(result.text).toBe("Paragraph one.\nParagraph two.\nParagraph three.");
    });
  });
});
