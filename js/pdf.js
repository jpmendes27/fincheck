// js/pdf.js - PDF extraction utilities
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Group text items by their Y position to preserve line breaks.
    const lines = [];
    let currentLine = '';
    let lastY = null;
    for (const item of content.items) {
      const y = item.transform[5];
      if (lastY === null) {
        currentLine = item.str;
        lastY = y;
        continue;
      }
      if (Math.abs(y - lastY) > 2) {
        if (currentLine.trim().length) lines.push(currentLine.trim());
        currentLine = item.str;
        lastY = y;
      } else {
        currentLine += (currentLine ? ' ' : '') + item.str;
      }
    }
    if (currentLine.trim().length) lines.push(currentLine.trim());
    text += lines.join('\n') + '\n';
  }
  return text;
}
