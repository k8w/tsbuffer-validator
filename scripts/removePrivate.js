const fs = require('fs');
const path = require('path');

let content = fs.readFileSync(path.resolve(__dirname, '../dist/index.d.ts'), 'utf-8');
content = content.replace(/\s+private\s+\w+;/g, '');
fs.writeFileSync(path.resolve(__dirname, '../dist/index.d.ts'), content, 'utf-8');