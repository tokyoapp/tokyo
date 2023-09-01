export default class CanvasRenderer {
  constructor() {
    this.colors = {
      line_color: '#eee',
      grid_1: '#171717',
      grid_2: '#101010',
    };
  }

  render(ctxt, canvasInstance) {
    // draw image nodes
    for (let node of canvasInstance.nodes) {
      const element = canvasInstance.getNodeElement(node);
      if (element.image && element.image.width > 0) {
        ctxt.drawImage(
          element.image,
          0,
          0,
          element.image.width,
          element.image.height,
          node.position[0] - 1,
          node.position[1] - 1,
          node.size[0] + 2,
          node.size[1] + 2
        );
      } else if (element.type == 'text/plain') {
        // draw text nodes
        this.drawText(ctxt, element.data, node);
      }
    }

    // draw pen lines
    ctxt.strokeStyle = this.colors.line_color;
    ctxt.lineWidth = 2 / canvasInstance.canvas.scale;
    ctxt.beginPath();
    for (let line of canvasInstance.lines) {
      for (let i = 0; i < line.length; i++) {
        if (i === 0) {
          ctxt.moveTo(line[i][0], line[i][1]);
        } else {
          ctxt.lineTo(line[i][0], line[i][1]);
        }
      }
    }
    ctxt.stroke();
  }

  drawText(ctxt, text, node, snapshot = false, canvasInstance, scaler) {
    const buffer = text.split('\n');
    const extras = node.extras || {
      'font-family': 'Roboto',
      'font-size': '69px',
      color: 'grey',
    };

    const BORDER_PADDING = [15, 15];
    const FONT_SIZE = +extras['font-size'].replace('px', '');
    const CHAR_HEIGHT = 1 * FONT_SIZE;
    const LINE_PADDING = 3;
    let LINE_WRAPPING = true;
    let CHAR_WIDTH = 40;

    const max_line_px_length = node.size[0] / (FONT_SIZE * 0.0125) - BORDER_PADDING[0] * 2;

    let x = node.position[0] + BORDER_PADDING[0];
    let y = node.position[1] + BORDER_PADDING[1];

    if (snapshot) {
      const bounds = canvasInstance.getNodeBounds(canvasInstance.nodes);
      x = (node.position[0] - bounds.minX - 1) / scaler;
      y = (node.position[1] - bounds.minY - 1) / scaler;
    }

    const initY = y;

    ctxt.fillStyle = extras['color'];
    ctxt.font = `${extras['font-size']} ${extras['font-family']}`;
    ctxt.textAlign = 'left';
    ctxt.textBaseline = 'top';

    const drawLine = (line) => {
      if (y - initY + CHAR_HEIGHT + LINE_PADDING < node.size[1]) {
        ctxt.fillText(line, x, y);
        y += CHAR_HEIGHT + LINE_PADDING;
      }
    };

    for (let line of buffer) {
      const text = ctxt.measureText(line);
      if (text.width + BORDER_PADDING[0] * 2 > node.size[0] && LINE_WRAPPING) {
        const parts = sliceLine(line, max_line_px_length / CHAR_WIDTH);
        for (let part of parts) {
          drawLine(part);
        }
      } else {
        drawLine(line);
      }
    }
  }

  renderSnapshot(canvasInstance) {
    const MAX_SNAPSHOT_SIZE = 5000;

    const canvas = document.createElement('canvas');
    const ctxt = canvas.getContext('2d');

    const bounds = canvasInstance.getNodeBounds(canvasInstance.nodes);
    canvas.width = bounds.width;
    canvas.height = bounds.height;

    const ar = bounds.width / bounds.height;

    let scaler = bounds.width / MAX_SNAPSHOT_SIZE;
    if (scaler > 1) {
      canvas.width = MAX_SNAPSHOT_SIZE;
      canvas.height = MAX_SNAPSHOT_SIZE / ar;
    } else {
      scaler = 1;
    }

    ctxt.lineWidth = 1 / canvasInstance.canvas.scale;

    for (let node of canvasInstance.nodes) {
      const element = canvasInstance.getNodeElement(node);
      if (element.image && element.image.width > 0) {
        ctxt.drawImage(
          element.image,
          0,
          0,
          element.image.width,
          element.image.height,
          (node.position[0] - bounds.minX - 1) / scaler,
          (node.position[1] - bounds.minY - 1) / scaler,
          (node.size[0] + 2) / scaler,
          (node.size[1] + 2) / scaler
        );
      } else if (element.type == 'text/plain') {
        // draw text nodes
        this.drawText(ctxt, element.data, node, true, canvasInstance, scaler);
      }
    }

    // draw lines
    ctxt.strokeStyle = this.colors.line_color;
    ctxt.lineWidth = 2 * scaler;
    ctxt.beginPath();
    for (let line of canvasInstance.lines) {
      for (let i = 0; i < line.length; i++) {
        const x = (line[i][0] - bounds.minX - 1) / scaler;
        const y = (line[i][1] - bounds.minY - 1) / scaler;
        if (i === 0) {
          ctxt.moveTo(x, y);
        } else {
          ctxt.lineTo(x, y);
        }
      }
    }
    ctxt.stroke();

    return canvas;
  }
}

function sliceLine(line, maxLength) {
  const parts = [];

  line = line.split('');

  while (line.length > maxLength) {
    const temp = line.splice(0, maxLength);
    parts.push(temp.join(''));
  }
  parts.push(line.join(''));

  return parts;
}
