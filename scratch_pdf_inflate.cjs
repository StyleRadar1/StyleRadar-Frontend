const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('C:\\Users\\kevin\\.gemini\\antigravity\\brain\\0c234d86-aaea-498a-a6e6-fa4922e48745\\.user_uploaded\\media_1794241657835_5e82af81.pdf');

const text = buf.toString('binary');

// Find streams
let count = 0;
const re = /stream\r?\n/g;
let m;
while ((m = re.exec(text)) !== null) {
  count++;
  const start = m.index + m[0].length;
  const endIdx = text.indexOf('\nendstream', start);
  if (endIdx === -1) continue;
  
  const raw = Buffer.from(text.substring(start, endIdx), 'binary');
  if (raw.length > 100000) continue;
  
  const before = text.substring(Math.max(0, m.index - 500), m.index);
  if (before.includes('/Subtype /Image')) continue;
  
  try {
    const inflated = zlib.inflateSync(raw);
    const s = inflated.toString('latin1');
    // Check if it has any text-like content
    if (s.includes('BT') && (s.includes('Tj') || s.includes('TJ'))) {
      console.log(`\n=== Stream ${count} (${raw.length} -> ${inflated.length} bytes) ===`);
      // Print just first 1000 chars for inspection
      console.log(s.substring(0, 1500));
      console.log('...');
    }
  } catch(e) {}
}

console.log(`\nTotal streams scanned: ${count}`);
