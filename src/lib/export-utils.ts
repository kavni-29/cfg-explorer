function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function svgMarkupToImage(markup: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  });
}

function inlineSvgStyles(source: Element, target: Element) {
  const computed = window.getComputedStyle(source);
  const importantStyles = [
    'fill',
    'stroke',
    'stroke-width',
    'opacity',
    'font-size',
    'font-family',
    'font-weight',
    'letter-spacing',
    'paint-order',
    'filter',
  ];

  const styleText = importantStyles
    .map(property => `${property}:${computed.getPropertyValue(property)};`)
    .join('');

  const existingStyle = target.getAttribute('style') ?? '';
  target.setAttribute('style', `${existingStyle}${styleText}`);

  Array.from(source.children).forEach((child, index) => {
    const targetChild = target.children[index];
    if (targetChild) {
      inlineSvgStyles(child, targetChild);
    }
  });
}

export function buildDerivationSvgMarkup(title: string, steps: Array<{ sententialForm: string[]; ruleUsed: string }>) {
  const width = 1120;
  const rowHeight = 62;
  const padding = 36;
  const height = Math.max(260, padding * 2 + 94 + steps.length * rowHeight);

  const rows = steps
    .map((step, index) => {
      const y = padding + 88 + index * rowHeight;
      const form = step.sententialForm.join(' ');
      const prefix = index === 0 ? 'Start' : `Step ${index}`;

      return `
        <g transform="translate(0 ${y})">
          <rect x="${padding}" y="-18" width="${width - padding * 2}" height="48" rx="18" fill="${index % 2 === 0 ? '#fffdf2' : '#ffffff'}" stroke="#d7d7cf" />
          <text x="${padding + 20}" y="10" font-family="'JetBrains Mono', monospace" font-size="16" fill="#548687">${prefix}</text>
          <text x="${padding + 150}" y="10" font-family="'JetBrains Mono', monospace" font-size="18" fill="#2c2c2a">${form}</text>
          <text x="${padding + 20}" y="34" font-family="'DM Sans', sans-serif" font-size="13" fill="#6b6b65">${step.ruleUsed}</text>
        </g>
      `;
    })
    .join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#ffffff" />
      <rect x="${padding}" y="${padding}" width="${width - padding * 2}" height="${height - padding * 2}" rx="28" fill="#fffdf6" stroke="#d7d7cf" />
      <text x="${padding + 24}" y="${padding + 34}" font-family="'DM Sans', sans-serif" font-size="28" font-weight="500" fill="#2c2c2a">${title}</text>
      <text x="${padding + 24}" y="${padding + 62}" font-family="'DM Sans', sans-serif" font-size="15" fill="#6b6b65">Generated derivation sequence with production rules and sentential forms.</text>
      ${rows}
    </svg>
  `;
}

export function serializeSvgElement(svg: SVGSVGElement) {
  const rect = svg.getBoundingClientRect();
  const width = Math.max(Math.ceil(rect.width), 1);
  const height = Math.max(Math.ceil(rect.height), 1);
  const clone = svg.cloneNode(true) as SVGSVGElement;

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('viewBox', svg.getAttribute('viewBox') ?? `0 0 ${width} ${height}`);

  inlineSvgStyles(svg, clone);

  return {
    width,
    height,
    markup: new XMLSerializer().serializeToString(clone),
  };
}

export async function exportSvgMarkupAsPng(markup: string, width: number, height: number, filename: string) {
  const image = await svgMarkupToImage(markup);
  const canvas = document.createElement('canvas');
  canvas.width = width * 2;
  canvas.height = height * 2;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas export is unavailable in this browser.');
  }

  context.scale(2, 2);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) {
    throw new Error('Could not create the PNG export.');
  }

  downloadBlob(blob, filename);
}

export async function exportSvgElementAsPng(svg: SVGSVGElement, filename: string) {
  const { markup, width, height } = serializeSvgElement(svg);
  await exportSvgMarkupAsPng(markup, width, height, filename);
}

export async function printSvgMarkupAsPdf(markup: string, title: string) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=850');
  if (!printWindow) {
    throw new Error('Pop-up blocked. Please allow pop-ups to export the PDF.');
  }

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <style>
          body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: white; font-family: system-ui, sans-serif; }
          .status { color: #6b6b65; font-size: 14px; }
          img { max-width: 96vw; max-height: 96vh; object-fit: contain; display: none; }
          @page { margin: 12mm; }
        </style>
      </head>
      <body>
        <p class="status">Preparing PDF preview...</p>
        <img alt="${title}" />
      </body>
    </html>
  `);
  printWindow.document.close();

  const image = await svgMarkupToImage(markup);
  const img = printWindow.document.querySelector('img');
  const status = printWindow.document.querySelector('.status');

  if (!(img instanceof HTMLImageElement)) {
    throw new Error('Could not prepare the PDF preview.');
  }

  img.src = image.src;
  img.style.display = 'block';
  if (status) {
    status.remove();
  }

  printWindow.focus();
  window.setTimeout(() => {
    printWindow.print();
  }, 400);
}

export async function printSvgElementAsPdf(svg: SVGSVGElement, title: string) {
  const { markup } = serializeSvgElement(svg);
  await printSvgMarkupAsPdf(markup, title);
}
