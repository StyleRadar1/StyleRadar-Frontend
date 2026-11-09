const fs = require('fs');
const path = require('path');

// List photos with their sizes
const dir = 'C:\\Users\\kevin\\Downloads\\fotos representantes';
const files = fs.readdirSync(dir);
files.forEach(f => {
  const stat = fs.statSync(path.join(dir, f));
  console.log(`${f} - ${(stat.size / 1024).toFixed(1)} KB`);
});

