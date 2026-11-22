import { readFileSync, writeFileSync } from 'fs';

const b64 = readFileSync('C:/Users/User/Documents/GitHub/Carrentdesk/crd-screenshot-b64.txt', 'utf8').trim();
const imgSrc = `data:image/jpeg;base64,${b64}`;

const canvas = readFileSync(
  'C:/Users/User/.cursor/projects/c-Users-User-Documents-GitHub-Carrentdesk/canvases/ideju-kauss-presentation.canvas.tsx',
  'utf8'
);

// Insert the const after the existing LOGO constants (after LOGO_DC line)
const imgConst = `const CRD_SCREENSHOT = "${imgSrc}";\n`;

// Find insertion point — after last "const LOGO" line block
const insertAfter = 'const LOGO_DC =';
const insertIdx = canvas.indexOf(insertAfter);
const lineEnd = canvas.indexOf('\n', insertIdx);

const updated = canvas.slice(0, lineEnd + 1) + imgConst + canvas.slice(lineEnd + 1);

writeFileSync(
  'C:/Users/User/.cursor/projects/c-Users-User-Documents-GitHub-Carrentdesk/canvases/ideju-kauss-presentation.canvas.tsx',
  updated,
  'utf8'
);
console.log('Done. Canvas length:', updated.length);
