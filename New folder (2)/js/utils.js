export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export const nowTs = () => new Date().toLocaleString();

export function el(tag, cls) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
}

export function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export function extractMimeType(dataUrl) {
  return dataUrl.split(',')[0].split(':')[1].split(';')[0];
}