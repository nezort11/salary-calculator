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
export async function parseBlogPost(url: string): Promise<ParsedContent> {
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
  // Improved sentence splitting that handles common abbreviations
  // Split on . ! ? followed by space, but not if preceded by common abbreviations
  const sentences: string[] = [];
  const lines = text.split(/\n+/);

  for (const line of lines) {
    // Use a more careful approach: split on sentence endings but preserve abbreviations
    const lineSentences: string[] = [];

    // Common abbreviations that shouldn't end sentences
    const abbreviations =
      /\b(?:Dr|Mr|Mrs|Ms|Prof|Sr|Jr|Inc|Ltd|Corp|Co|et al|e\.g|i\.e|vs|etc|ca|cf|al)\./i;

    let currentSentence = "";
    let i = 0;

    while (i < line.length) {
      currentSentence += line[i];

      // Check for sentence-ending punctuation followed by space or end of line
      if (/[.!?]/.test(line[i])) {
        // Look ahead to see if this is followed by a space and potentially more text
        const remaining = line.substring(i + 1);
        const nextSpaceMatch = remaining.match(/^\s+/);
        const nextWordMatch = remaining.match(/^\s*(\w)/);

        if (nextSpaceMatch && nextWordMatch) {
          // There's a space followed by a word - this might be a sentence end
          // But check if the punctuation is preceded by a common abbreviation
          const lastWordMatch = currentSentence.trim().match(/\b\w+\.$/);
          const isAbbreviation =
            lastWordMatch && abbreviations.test(lastWordMatch[0]);

          if (!isAbbreviation) {
            // This looks like a real sentence end
            lineSentences.push(currentSentence.trim());
            currentSentence = "";
            i += nextSpaceMatch[0].length; // Skip the space(s)
            continue;
          }
        } else if (i === line.length - 1) {
          // End of line, add the current sentence
          lineSentences.push(currentSentence.trim());
          break;
        }
      }

      i++;
    }

    // Add any remaining content
    if (currentSentence.trim().length > 0) {
      lineSentences.push(currentSentence.trim());
    }

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
 * Creates a prompt for a content chunk
 * @param chunkText The text of the chunk
 * @returns The formatted prompt
 */
function createChunkPrompt(chunkText: string): string {
  return `Please clean up and reformat the following text to make it perfect for text-to-speech (TTS) reading. Remove any:
- Page numbers (e.g., "2/23", "page 5")
- Strange formatting artifacts
- Excessive line breaks or spacing issues
- Headers/footers that break the flow
- Any other elements that would sound awkward when spoken aloud

Keep the meaning and content intact, but make it flow naturally as if it were written specifically to be read aloud. Reply with only the cleaned text:

${chunkText}`;
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
  let currentLength = 0; // Length of joined text including spaces

  for (const sentence of sentences) {
    const sentenceLength = sentence.length;

    // Calculate what the new length would be if we add this sentence
    const newLength =
      currentChunk.length === 0
        ? sentenceLength
        : currentLength + 1 + sentenceLength; // +1 for space

    // If adding this sentence would exceed the limit and we have sentences already
    if (newLength > maxCharsPerChunk && currentChunk.length > 0) {
      // Save the current chunk
      const chunkText = currentChunk.join(" ").trim();
      if (chunkText.length > 0) {
        const chunkId = `chunk-${chunks.length + 1}`;
        chunks.push({
          id: chunkId,
          text: chunkText,
          prompt: createChunkPrompt(chunkText),
        });
      }

      // Start a new chunk with this sentence
      currentChunk = [sentence];
      currentLength = sentenceLength;
    } else {
      // Add sentence to current chunk
      currentChunk.push(sentence);
      currentLength = newLength;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    const chunkText = currentChunk.join(" ").trim();
    if (chunkText.length > 0) {
      const chunkId = `chunk-${chunks.length + 1}`;
      chunks.push({
        id: chunkId,
        text: chunkText,
        prompt: createChunkPrompt(chunkText),
      });
    }
  }

  return chunks;
}
