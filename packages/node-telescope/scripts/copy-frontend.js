const fs = require('fs-extra');
const path = require('path');

const sourcePath = path.join(__dirname, '..', '..', 'node-telescope-frontend', 'build');
const destPath = path.join(__dirname, '..', 'dist', 'frontend');

fs.copy(sourcePath, destPath, err => {
  if (err) {
    console.error('Error copying frontend build:', err);
    process.exit(1);
  }
  console.log('Frontend build copied successfully to:', destPath);
});
