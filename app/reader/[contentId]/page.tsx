"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Loader2 } from "lucide-react";
import copy from "copy-to-clipboard";
import {
  createChunksFromText,
  type ContentChunk,
} from "@/src/lib/blog-parser";

interface ParsedContent {
  title: string;
  text: string;
  pageCount?: number;
}

export default function ReaderPage() {
  const params = useParams();
  const contentId = params.contentId as string;
  const { toast } = useToast();

  const [content, setContent] = useState<ParsedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedChunkId, setCopiedChunkId] = useState<string | null>(null);

  // Load saved preference from localStorage
  const [maxCharsPerChunk, setMaxCharsPerChunk] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("maxCharsPerChunk");
      return saved ? parseInt(saved, 10) : 10000;
    }
    return 10000;
  });

  // Save to localStorage when changed
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "maxCharsPerChunk",
        maxCharsPerChunk.toString()
      );
    }
  }, [maxCharsPerChunk]);

  // Dynamically create chunks based on max characters
  const chunks = useMemo(() => {
    console.log("Creating chunks with:", {
      hasText: !!content?.text,
      textLength: content?.text?.length,
      maxCharsPerChunk,
    });

    if (!content?.text) {
      console.log("No text content available");
      return [];
    }

    const newChunks = createChunksFromText(content.text, maxCharsPerChunk);
    console.log("Created chunks:", newChunks.length);
    return newChunks;
  }, [content, maxCharsPerChunk]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        // Fetch from our API route (which fetches from Vercel Blob server-side)
        const response = await fetch(`/api/content/${contentId}`);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to fetch content");
        }

        const data = await response.json();
        setContent(data);
      } catch (err) {
        console.error("Error fetching content:", err);
        setError("Failed to load content. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (contentId) {
      fetchContent();
    }
  }, [contentId]);

  const handleCopy = (chunk: ContentChunk) => {
    const success = copy(chunk.prompt);
    if (success) {
      setCopiedChunkId(chunk.id);
      toast({
        title: "Copied!",
        description:
          "Prompt copied to clipboard. Paste it in ChatGPT app.",
      });

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedChunkId(null);
      }, 2000);
    } else {
      toast({
        title: "Copy failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error || "Content not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {content.title}
          </h1>
          <p className="text-sm text-gray-500">
            {chunks.length} chunk{chunks.length !== 1 ? "s" : ""} ready for
            listening
            {content.pageCount && ` • ${content.pageCount} pages`}
          </p>
        </div>

        {/* Chunk Size Control */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1">
              <label
                htmlFor="chunk-size-input"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Max characters per chunk
              </label>
              <input
                id="chunk-size-input"
                type="number"
                min="100"
                max="50000"
                step="100"
                value={maxCharsPerChunk}
                onChange={(e) => {
                  const newValue = Number(e.target.value);
                  if (newValue >= 100) {
                    console.log("Chunk size changed to:", newValue);
                    setMaxCharsPerChunk(newValue);
                  }
                }}
                className="w-full px-4 py-2 text-lg font-semibold text-blue-600 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter any value ≥ 100 characters
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 font-medium mb-1">
                Total chunks
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {chunks.length}
              </div>
              {chunks.length > 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  Avg:{" "}
                  {Math.round(
                    chunks.reduce((sum, c) => sum + c.text.length, 0) /
                      chunks.length
                  )}{" "}
                  chars
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400">
            💡 Tip: Each chunk contains complete sentences and won&apos;t
            exceed this character limit
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-900 mb-2">
            📱 How to use:
          </h2>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Tap the &quot;Copy&quot; button on any chunk below</li>
            <li>Open ChatGPT app and paste the text</li>
            <li>
              ChatGPT will repeat the text - tap the speaker icon to listen
            </li>
            <li>
              Continue with the next chunk to listen to the entire article
            </li>
          </ol>
        </div>

        {/* Chunks */}
        <div className="space-y-4">
          {chunks.map((chunk, index) => {
            const isCopied = copiedChunkId === chunk.id;
            return (
              <div
                key={chunk.id}
                className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">
                      Chunk {index + 1} of {chunks.length}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {chunk.text.length} characters
                    </p>
                  </div>
                  <Button
                    onClick={() => handleCopy(chunk)}
                    variant={isCopied ? "default" : "outline"}
                    size="sm"
                    className="flex-shrink-0"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {chunk.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            Using ChatGPT&apos;s TTS engine to listen to web content for
            free 🎧
          </p>
        </div>
      </div>
    </div>
  );
}
