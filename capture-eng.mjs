import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createServer } from 'http';
import { execSync } from 'child_process';

// This script navigates through all 10 slides via CDP and captures screenshots
// Run after server is already started on port 7655

console.log('Screenshots will be saved to slides-eng-png/');
mkdirSync('slides-eng-png', { recursive: true });
