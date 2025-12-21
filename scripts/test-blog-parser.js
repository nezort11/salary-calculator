/**
 * Simple test script to verify blog parser functionality
 *
 * Usage: node test-blog-parser.js <url>
 * Example: node test-blog-parser.js https://blog.example.com/article
 */

async function testBlogParser(url) {
  console.log("🔍 Testing blog parser...\n");
  console.log(`URL: ${url}\n`);

  try {
    // Test the parse-blog API endpoint
    console.log("📡 Calling parse-blog API...");
    const response = await fetch("http://localhost:3000/api/parse-blog", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url,
        sentencesPerChunk: 10, // Use smaller chunks for testing
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    console.log("✅ Successfully parsed!\n");

    console.log("📊 Results:");
    console.log(`   Title: ${result.title}`);
    console.log(`   Total Chunks: ${result.totalChunks}`);
    console.log(`   Content ID: ${result.contentId}`);
    console.log(`   Storage URL: ${result.url}\n`);

    // Fetch the actual content to verify
    console.log("📥 Fetching stored content...");
    const contentResponse = await fetch(result.url);
    if (!contentResponse.ok) {
      throw new Error("Failed to fetch stored content");
    }

    const content = await contentResponse.json();
    console.log("✅ Content retrieved!\n");

    console.log("📝 First chunk preview:");
    if (content.chunks && content.chunks.length > 0) {
      const firstChunk = content.chunks[0];
      console.log(`   ID: ${firstChunk.id}`);
      console.log(`   Text length: ${firstChunk.text.length} characters`);
      console.log(
        `   Text preview: ${firstChunk.text.substring(0, 100)}...\n`
      );
      console.log(
        `   Prompt preview: ${firstChunk.prompt.substring(0, 150)}...\n`
      );
    }

    console.log("🎉 Test completed successfully!");
    console.log(
      `\n📱 Web app URL: http://localhost:3000/reader/${result.contentId}`
    );
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Get URL from command line arguments
const url = process.argv[2];

if (!url) {
  console.error("Usage: node test-blog-parser.js <url>");
  console.error(
    "Example: node test-blog-parser.js https://blog.example.com/article"
  );
  process.exit(1);
}

// Run the test
testBlogParser(url);
