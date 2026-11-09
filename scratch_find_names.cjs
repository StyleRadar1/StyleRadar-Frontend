const fs = require('fs');
const h = fs.readFileSync('entregas/archivo-unificado/StyleRadar_Prototipo_Unificado.html', 'utf8');

// Search for team member names in the prototype
const names = ['Kevin', 'Cristian', 'Daniel', 'Garcia', 'García', 'Julian', 'Julián', 'Morales', 'Giral', 'Munar', 'Nicolas', 'Nicolás', 'Alvarez', 'Álvarez', 'Oscar', 'Óscar', 'Paula'];

for (const name of names) {
  let pos = 0;
  let found = 0;
  while ((pos = h.indexOf(name, pos)) > -1 && found < 3) {
    // Check context - is it in an HTML tag or near a person reference?
    const ctx = h.substring(Math.max(0, pos - 120), Math.min(h.length, pos + 120));
    // Skip base64, JS code, CSS etc
    if (!ctx.includes('data:') && !ctx.includes('function') && !ctx.includes('const ') && !ctx.includes('var ') && !ctx.includes('rgb')) {
      console.log(`\n"${name}" at ${pos}:`);
      console.log(ctx.replace(/\s+/g, ' ').substring(0, 200));
      found++;
    }
    pos += name.length;
  }
}

// Also look for the "Equipo" or team grid in the landing
const teamPatterns = ['pe-team', 'team-grid', 'equipo-grid', 'pe-equipo', 'pe-squad', 'squad-grid'];
for (const p of teamPatterns) {
  const idx = h.indexOf(p);
  if (idx > -1) {
    console.log(`\n=== Found "${p}" at ${idx} ===`);
    console.log(h.substring(idx - 100, idx + 300).replace(/data:image[^\s'"]+/g, '[B64]'));
  }
}

// Search for footer credits with names
const footIdx = h.indexOf('pe-foot');
if (footIdx > -1) {
  const footSnippet = h.substring(footIdx, footIdx + 3000).replace(/data:image[^\s'"]+/g, '[B64]');
  console.log('\n=== FOOTER ===');
  console.log(footSnippet.substring(0, 2000));
}

