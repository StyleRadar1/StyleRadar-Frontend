const fs = require('fs');
const buf = fs.readFileSync('C:\\Users\\kevin\\.gemini\\antigravity\\brain\\0c234d86-aaea-498a-a6e6-fa4922e48745\\.user_uploaded\\media_1794241657835_5e82af81.pdf');
const text = buf.toString('latin1');

// Extract text from content streams - look for text between BT and ET
const results = [];
const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
let sm;
while ((sm = streamRe.exec(text)) !== null) {
  const stream = sm[1];
  // Look for text operators: Tj, TJ, '
  const tjMatches = stream.match(/\(([^)]{2,})\)\s*Tj/g);
  if (tjMatches) {
    tjMatches.forEach(m => {
      const t = m.match(/\(([^)]+)\)/);
      if (t && t[1].length > 1) {
        // Decode PDF string escapes
        let decoded = t[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\')
          .replace(/\\([()])/g, '$1');
        results.push(decoded);
      }
    });
  }
  
  // Also look for TJ arrays
  const tjArrays = stream.match(/\[((?:\([^)]*\)|[^])*?)\]\s*TJ/g);
  if (tjArrays) {
    tjArrays.forEach(m => {
      const parts = [];
      const partRe = /\(([^)]*)\)/g;
      let pm;
      while ((pm = partRe.exec(m)) !== null) {
        parts.push(pm[1]);
      }
      if (parts.length > 0) {
        let joined = parts.join('');
        joined = joined
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\\\/g, '\\')
          .replace(/\\([()])/g, '$1');
        if (joined.trim().length > 1) results.push(joined);
      }
    });
  }
}

console.log('=== Extracted text lines ===');
results.forEach((r, i) => console.log(`[${i}] ${r}`));

