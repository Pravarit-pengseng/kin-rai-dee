/**
 * filter-legal-dist.js
 * 
 * Cleans the exported Expo Web dist folder so that ONLY the 3 legal & support pages
 * (Privacy Policy, Terms of Use, Account Deletion) along with their required static assets
 * are included for public web deployment (Vercel / Cloudflare).
 * 
 * Ensures other internal mobile app screens (feed, profile, posts, auth) are NOT exposed.
 */

const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');

if (!fs.existsSync(distDir)) {
  console.error(`❌ [filter-legal-dist] dist directory not found at: ${distDir}`);
  process.exit(1);
}

// Whitelisted files and directories to keep
const allowedTopLevel = new Set([
  '_expo',
  'assets',
  'support',
  'favicon.ico',
  'privacy-policy.html',
  'privacy.html',
  'terms-of-use.html',
  'terms.html',
  'delete-account.html',
  '+not-found.html',
]);

console.log('🧹 [filter-legal-dist] Filtering dist folder for Legal Web deployment...');

const entries = fs.readdirSync(distDir);
let removedCount = 0;

for (const entry of entries) {
  if (entry === 'index.html') {
    // Will be handled separately (replaced by privacy-policy.html)
    continue;
  }

  if (!allowedTopLevel.has(entry)) {
    const fullPath = path.join(distDir, entry);
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      removedCount++;
    } catch (err) {
      console.warn(`⚠️ Failed to remove ${entry}:`, err.message);
    }
  }
}

// Copy privacy-policy.html as index.html so root URL (/) displays privacy policy
const privacyHtmlPath = path.join(distDir, 'privacy-policy.html');
const indexHtmlPath = path.join(distDir, 'index.html');

if (fs.existsSync(privacyHtmlPath)) {
  fs.copyFileSync(privacyHtmlPath, indexHtmlPath);
  console.log('✅ [filter-legal-dist] Set index.html -> privacy-policy.html');
}

console.log(`✅ [filter-legal-dist] Cleaned ${removedCount} non-legal files/folders.`);
console.log('📦 [filter-legal-dist] Only Legal & Support pages are deployed:');
console.log('   - /privacy-policy (and /privacy)');
console.log('   - /terms-of-use (and /terms)');
console.log('   - /delete-account (and /support/delete-account)');
