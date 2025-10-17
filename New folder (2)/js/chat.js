// js/chat.js
import { sanitizeHTML, sanitizeText } from './sanitizer.js';
import { sendToAI } from './api.js';
import { sleep, el, fileToBase64 } from './utils.js';
import { history, sessionMemory, userState } from './storage.js';
import { AI_PROVIDER, SESSION_LIMIT } from './config.js';

const els = {
  chat: document.getElementById('chatMessages'),
  input: document.getElementById('messageInput'),
  send: document.getElementById('sendBtn'),
  thumbs: document.getElementById('thumbs'),
  typing: document.getElementById('typing'),
  timer: document.getElementById('timer')
};

let pendingImages = [];

function renderHistory() {
  els.chat.innerHTML = '';
  const frag = document.createDocumentFragment();
  for (const m of history) {
    frag.appendChild(renderMessage(m));
  }
  els.chat.appendChild(frag);
  els.chat.scrollTop = els.chat.scrollHeight;
}

function renderMessage(m) {
  const row = el('div', 'row');
  const bubble = el('div', 'msg ' + (m.role === 'user' ? 'user' : 'ai'));
  const textDiv = el('div');
  textDiv.innerHTML = sanitizeText(m.text || '');
  bubble.appendChild(textDiv);
  if (Array.isArray(m.images) && m.images.length) {
    const wrap = el('div');
    wrap.style.marginTop = '8px';
    wrap.style.display = 'flex';
    wrap.style.gap = '8px';
    wrap.style.flexWrap = 'wrap';
    m.images.forEach(b64 => {
      const img = new Image();
      img.src = b64;
      img.alt = 'image';
      img.onclick = () => openModal(b64);
      img.style.maxWidth = '120px';
      img.style.borderRadius = '10px';
      img.style.border = '1px solid var(--border)';
      wrap.appendChild(img);
    });
    bubble.appendChild(wrap);
  }
  const ts = el('div', 'ts');
  ts.textContent = new Date(m.ts || Date.now()).toLocaleString();
  bubble.appendChild(ts);
  row.appendChild(bubble);
  return row;
}

function openModal(src) {
  const modal = document.getElementById('modal');
  const img = document.getElementById('modalImg');
  img.src = '';
  setTimeout(() => {
    img.src = src;
    modal.style.display = 'flex';
  }, 50);
}

function addUserMessage(text, imagesB64) {
  const m = { role: 'user', text, images: imagesB64 || [], ts: Date.now() };
  history.push(m);
  sessionMemory.push(m);
  while (sessionMemory.length > SESSION_LIMIT) sessionMemory.shift();
  els.chat.appendChild(renderMessage(m));
  els.chat.scrollTop = els.chat.scrollHeight;
}

async function addAIMessageStream(text) {
  const m = { role: 'ai', text, images: [], ts: Date.now() };
  history.push(m);
  sessionMemory.push(m);
  while (sessionMemory.length > SESSION_LIMIT) sessionMemory.shift();

  const row = el('div', 'row');
  const bubble = el('div', 'msg ai');
  const textDiv = el('div');
  bubble.appendChild(textDiv);
  const ts = el('div', 'ts');
  ts.textContent = new Date(m.ts).toLocaleString();
  bubble.appendChild(ts);
  row.appendChild(bubble);
  els.chat.appendChild(row);
  els.chat.scrollTop = els.chat.scrollHeight;

  await typeInto(textDiv, text);
}

async function typeInto(node, text) {
  let html = '';
  for (let i = 0; i < text.length; i++) {
    html += text[i] === '\n' ? '<br>' : text[i];
    node.innerHTML = sanitizeHTML(html);
    if (i % 6 === 0) await sleep(8);
  }
}

async function addPending(file) {
  const blobUrl = URL.createObjectURL(file);
  const b64 = await fileToBase64(file);
  pendingImages.push({ blobUrl, b64 });
  const th = el('div', 'thumb');
  const img = new Image();
  img.src = blobUrl;
  th.appendChild(img);
  const rm = el('button', 'x');
  rm.textContent = '✕';
  rm.onclick = () => {
    els.thumbs.removeChild(th);
    pendingImages = pendingImages.filter(p => p.blobUrl !== blobUrl);
    URL.revokeObjectURL(blobUrl);
  };
  th.appendChild(rm);
  els.thumbs.appendChild(th);
}

function setTyping(on) {
  els.typing.style.display = on ? 'flex' : 'none';
}

let t0 = 0, tickInt = null;
function startTimer() {
  t0 = performance.now();
  if (tickInt) clearInterval(tickInt);
  tickInt = setInterval(updateTimer, 200);
}
function stopTimer() {
  if (tickInt) {
    clearInterval(tickInt);
    tickInt = null;
  }
  updateTimer();
}
function updateTimer() {
  const s = Math.max(0, (performance.now() - t0) / 1000);
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = Math.floor(s % 60).toString().padStart(2, '0');
  els.timer.textContent = m + ':' + ss;
}

async function sendMessage() {
  const text = els.input.value.trim();
  if (!text && pendingImages.length === 0) return;

  const imgs = pendingImages.map(p => p.b64);
  addUserMessage(text, imgs);
  els.input.value = '';
  els.thumbs.innerHTML = '';
  pendingImages.forEach(p => URL.revokeObjectURL(p.blobUrl));
  pendingImages = [];

  userState.questionsAsked++;
  // awardPoints and updateStatsUI are handled in ui.js

  const shortContext = sessionMemory.slice(-SESSION_LIMIT);

  setTyping(true);
  startTimer();
  const abortController = new AbortController();
  try {
    const aiText = await sendToAI(AI_PROVIDER, text, imgs, shortContext, userState.currentMode, { signal: abortController.signal });
    setTyping(false);
    stopTimer();
    await addAIMessageStream(aiText || 'لم يصل رد.');
  } catch (err) {
    setTyping(false);
    stopTimer();
    console.error(err);
    await addAIMessageStream('عذراً، فشل الاتصال بالخدمة. تحقق من الشبكة.');
  }
  // saveMemory is handled in storage.js
}

export { renderHistory, renderMessage, openModal, addUserMessage, addAIMessageStream, sendMessage, setTyping, startTimer, stopTimer, updateTimer, addPending };