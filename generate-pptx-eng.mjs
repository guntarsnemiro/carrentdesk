import PptxGenJS from 'pptxgenjs';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE'; // 13.33" x 7.5" = 16:9

const slideDir = 'C:/Users/User/Documents/GitHub/Carrentdesk/slides-eng-png';
const outFile = 'C:/Users/User/Documents/GitHub/Carrentdesk/CarRentDesk-IdejaKauss-2026-ENG-v3';

for (let i = 0; i < 10; i++) {
  const pngPath = join(slideDir, `slide_0${i}.png`);
  if (!existsSync(pngPath)) {
    console.warn(`Missing: ${pngPath}`);
    continue;
  }
  const imgData = readFileSync(pngPath).toString('base64');
  const slide = pptx.addSlide();
  slide.addImage({
    data: `image/png;base64,${imgData}`,
    x: 0, y: 0,
    w: '100%', h: '100%',
  });
  console.log(`Added slide ${i}`);
}

await pptx.writeFile({ fileName: outFile });
console.log('PPTX saved:', outFile + '.pptx');
