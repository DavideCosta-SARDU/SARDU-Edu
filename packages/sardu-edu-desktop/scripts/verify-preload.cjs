const fs = require('node:fs');
const path = require('node:path');

const preloadPath = path.resolve(__dirname, '..', 'dist', 'preload.cjs');
const preload = fs.readFileSync(preloadPath, 'utf8');

if (/require\(\s*['"`]\.\//.test(preload)) {
    throw new Error('Sandboxed preload contains a local require and cannot run in Electron');
}

console.log('Sandboxed preload verification completed.');
