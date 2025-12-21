/**
 * PDF Parser Test Script
 *
 * Tests PDF parsing with different PDF files
 *
 * Usage: node test-pdf-parser.js <path-to-pdf>
 * Example: node test-pdf-parser.js ./sample.pdf
 */

const fs = require("fs");
const path = require("path");

async function testPDFParser(pdfPath) {
  console.log("📄 Testing PDF Parser...\n");

  // Check if file exists
  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ File not found: ${pdfPath}`);
    process.exit(1);
  }

  // Check if it's a PDF
  if (!pdfPath.toLowerCase().endsWith(".pdf")) {
    console.error("❌ File is not a PDF");
    process.exit(1);
  }

  const fileName = path.basename(pdfPath);
  const fileSize = fs.statSync(pdfPath).size;

  console.log(`File: ${fileName}`);
  console.log(`Size: ${(fileSize / 1024).toFixed(2)} KB`);
  console.log("");

  try {
    // Read the PDF file
    const buffer = fs.readFileSync(pdfPath);
    console.log("✅ PDF file read successfully\n");

    // Parse the PDF using the pdf-parse v2 library
    const { PDFParse } = require("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();

    console.log("📊 PDF Information:");
    console.log(
      `   Title: ${data.info?.Title || "(no title in metadata)"}`
    );
    console.log(`   Pages: ${data.total || data.pages?.length || 0}`);
    console.log(`   Text length: ${data.text.length} characters`);
    console.log("");

    // Show first 500 characters of text
    console.log("📝 Text Preview (first 500 chars):");
    console.log("─".repeat(60));
    console.log(data.text.substring(0, 500));
    console.log("─".repeat(60));
    console.log("");

    // Test sentence splitting
    const sentences = data.text.match(/[^.!?]+[.!?]+/g) || [];
    console.log(`📝 Estimated sentences: ${sentences.length}`);

    if (sentences.length > 0) {
      console.log(`   First sentence: "${sentences[0].trim()}"`);
    }
    console.log("");

    // Estimate chunks
    const sentencesPerChunk = 15;
    const estimatedChunks = Math.ceil(
      sentences.length / sentencesPerChunk
    );
    console.log(
      `📦 Estimated chunks (${sentencesPerChunk} sentences each): ${estimatedChunks}`
    );
    console.log("");

    // Check if text is extractable
    if (data.text.trim().length === 0) {
      console.warn("⚠️  Warning: No text extracted from PDF!");
      console.warn("   This might be:");
      console.warn("   - A scanned PDF (images only)");
      console.warn("   - An encrypted PDF");
      console.warn("   - A corrupted PDF");
      console.warn("");
      console.warn("   💡 Solution: Try using OCR or a different PDF");
    } else if (data.text.trim().length < 100) {
      console.warn("⚠️  Warning: Very little text extracted!");
      console.warn("   The PDF might be mostly images.");
    }

    console.log("✅ PDF parsing test completed successfully!");
    console.log("");
    console.log("🎉 This PDF should work with the bot!");
    console.log(
      "   Just send it to your Telegram bot and it will be chunked for listening."
    );
  } catch (error) {
    console.error("❌ PDF parsing failed:", error.message);
    console.error("");
    console.error("Possible reasons:");
    console.error("- PDF is corrupted");
    console.error("- PDF is encrypted/password protected");
    console.error("- PDF format is not supported");
    console.error("- File is not a valid PDF");
    process.exit(1);
  }
}

// Get PDF path from command line
const pdfPath = process.argv[2];

if (!pdfPath) {
  console.error("Usage: node test-pdf-parser.js <path-to-pdf>");
  console.error("Example: node test-pdf-parser.js ./sample.pdf");
  console.error("");
  console.error("💡 Test with different PDFs:");
  console.error("   - Simple text PDF");
  console.error("   - Multi-page document");
  console.error("   - Webpage saved as PDF");
  console.error("   - Academic paper");
  process.exit(1);
}

// Run the test
testPDFParser(pdfPath);
