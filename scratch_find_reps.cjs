const fs = require('fs');
const h = fs.readFileSync('entregas/archivo-unificado/StyleRadar_Prototipo_Unificado.html', 'utf8');

// Search for "representante" context
const patterns = ['representant', 'Representant', 'equipo', 'Equipo', 'team', 'integrante', 'Integrante'];
for (const p of patterns) {
  const idx = h.indexOf(p);
  if (idx > -1) {
    // Get some context around the match
    const start = Math.max(0, idx - 200);
    const end = Math.min(h.length, idx + 300);
    const snippet = h.substring(start, end).replace(/data:image[^\s'"]+/g, '[B64]');
    console.log(`\n=== Found "${p}" at ${idx} ===`);
    console.log(snippet.substring(0, 400));
    console.log('---');
  }
}

// Also look for team/nosotros/about section
const secPatterns = ['nosotros', 'Nosotros', 'equipo', 'about', 'pe-team', 'pe-nosotros'];
for (const p of secPatterns) {
  let pos = 0;
  while ((pos = h.indexOf(p, pos)) > -1) {
    if (h.substring(pos - 50, pos).includes('class') || h.substring(pos - 50, pos).includes('id=') || h.substring(pos - 50, pos).includes('section')) {
      const snippet = h.substring(Math.max(0, pos - 100), pos + 200).replace(/data:image[^\s'"]+/g, '[B64]');
      console.log(`\n=== Section pattern "${p}" at ${pos} ===`);
      console.log(snippet.substring(0, 250));
      console.log('---');
    }
    pos += p.length;
  }
}

