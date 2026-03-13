const fs = require('fs-extra');
const path = require('path');

const TARGET_DIR = path.join('C:', 'app', 'chatmenupizza', 'Menu JSON');
const versionsDir = path.join(TARGET_DIR, 'versions');

console.log('Target Dir:', TARGET_DIR);
console.log('Exists:', fs.existsSync(TARGET_DIR));
if (fs.existsSync(TARGET_DIR)) {
    console.log('Contents:', fs.readdirSync(TARGET_DIR));
}

console.log('Versions Dir Exists:', fs.existsSync(versionsDir));
if (fs.existsSync(versionsDir)) {
    console.log('Versions Contents:', fs.readdirSync(versionsDir));
}
