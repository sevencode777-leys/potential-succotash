// js/app.js
import { API_BASE_URL, SESSION_LIMIT, AI_PROVIDER } from './config.js';
import { initAuth, signInWithGoogle, signInWithPhone, confirmPhoneCode, signOutUser } from './auth.js';
import { renderHistory, addUserMessage, addAIMessageStream, sendMessage, setTyping, startTimer, stopTimer, updateTimer } from './chat.js';
import { setTheme, switchMode, createPlanner, generatePlan, loadSevenCodeContent, setLang, applyLang, showSuccess } from './ui.js';
import { saveMemory, loadMemory, clearMemory } from './storage.js';
import { sleep, nowTs, el, fileToBase64 } from './utils.js';

// رسالة ترحيب متحركة عند أول زيارة
function initWelcome() {
  if (!localStorage.getItem('nibrasWelcome')) {
    const welcomeDiv = el('div');
    welcomeDiv.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#667eeacc;color:#fff;display:flex;align-items:center;justify-content:center;font-size:2rem;z-index:2000;transition:opacity 1s;';
    welcomeDiv.innerHTML = '<div>👋 أهلاً بك في نبراس!<br>منصة التعلم الذكية.<br><span style="font-size:1rem">seven_code7</span></div>';
    document.body.appendChild(welcomeDiv);
    setTimeout(() => { welcomeDiv.style.opacity = '0'; setTimeout(() => welcomeDiv.remove(), 1200); }, 2600);
    localStorage.setItem('nibrasWelcome', '1');
  }
}

// زر مساعدة يفتح نافذة تعليمية
function initHelpButton() {
  const helpBtn = el('button', 'btn');
  helpBtn.textContent = 'مساعدة';
  helpBtn.style.position = 'fixed';
  helpBtn.style.left = '16px';
  helpBtn.style.bottom = '16px';
  helpBtn.style.zIndex = '1200';
  document.body.appendChild(helpBtn);
  helpBtn.onclick = () => {
    const win = window.open('', '', 'width=400,height=500');
    win.document.write('<div style="font-family:Segoe UI;padding:18px;color:#222;background:#f8f9fa;border-radius:16px;"><h2>دليل استخدام نبراس</h2><ul style="font-size:16px;line-height:1.7;"><li>اكتب سؤالك أو أرفق صورة واضغط إرسال.</li><li>استخدم الأدوات الجانبية لتوليد أمثلة أو تمارين أو خطة.</li><li>يمكنك تحرير أو تكرار آخر رسالة بسهولة.</li><li>الشارات تظهر حسب إنجازك وتقدّمك.</li><li>تصدير واسترجاع الجلسة متاح من الأعلى.</li><li>استفد من التلميحات الدراسية في أسفل الصفحة.</li></ul><div style="margin-top:12px;color:#667eea">نتمنى لك النجاح!</div></div>');
  };
}

// تلميحات دراسية عشوائية
function initTips() {
  const tips = [
    'قسّم المهام الكبيرة إلى أجزاء صغيرة ليسهل إنجازها.',
    'استخدم تقنية بومودورو لزيادة التركيز.',
    'راجع ملخص الدرس قبل حل الواجبات.',
    'اكتب أسئلتك أثناء الدراسة لتسأل عنها لاحقًا.',
    'خذ فواصل قصيرة لتحسين الاستيعاب.',
    'استخدم الشارات لتحفيز نفسك.',
    'لا تتردد في طلب شرح إضافي لأي نقطة غامضة.'
  ];
  const tipDiv = el('div');
  tipDiv.style = 'position:fixed;bottom:16px;right:16px;background:#f8f9fa;color:#222;padding:12px 18px;border-radius:14px;box-shadow:0 2px 8px #667eea55;font-size:15px;z-index:1000;';
  tipDiv.textContent = '💡 ' + tips[Math.floor(Math.random() * tips.length)];
  document.body.appendChild(tipDiv);
}

// زر اختيار اللغة
function initLangSelector() {
  const langSelect = el('select');
  langSelect.style = 'position:fixed;top:12px;right:16px;z-index:1200;font-size:16px;padding:6px 12px;border-radius:8px;background:#fff;color:#222;border:1px solid #667eea;';
  langSelect.innerHTML = '<option value="ar">العربية</option><option value="en">English</option><option value="tr">Türkçe</option>';
  document.body.appendChild(langSelect);
  langSelect.onchange = () => setLang(langSelect.value);
}

// حالة التطبيق UI
const els = {
  chat: document.getElementById('chatMessages'),
  input: document.getElementById('messageInput'),
  send: document.getElementById('sendBtn'),
  upload: document.getElementById('uploadBtn'),
  file: document.getElementById('fileInput'),
  thumbs: document.getElementById('thumbs'),
  typing: document.getElementById('typing'),
  timer: document.getElementById('timer'),
  themeBtn: document.getElementById('themeBtn'),
  clearBtn: document.getElementById('clearBtn'),
  exportBtn: document.getElementById('exportBtn'),
  editBtn: document.getElementById('editBtn'),
  repeatBtn: document.getElementById('repeatBtn'),
  questions: document.getElementById('questionsCount'),
  level: document.getElementById('learningLevel'),
  points: document.getElementById('pointsCount'),
  progress: document.getElementById('progressBar'),
  badges: document.getElementById('badgesContainer'),
  chatTitle: document.getElementById('chatTitle'),
  topicArea: document.getElementById('topicInputArea'),
  topicInput: document.getElementById('topicInput')
};

// ذاكرة الجلسة (لا تُرسل كل السجل)
const sessionMemory = [];
// قائمة الصور المُرفقة قبل الإرسال
let pendingImages = [];
// حالة المستخدم للأرقام والنقاط
let userState = {
  questionsAsked: 0, points: 0, level: 1,
  badges: ['🌟 المبتدئ'],
  currentMode: 'learn',
};

