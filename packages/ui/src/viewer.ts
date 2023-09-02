export const canvas = document.createElement('canvas');
canvas.style.width = '100%';
canvas.style.maxHeight = '90vh';
canvas.style.objectFit = 'contain';

export function drawToCanvas(photo: HTMLImageElement | HTMLCanvasElement) {
  const ctxt = canvas.getContext('2d');
  canvas.width = photo.width;
  canvas.height = photo.height;
  ctxt?.drawImage(photo, 0, 0);
}
