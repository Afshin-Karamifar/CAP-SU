#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get domain from command line argument
const newDomain = process.argv[2];

if (!newDomain) {
  console.log('Usage: node update-domain.js <domain>');
  console.log('Example: node update-domain.js https://yourcompany.atlassian.net');
  process.exit(1);
}

// Validate domain format
try {
  new URL(newDomain);
} catch (error) {
  console.error('Invalid domain format. Please provide a valid URL.');
  process.exit(1);
}

// Read vite.config.ts
const viteConfigPath = path.join(__dirname, 'vite.config.ts');
let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

// Replace the target URL
const targetRegex = /target: process\.env\.JIRA_DOMAIN \|\| '[^']+'/;
const newTarget = `target: process.env.JIRA_DOMAIN || '${newDomain}'`;

if (targetRegex.test(viteConfig)) {
  viteConfig = viteConfig.replace(targetRegex, newTarget);
  fs.writeFileSync(viteConfigPath, viteConfig);
  console.log(`✅ Updated vite.config.ts target to: ${newDomain}`);
  console.log('🔄 Please restart your development server for changes to take effect.');
} else {
  console.error('❌ Could not find target configuration in vite.config.ts');
  process.exit(1);
}
