import {
  storeContent,
  getAppBaseUrl,
  isValidUrl,
  setupBotHandlers,
} from "../src/lib/telegram-bot";
import fs from "fs";
import path from "path";

// Mock dependencies
jest.mock("@vercel/blob", () => ({
  put: jest.fn(),
}));

jest.mock("fs");
jest.mock("path");

const mockPut = require("@vercel/blob").put;
const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe("telegram-bot", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset environment
    delete (process.env as any).NODE_ENV;
    delete (process.env as any).NEXT_PUBLIC_APP_URL;

    // Setup default path mocks
    mockPath.join.mockImplementation((...args) => args.join("/"));
    mockPath.dirname.mockReturnValue("/mock/dir");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("storeContent", () => {
    const testData = { title: "Test", text: "Content" };
    const contentId = "test-content-id";

    describe("development mode", () => {
      beforeEach(() => {
        (process.env as any).NODE_ENV = "development";
      });

      it("should store content locally in development", async () => {
        mockFs.existsSync.mockReturnValue(false);
        mockFs.mkdirSync.mockImplementation();
        mockFs.writeFileSync.mockImplementation();

        await storeContent(contentId, testData);

        expect(mockFs.existsSync).toHaveBeenCalledWith(
          expect.stringContaining("reader")
        );
        expect(mockFs.mkdirSync).toHaveBeenCalledWith(
          expect.stringContaining("reader"),
          { recursive: true }
        );
        expect(mockFs.writeFileSync).toHaveBeenCalledWith(
          expect.stringContaining(`${contentId}.json`),
          JSON.stringify(testData),
          "utf-8"
        );
      });

      it("should not create directory if it already exists", async () => {
        mockFs.existsSync.mockReturnValue(true);
        mockFs.writeFileSync.mockImplementation();

        await storeContent(contentId, testData);

        expect(mockFs.mkdirSync).not.toHaveBeenCalled();
        expect(mockFs.writeFileSync).toHaveBeenCalledWith(
          expect.stringContaining(`${contentId}.json`),
          JSON.stringify(testData),
          "utf-8"
        );
      });
    });

    describe("production mode", () => {
      beforeEach(() => {
        (process.env as any).NODE_ENV = "production";
        mockPut.mockResolvedValue({ url: "https://blob.example.com/test" });
      });

      it("should store content in Vercel Blob in production", async () => {
        await storeContent(contentId, testData);

        expect(mockPut).toHaveBeenCalledWith(
          `reader/${contentId}.json`,
          JSON.stringify(testData),
          {
            access: "public",
            addRandomSuffix: false,
          }
        );
      });

      it("should handle Vercel Blob errors", async () => {
        const error = new Error("Blob storage failed");
        mockPut.mockRejectedValue(error);

        await expect(storeContent(contentId, testData)).rejects.toThrow(
          "Blob storage failed"
        );
      });
    });
  });

  describe("getAppBaseUrl", () => {
    it("should return environment URL when set", () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://custom-domain.com";

      const url = getAppBaseUrl();

      expect(url).toBe("https://custom-domain.com");
    });

    it("should trim whitespace from environment URL", () => {
      process.env.NEXT_PUBLIC_APP_URL = "  https://custom-domain.com  ";

      const url = getAppBaseUrl();

      expect(url).toBe("https://custom-domain.com");
    });

    it("should return production fallback when NODE_ENV is production", () => {
      (process.env as any).NODE_ENV = "production";

      const url = getAppBaseUrl();

      expect(url).toBe("https://salary-calculator-gray.vercel.app");
    });

    it("should return development fallback for other environments", () => {
      (process.env as any).NODE_ENV = "development";

      const url = getAppBaseUrl();

      expect(url).toBe("http://localhost:3000");
    });

    it("should return development fallback when NODE_ENV is not set", () => {
      const url = getAppBaseUrl();

      expect(url).toBe("http://localhost:3000");
    });
  });

  describe("isValidUrl", () => {
    it("should return true for valid HTTP URLs", () => {
      expect(isValidUrl("http://example.com")).toBe(true);
      expect(isValidUrl("https://example.com")).toBe(true);
      expect(isValidUrl("http://example.com/path")).toBe(true);
      expect(isValidUrl("https://example.com/path?query=value")).toBe(true);
    });

    it("should return false for invalid URLs", () => {
      expect(isValidUrl("not-a-url")).toBe(false);
      expect(isValidUrl("")).toBe(false);
      expect(isValidUrl("ftp://example.com")).toBe(false);
      expect(isValidUrl("file:///path")).toBe(false);
    });

    it("should return false for malformed URLs", () => {
      expect(isValidUrl("http://")).toBe(false);
      expect(isValidUrl("https://")).toBe(false);
      expect(isValidUrl("://example.com")).toBe(false);
    });

    it("should handle URLs with special characters", () => {
      expect(isValidUrl("https://example.com/path%20encoded")).toBe(true);
      // URLs with unencoded spaces are invalid
      expect(isValidUrl("https://example.com/path with spaces")).toBe(false);
    });
  });

  describe("setupBotHandlers", () => {
    let mockBot: any;
    let mockCtx: any;

    beforeEach(() => {
      mockBot = {
        command: jest.fn(),
        on: jest.fn(),
        catch: jest.fn(),
      };

      mockCtx = {
        reply: jest.fn().mockResolvedValue(undefined),
      };
    });

    it("should set up all required command handlers", () => {
      setupBotHandlers(mockBot, "test-token");

      expect(mockBot.command).toHaveBeenCalledWith("start", expect.any(Function));
      expect(mockBot.command).toHaveBeenCalledWith("help", expect.any(Function));
      expect(mockBot.command).toHaveBeenCalledWith("me", expect.any(Function));
      expect(mockBot.on).toHaveBeenCalledWith("message:document", expect.any(Function));
      expect(mockBot.on).toHaveBeenCalledWith("message:text", expect.any(Function));
      expect(mockBot.catch).toHaveBeenCalledWith(expect.any(Function));
    });

    describe("start command", () => {
      it("should send welcome message", async () => {
        setupBotHandlers(mockBot, "test-token");

        // Get the start command handler
        const startHandler = mockBot.command.mock.calls.find(
          (call: any) => call[0] === "start"
        )[1];

        await startHandler(mockCtx);

        expect(mockCtx.reply).toHaveBeenCalledWith(
          expect.stringContaining("👋 Welcome to the Blog Reader Bot!")
        );
        expect(mockCtx.reply).toHaveBeenCalledWith(
          expect.stringContaining("Commands:")
        );
        expect(mockCtx.reply).toHaveBeenCalledWith(
          expect.stringContaining("/read <url>")
        );
        expect(mockCtx.reply).toHaveBeenCalledWith(
          expect.stringContaining("/help")
        );
      });
    });

    describe("help command", () => {
      it("should send help message", async () => {
        setupBotHandlers(mockBot, "test-token");

        const helpHandler = mockBot.command.mock.calls.find(
          (call: any) => call[0] === "help"
        )[1];

        await helpHandler(mockCtx);

        expect(mockCtx.reply).toHaveBeenCalledWith(
          expect.stringContaining("🎧 How to use:")
        );
        expect(mockCtx.reply).toHaveBeenCalledWith(
          expect.stringContaining("Option 1: Send a PDF file")
        );
        expect(mockCtx.reply).toHaveBeenCalledWith(
          expect.stringContaining("Option 2: Send a blog post URL")
        );
      });
    });

    describe("me command", () => {
      it("should send context update info", async () => {
        const mockUpdate = { update_id: 123, message: { text: "/me" } };
        mockCtx.update = mockUpdate;

        setupBotHandlers(mockBot, "test-token");

        const meHandler = mockBot.command.mock.calls.find(
          (call: any) => call[0] === "me"
        )[1];

        await meHandler(mockCtx);

        expect(mockCtx.reply).toHaveBeenCalledWith(
          "👤 Your update event: " + JSON.stringify(mockUpdate, null, 2)
        );
      });
    });

    describe("document message handler", () => {
      let documentHandler: Function;

      beforeEach(() => {
        setupBotHandlers(mockBot, "test-token");
        documentHandler = mockBot.on.mock.calls.find(
          (call: any) => call[0] === "message:document"
        )[1];
      });

      it("should reject non-PDF files", async () => {
        const mockDocument = {
          file_name: "document.txt",
          mime_type: "text/plain",
          file_id: "file123",
        };

        mockCtx.message = { document: mockDocument };

        await documentHandler(mockCtx);

        expect(mockCtx.reply).toHaveBeenCalledWith(
          expect.stringContaining("❌ Please send a PDF file")
        );
      });

      it("should accept PDF files by extension", async () => {
        const mockDocument = {
          file_name: "document.pdf",
          mime_type: "application/pdf",
          file_id: "file123",
        };

        mockCtx.message = { document: mockDocument };
        mockCtx.chat = { id: 12345 };
        mockCtx.api = {
          getFile: jest.fn().mockResolvedValue({ file_path: "documents/file.pdf" }),
          editMessageText: jest.fn().mockResolvedValue(undefined),
        };

        // Mock the processing message reply
        mockCtx.reply.mockResolvedValue({ message_id: 999 });

        // Mock the processing to avoid full implementation
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          arrayBuffer: async () => Buffer.from("pdf content"),
        });

        // We'll need to mock parsePDF and other functions for full testing
        jest.doMock("../src/lib/pdf-parser", () => ({
          parsePDF: jest.fn().mockResolvedValue({
            title: "Test PDF",
            text: "PDF content",
            pageCount: 1,
          }),
        }));

        await documentHandler(mockCtx);

        // Should not reject the file
        expect(mockCtx.reply).not.toHaveBeenCalledWith(
          expect.stringContaining("❌ Please send a PDF file")
        );
      });
    });

    describe("error handling", () => {
      it("should set up error handler", () => {
        setupBotHandlers(mockBot, "test-token");

        expect(mockBot.catch).toHaveBeenCalledWith(expect.any(Function));
      });
    });
  });
});
