const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'build', 'index.html');

fs.readFile(indexPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading index.html:', err);
    process.exit(1);
  }

  // Replace all occurrences of "/static/" with "./static/"
  let result = data.replace(/="\/static\//g, '="./static/');

  // Replace other absolute paths if necessary
  result = result.replace(/="\/manifest/g, '="./manifest');
  result = result.replace(/="\/favicon/g, '="./favicon');

  fs.writeFile(indexPath, result, 'utf8', err => {
    if (err) {
      console.error('Error writing index.html:', err);
      process.exit(1);
    }
    console.log('Successfully updated paths in index.html');
  });
});
