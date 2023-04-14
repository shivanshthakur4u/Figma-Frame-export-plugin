declare const __html__: string;

import JSZip from 'jszip';
import * as figma from 'figma';

figma.showUI(__html__);

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'export-frame') {
    const selectedNode = figma.currentPage.selection[0];

    if (selectedNode && selectedNode.type === 'FRAME') {
      const zip = new JSZip();

      const html = generateHTML(selectedNode);
      const css = generateCSS(selectedNode);

      zip.file('index.html', html);
      zip.file('styles.css', css);

      const content = await zip.generateAsync({ type: 'blob' });

      figma.ui.postMessage({
        type: 'export-complete',
        content: content,
        fileName: `${selectedNode.name}.zip`,
      });
    } else {
      figma.ui.postMessage({
        type: 'error',
        message: 'Please select a frame to export',
      });
    }
  }
};

function generateHTML(node: SceneNode) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="stylesheet" href="styles.css" />
      </head>
      <body>
        <div class="${node.name}">
          ${node.children.map((child) => generateHTML(child)).join('')}
        </div>
      </body>
    </html>
  `;
}

function generateCSS(node: SceneNode) {
  return `
    .${node.name} {
      position: absolute;
      top: ${node.absoluteTransform[1][2]}px;
      left: ${node.absoluteTransform[0][2]}px;
      width: ${node.width}px;
      height: ${node.height}px;
    }
    ${node.children
      .filter((child) => child.type === 'FRAME')
      .map((child) => generateCSS(child))
      .join('')}
  `;
}