// المؤقت لقياس مدة الاستجابة
let t0 = 0, tickInt = null;

// إدخال Enter لإرسال
function setupInputListeners() {
  els.input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
}

// رفع صور
function setupUploadListeners() {
  els.upload.onclick = () => els.file.click();
  els.file.onchange = async (e) => {
    for (const file of e.target.files) { await addPending(file); }
    e.target.value = null;
  };
}

// سحب وإفلات
function setupDragDrop() {
  const dropZone = document.getElementById('dropZone');
  ;['dragenter', 'dragover'].forEach(ev => dropZone.addEventListener(ev, (e) => { e.preventDefault(); dropZone.style.border = '2px dashed var(--brand)'; }));
  ;['dragleave', 'drop'].forEach(ev => dropZone.addEventListener(ev, (e) => { e.preventDefault(); dropZone.style.border = 'none'; }));
  dropZone.addEventListener('drop', async (e) => {
    const files = e.dataTransfer.files;
    for (const f of files) { if (f.type.startsWith('image/')) await addPending(f); }
  });
}

async function addPending(file) {
  const blobUrl = URL.createObjectURL(file);
  const b64 = await fileToBase64(file);
  pendingImages.push({ blobUrl, b64 });
  const th = el('div', 'thumb');
  const img = new Image(); img.src = blobUrl; th.appendChild(img);
  const rm = el('button', 'x'); rm.textContent = '✕'; rm.onclick = () => { els.thumbs.removeChild(th); pendingImages = pendingImages.filter(p => p.blobUrl !== blobUrl); URL.revokeObjectURL(blobUrl); };
  th.appendChild(rm); els.thumbs.appendChild(th);
}

// تحرير/تكرار آخر رسالة مستخدم
function setupEditRepeat() {
  els.editBtn.onclick = () => {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === 'user') { els.input.value = history[i].text || ''; els.input.focus(); break; }
    }
  };
  els.repeatBtn.onclick = () => {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === 'user') { els.input.value = history[i].text || ''; sendMessage(); break; }
    }
  };
}

// تبديل السمة
function setupThemeToggle() {
  els.themeBtn.onclick = () => {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(cur === 'light' ? 'dark' : 'light'); saveMemory();
    showSuccess(cur === 'light' ? '🌙 تم تفعيل الوضع الداكن' : '☀ تم تفعيل الوضع الفاتح');
  };
}

// مسح الذاكرة
function setupClearMemory() {
  els.clearBtn.onclick = () => {
    if (confirm('هل تريد مسح المحادثة المخزّنة؟')) {
      history = []; sessionMemory.length = 0; renderHistory(); clearMemory();
      showSuccess('🧹 تم مسح الذاكرة بنجاح!');
    }
  };
}

// تصدير الجلسة
function setupExport() {
  els.exportBtn.onclick = () => {
    const blob = new Blob([JSON.stringify({ history, userState }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = el('a'); a.href = url; a.download = 'nibras_session.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    showSuccess('✅ تم تصدير الجلسة بنجاح!');
  };
}

// أوضاع التعلم
function setupModeSwitches() {
  document.querySelectorAll('.menu .item').forEach((item, i) => {
    const modes = ['learn', 'examples', 'practice', 'workshop', 'planner'];
    item.onclick = () => switchMode(modes[i]);
  });
}

// Auth UI wiring
function setupAuth() {
  const googleBtn = document.getElementById('googleSignInBtn');
  if (googleBtn) googleBtn.onclick = signInWithGoogle;

  const phoneForm = document.getElementById('phoneSignInForm');
  if (phoneForm) {
    phoneForm.onsubmit = async (e) => {
      e.preventDefault();
      const phone = document.getElementById('phoneInput').value;
      await signInWithPhone(phone);
    };
  }

  const codeForm = document.getElementById('codeForm');
  if (codeForm) {
    codeForm.onsubmit = async (e) => {
      e.preventDefault();
      const code = document.getElementById('codeInput').value;
      await confirmPhoneCode(code);
    };
  }

  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) signOutBtn.onclick = signOutUser;
}

// تحسين عرض الشارات
function updateBadgesDisplay() {
  els.badges.innerHTML = userState.badges.map(b => '<span class="badge" style="font-size:15px;padding:6px 14px;display:inline-block;margin:2px 0">' + b + '</span>').join('');
}

// دالة startLearning المفقودة
function startLearning() {
  const topic = els.topicInput.value.trim();
  if (!topic) return alert('أدخل موضوعاً للبدء');
  addUserMessage('أريد أن أتعلم عن: ' + topic);
  els.topicArea.style.display = 'none';
  // يمكن إضافة منطق إضافي هنا
}

// تهيئة التطبيق
async function init() {
  initWelcome();
  initHelpButton();
  initTips();
  initLangSelector();

  setupInputListeners();
  setupUploadListeners();
  setupDragDrop();
  setupEditRepeat();
  setupThemeToggle();
  setupClearMemory();
  setupExport();
  setupModeSwitches();
  setupAuth();

  // تحميل الذاكرة المحفوظة
  const saved = await loadMemory();
  if (saved) {
    history = saved.history || [];
    userState = saved.userState || userState;
    if (saved.theme) setTheme(saved.theme);
    renderHistory();
    updateStatsUI();
    ensureBadges();
  }

  // تطبيق اللغة
  let lang = localStorage.getItem('nibrasLang') || 'ar';
  applyLang();
  const langSelect = document.querySelector('select');
  if (langSelect) langSelect.value = lang;
}

export { init };