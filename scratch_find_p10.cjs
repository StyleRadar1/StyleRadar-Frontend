const fs = require('fs');
const h = fs.readFileSync('entregas/archivo-unificado/StyleRadar_Prototipo_Unificado.html', 'utf8');

// Find the P10 section and surrounding HTML
const idx = h.indexOf('P10 · Representantes');
if (idx > -1) {
  // Go back to find the section start
  const sectionStart = h.lastIndexOf('<section', idx);
  const after = h.indexOf('</section>', idx);
  const sectionEnd = after > -1 ? after + '</section>'.length : idx + 2000;
  
  let snippet = h.substring(sectionStart, sectionEnd);
  snippet = snippet.replace(/data:image[^\s'"]+/g, '[BASE64_IMG]');
  
  console.log('Section length:', snippet.length);
  console.log(snippet.substring(0, 3000));
}

// Also find all pe-slot references
console.log('\n\n=== ALL pe-slot mentions ===');
let pos = 0;
let count = 0;
while ((pos = h.indexOf('pe-slot', pos)) > -1 && count < 20) {
  const line = h.substring(Math.max(0, pos - 50), Math.min(h.length, pos + 200)).replace(/data:image[^\s'"]+/g, '[B64]');
  console.log(`\n[${count}] at ${pos}:`, line.substring(0, 200));
  pos += 10;
  count++;
}

