// Clear Node.js module cache and restart
const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing Node.js module cache...\n');

// Delete node_modules/.cache if it exists
const cacheDir = path.join(__dirname, 'backend', 'node_modules', '.cache');
if (fs.existsSync(cacheDir)) {
    console.log('📁 Found .cache directory, deleting...');
    fs.rmSync(cacheDir, { recursive: true, force: true });
    console.log('✅ Cache directory deleted\n');
} else {
    console.log('ℹ️  No .cache directory found\n');
}

console.log('✅ Done! Now restart the backend:');
console.log('   cd backend');
console.log('   npm run dev');
