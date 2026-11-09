const fs = require('fs');
const h = fs.readFileSync('entregas/archivo-unificado/StyleRadar_Prototipo_Unificado.html', 'utf8');

// Find ALL section comments with P* assignments
const re = /<!--\s*(\d+)\s*·\s*([^·]+)·\s*P(\d+)\s*\(([^)]+)\)/g;
let m;
while ((m = re.exec(h)) !== null) {
  console.log(`Sección ${m[1]}: ${m[2].trim()} — P${m[3]} (${m[4]})`);
}

// Also find any existing team member data or grid
console.log('\n=== Looking for team member structures ===');
const teamSearches = ['integrante', 'member', 'pe-team', 'team-card', 'equipo-card', 'pe-member', 'squad-member', 'pe-avatar'];
for (const s of teamSearches) {
  const idx = h.indexOf(s);
  if (idx > -1) {
    console.log(`Found "${s}" at ${idx}`);
    console.log(h.substring(Math.max(0, idx - 50), idx + 200).replace(/data:image[^\s'"]+/g, '[B64]').substring(0, 200));
  }
}

// Find any reference to the full team list in JavaScript
console.log('\n=== Looking for team data in JS ===');
const jsTeam = ['TEAM', 'squad', 'Squad', 'members', 'integrantes'];
for (const s of jsTeam) {
  let pos = 0;
  let found = 0;
  while ((pos = h.indexOf(s, pos)) > -1 && found < 3) {
    const ctx = h.substring(Math.max(0, pos - 30), pos + 150);
    if (ctx.includes('const') || ctx.includes('=') || ctx.includes('[')) {
      console.log(`\n"${s}" at ${pos}:`, ctx.replace(/data:image[^\s'"]+/g, '[B64]').substring(0, 150));
      found++;
    }
    pos += s.length;
  }
}

