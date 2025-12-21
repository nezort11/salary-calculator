import * as cheerio from "cheerio";

export interface ContentChunk {
  id: string;
  text: string;
  prompt: string;
}

export interface ParsedContent {
  title: string;
  text: string; // Store raw text for client-side chunking
}

/**
 * Fetches and parses a blog post URL into chunks
 * @param url The blog post URL to parse
 * @param sentencesPerChunk Number of sentences per chunk (default: 15)
 * @returns Parsed content with chunks
 */
export async function parseBlogPost(
  url: string
): Promise<ParsedContent> {
  // Fetch the HTML content
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.statusText}`);
  }
  const html = await response.text();

  // Parse HTML with cheerio
  const $ = cheerio.load(html);

  // Extract title
  const title =
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    "Untitled Article";

  // Remove script, style, nav, footer, and other non-content elements
  $(
    "script, style, nav, footer, header, aside, .advertisement, .ad, .comments, #comments"
  ).remove();

  // Extract main content
  // Try to find the main content area (common patterns)
  const contentSelectors = [
    "article",
    'main[role="main"]',
    'div[role="main"]',
    ".post-content",
    ".article-content",
    ".entry-content",
    ".content",
    "main",
  ];

  let contentSelector = "body";
  for (const selector of contentSelectors) {
    const $selected = $(selector);
    if ($selected.length > 0) {
      contentSelector = selector;
      break;
    }
  }
  const $content = $(contentSelector);

  // Extract text content: headings, paragraphs, list items, and image alt texts
  const contentParts: string[] = [];

  $content
    .find("h1, h2, h3, h4, h5, h6, p, li, img")
    .each((_, element) => {
      const $el = $(element);

      if ($el.is("img")) {
        const alt = $el.attr("alt")?.trim();
        if (alt && alt.length > 0) {
          contentParts.push(`[Image: ${alt}]`);
        }
      } else {
        const text = $el.text().trim();
        if (text.length > 0) {
          contentParts.push(text);
        }
      }
    });

  // Join all content parts
  const fullText = contentParts.join("\n\n");

  // Return raw text for client-side chunking
  return {
    title,
    text: fullText,
  };
}

/**
 * Splits text into sentences
 * Exported for client-side chunking
 */
export function splitIntoSentences(text: string): string[] {
  // Basic sentence splitting: split on . ! ? followed by space or newline
  // This is a simple implementation; could be improved with NLP libraries
  const sentences: string[] = [];
  const lines = text.split(/\n+/);

  for (const line of lines) {
    // Split by sentence-ending punctuation
    const lineSentences = line
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

    sentences.push(...lineSentences);
  }

  return sentences.filter((s) => s.length > 0);
}

/**
 * Generates a unique ID for storing parsed content
 */
export function generateContentId(): string {
  return `content-${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}`;
}

/**
 * Creates chunks from text (client-side chunking)
 * @param text The full text to chunk
 * @param sentencesPerChunk Number of sentences per chunk
 * @returns Array of content chunks
 */
export function createChunksFromText(
  text: string,
  maxCharsPerChunk: number
): ContentChunk[] {
  const sentences = splitIntoSentences(text);
  const chunks: ContentChunk[] = [];

  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const sentence of sentences) {
    const sentenceLength = sentence.length;

    // If adding this sentence would exceed the limit and we have sentences already
    if (
      currentLength + sentenceLength > maxCharsPerChunk &&
      currentChunk.length > 0
    ) {
      // Save the current chunk
      const chunkText = currentChunk.join(" ").trim();
      if (chunkText.length > 0) {
        const chunkId = `chunk-${chunks.length + 1}`;
        const prompt = `Please reply with exactly this text:\n\n${chunkText}`;
        chunks.push({
          id: chunkId,
          text: chunkText,
          prompt: prompt,
        });
      }

      // Start a new chunk with this sentence
      currentChunk = [sentence];
      currentLength = sentenceLength;
    } else {
      // Add sentence to current chunk
      currentChunk.push(sentence);
      currentLength += sentenceLength + 1; // +1 for the space between sentences
    }
  }

  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    const chunkText = currentChunk.join(" ").trim();
    if (chunkText.length > 0) {
      const chunkId = `chunk-${chunks.length + 1}`;
      const prompt = `Please reply with exactly this text:\n\n${chunkText}`;
      chunks.push({
        id: chunkId,
        text: chunkText,
        prompt: prompt,
      });
    }
  }

  return chunks;
}
