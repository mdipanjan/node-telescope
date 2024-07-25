const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(path.join(dir, '..'));
const tgzFile = files.find(file => file.startsWith('node-telescope-') && file.endsWith('.tgz'));

if (tgzFile) {
  console.log(`Found package file: ${tgzFile}`);
  process.exit(0);
} else {
  console.error('Error: node-telescope-*.tgz file not found in the current directory');
  process.exit(1);
}
