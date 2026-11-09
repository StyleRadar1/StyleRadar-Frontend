const fs = require('fs');
const path = require('path');

// Read the PDF as binary and try to extract text content
const pdfPath = 'C:\\Users\\kevin\\.gemini\\antigravity\\brain\\0c234d86-aaea-498a-a6e6-fa4922e48745\\.user_uploaded\\media_1794241657835_5e82af81.pdf';
const buf = fs.readFileSync(pdfPath);
const text = buf.toString('utf8');

// Extract readable text between stream markers
const textChunks = [];
let pos = 0;
while ((pos = text.indexOf('BT', pos)) > -1) {
  const end = text.indexOf('ET', pos);
  if (end > -1 && end - pos < 5000) {
    const chunk = text.substring(pos, end);
    // Extract text from Tj and TJ operators
    const tjMatches = chunk.match(/\(([^)]+)\)\s*Tj/g);
    if (tjMatches) {
      tjMatches.forEach(m => {
        const t = m.match(/\(([^)]+)\)/);
        if (t) textChunks.push(t[1]);
      });
    }
  }
  pos += 2;
}

if (textChunks.length > 0) {
  console.log('=== Extracted text from PDF ===');
  console.log(textChunks.join('\n'));
} else {
  // Try another approach - look for readable strings
  console.log('=== Trying raw string extraction ===');
  const readable = text.match(/[\x20-\x7E\xC0-\xFF]{10,}/g);
  if (readable) {
    // Filter out binary/encoded junk
    const filtered = readable.filter(s => 
      !s.includes('stream') && !s.includes('obj') && !s.includes('endobj') && 
      !s.includes('xref') && !s.includes('/Type') && !s.includes('/Filter') &&
      !s.includes('JFIF') && !s.includes('Adobe') && s.length < 500
    );
    console.log(filtered.join('\n'));
  }
}

