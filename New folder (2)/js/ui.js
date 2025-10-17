// js/ui.js

// UI state
let userState = {
  questionsAsked: 0, points: 0, level: 1,
  badges: ['🌟 المبتدئ'],
  currentMode: 'learn',
};

let lang = localStorage.getItem('nibrasLang') || 'ar';

const LANGS = {
  ar: {
    welcome: '👋 أهلاً بك في نبراس!<br>منصة التعلم الذكية.<br><span style="font-size:1rem">seven_code7</span>',
    help: 'مساعدة',
    copy: 'نسخ الإجابة',
    more: 'عرض المزيد',
    session: 'مدة الجلسة',
    send: 'إرسال 🚀',
    upload: '📎 صورة',
    edit: '✏ تحرير',
    repeat: '🔁 تكرار',
    clear: '🧹 مسح الذاكرة',
    export: '⬇ تصدير',
    theme: '🌓 تبديل النمط',
    stats: ['أسئلة تم الإجابة عليها','مستوى التعلم','النقاط المكتسبة','مدة آخر استجابة'],
    hint: 'اسحب وأسقط الصور هنا. اضغط على الصورة للمعاينة.',
    features: ['ذاكرة محلية مع ضغط آلي عند الحاجة + زر مسح الذاكرة.','إرسال نصوص وصور Base64/Blob. معاينة مصغّرة. عرض مصغّر تلقائي.','رد متدرّج + مؤشر "يكتب…". ذاكرة جلسة ذكية مع تقليم تلقائي.','وضع فاتح/داكن. واجهة مستجيبة بالكامل للموبايل والكمبيوتر.','تحسين الأداء عبر دفعات DOM وإعادة استخدام العناصر.','توافق API مرن عبر طبقة sendToAI قابلة للتبديل.','تحرير آخر رسالة أو تكرارها. طابع زمني لكل رسالة.'],
    tools: ['📖 المعلم الافتراضي','💡 مولد الأمثلة','✍ التدريب والاختبار','🔬 ورشة العمل','📅 المخطط الدراسي'],
    progress: '🏆 تقدمك',
    youtube: 'انضم للمحتوى التعليمي المتقدم',
    subscribe: '🔔 اشترك',
    explore: 'استكشف المحتوى',
    badges: '🌟 المبتدئ',
    helpTitle: 'دليل استخدام نبراس',
    helpList: ['اكتب سؤالك أو أرفق صورة واضغط إرسال.','استخدم الأدوات الجانبية لتوليد أمثلة أو تمارين أو خطة.','يمكنك تحرير أو تكرار آخر رسالة بسهولة.','الشارات تظهر حسب إنجازك وتقدّمك.','تصدير واسترجاع الجلسة متاح من الأعلى.','استفد من التلميحات الدراسية في أسفل الصفحة.'],
    helpEnd: 'نتمنى لك النجاح!',
    tips: ['قسّم المهام الكبيرة إلى أجزاء صغيرة ليسهل إنجازها.','استخدم تقنية بومودورو لزيادة التركيز.','راجع ملخص الدرس قبل حل الواجبات.','اكتب أسئلتك أثناء الدراسة لتسأل عنها لاحقًا.','خذ فواصل قصيرة لتحسين الاستيعاب.','استخدم الشارات لتحفيز نفسك.','لا تتردد في طلب شرح إضافي لأي نقطة غامضة.']
  },
  en: {
    welcome: "👋 Welcome to Nibras!<br>Smart learning platform.<br><span style='font-size:1rem'>seven_code7</span>",
    help: 'Help',
    copy: 'Copy Answer',
    more: 'Show More',
    session: 'Session Duration',
    send: 'Send 🚀',
    upload: '📎 Image',
    edit: '✏ Edit',
    repeat: '🔁 Repeat',
    clear: '🧹 Clear Memory',
    export: '⬇ Export',
    theme: '🌓 Toggle Theme',
    stats: ['Answered Questions','Learning Level','Points','Last Response Time'],
    hint: 'Drag and drop images here. Click image to preview.',
    features: ['Local memory with auto compression + clear button.','Send text and Base64/Blob images. Preview thumbnails.','Progressive AI reply + typing indicator. Smart session memory.','Light/Dark mode. Fully responsive for mobile and desktop.','Performance via DOM batching and element reuse.','Flexible API via sendToAI layer.','Edit or repeat last message. Timestamp for each message.'],
    tools: ['📖 Virtual Tutor','💡 Example Generator','✍ Practice & Test','🔬 Workshop','📅 Study Planner'],
    progress: '🏆 Your Progress',
    youtube: 'Join advanced educational content',
    subscribe: '🔔 Subscribe',
    explore: 'Explore Content',
    badges: '🌟 Beginner',
    helpTitle: 'Nibras Usage Guide',
    helpList: ['Type your question or attach an image and click Send.','Use sidebar tools for examples, practice, or planning.','You can edit or repeat last message easily.','Badges appear as you progress.','Export/restore session from top controls.','Benefit from study tips at the bottom.'],
    helpEnd: 'Wishing you success!',
    tips: ['Break big tasks into small parts.','Use Pomodoro for focus.','Review lesson summary before homework.','Write your questions while studying.','Take short breaks for better retention.','Use badges to motivate yourself.','Don’t hesitate to ask for extra explanation.']
  },
  tr: {
    welcome: "👋 Nibras'a hoş geldiniz!<br>Akıllı öğrenme platformu.<br><span style='font-size:1rem'>seven_code7</span>",
    help: 'Yardım',
    copy: 'Cevabı Kopyala',
    more: 'Daha Fazla Göster',
    session: 'Oturum Süresi',
    send: 'Gönder 🚀',
    upload: '📎 Resim',
    edit: '✏ Düzenle',
    repeat: '🔁 Tekrarla',
    clear: '🧹 Belleği Temizle',
    export: '⬇ Dışa Aktar',
    theme: '🌓 Tema Değiştir',
    stats: ['Yanıtlanan Sorular','Öğrenme Seviyesi','Puanlar','Son Yanıt Süresi'],
    hint: 'Resimleri buraya sürükleyin. Önizlemek için tıklayın.',
    features: ['Otomatik sıkıştırmalı yerel bellek + temizleme düğmesi.','Metin ve Base64/Blob resim gönderimi. Küçük önizleme.','Aşamalı AI yanıtı + yazma göstergesi. Akıllı oturum belleği.','Açık/Koyu mod. Mobil ve masaüstü için tamamen duyarlı.','DOM toplama ve öğe yeniden kullanımı ile performans.','sendToAI katmanı ile esnek API.','Son mesajı düzenle veya tekrarla. Her mesaj için zaman damgası.'],
    tools: ['📖 Sanal Eğitmen','💡 Örnek Üretici','✍ Pratik & Test','🔬 Atölye','📅 Çalışma Planlayıcı'],
    progress: '🏆 İlerlemeniz',
    youtube: 'Gelişmiş eğitim içeriğine katılın',
    subscribe: '🔔 Abone Ol',
    explore: 'İçeriği Keşfet',
    badges: '🌟 Yeni Başlayan',
    helpTitle: 'Nibras Kullanım Kılavuzu',
    helpList: ['Sorunuzu yazın veya resim ekleyin ve Gönder’e tıklayın.','Yan araçlarla örnek, pratik veya planlama yapın.','Son mesajı kolayca düzenleyebilir veya tekrarlayabilirsiniz.','Rozetler ilerledikçe görünür.','Oturumu üstten dışa aktarın veya geri yükleyin.','Aşağıdaki çalışma ipuçlarından yararlanın.'],
    helpEnd: 'Başarılar dileriz!',
    tips: ['Büyük görevleri küçük parçalara bölün.','Odaklanmak için Pomodoro kullanın.','Ödevden önce ders özetini gözden geçirin.','Çalışırken sorularınızı yazın.','Daha iyi öğrenme için kısa molalar verin.','Kendinizi motive etmek için rozetleri kullanın.','Ek açıklama istemekten çekinmeyin.']
  }
};

// DOM elements
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

// Theme toggling
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
}

// Stats and badges management
function awardPoints(p) {
  userState.points += p;
  animatePoints();
}

function animatePoints() {
  const elp = els.points;
  elp.style.transform = 'scale(1.2)';
  elp.style.color = '#ffd700';
  setTimeout(() => {
    elp.style.transform = 'scale(1)';
    elp.style.color = 'var(--brand)';
  }, 350);
}

function updateStatsUI() {
  els.questions.textContent = userState.questionsAsked;
  els.points.textContent = userState.points;
  const newLevel = Math.floor(userState.points / 100) + 1;
  if (newLevel > userState.level) {
    userState.level = newLevel;
    alert('🎉 مستوى جديد: ' + newLevel);
  }
  els.level.textContent = userState.level;
  const progress = (userState.points % 100);
  els.progress.style.width = progress + '%';
}

function ensureBadges() {
  const b = userState.badges;
  const add = (x) => {
    if (!b.includes(x)) {
      b.push(x);
      alert('🎖 شارة جديدة: ' + x);
    }
  };
  if (userState.questionsAsked >= 5) add('🔥 الفضولي');
  if (userState.questionsAsked >= 20) add('📚 الباحث');
  if (userState.points >= 100) add('⭐ النجم');
  if (userState.points >= 500) add('👑 الخبير');
  if (userState.level >= 5) add('🏆 البطل');
  els.badges.innerHTML = b.map(x => '<span class="badge">' + x + '</span>').join('');
}

// Learning modes
function switchMode(mode) {
  userState.currentMode = mode;
  els.chat.innerHTML = '';
  els.topicArea.style.display = 'none';
  switch (mode) {
    case 'learn':
      els.chatTitle.textContent = '💬 المعلم الافتراضي العميق';
      // Note: addAIMessageStream is in chat.js, assume imported or called via app.js
      break;
    case 'examples':
      els.chatTitle.textContent = '💡 مولد الأمثلة التفاعلية';
      els.topicArea.style.display = 'block';
      // addAIMessageStream('أدخل موضوعاً وسأولّد أمثلة تفاعلية مناسبة.');
      break;
    case 'practice':
      els.chatTitle.textContent = '✍ التدريب والاختبار';
      // addAIMessageStream('اختر موضوعاً وسأبني تمارين متدرجة.');
      break;
    case 'workshop':
      els.chatTitle.textContent = '🔬 ورشة العمل';
      // addAIMessageStream('لنحوّل ما تعلمته إلى خطوات عملية.');
      break;
    case 'planner':
      els.chatTitle.textContent = '📅 المخطط الدراسي الذكي';
      createPlanner();
      break;
  }
  // saveMemory(); // in storage.js
}

function createPlanner() {
  els.chat.innerHTML = '<div class="row"><div class="msg ai"><h3 style="color:var(--brand);margin-bottom:8px">📅 خطتك الدراسية الذكية</h3><div style="margin-top:8px"><input id="goalInput" class="text" placeholder="هدفك التعليمي" /><input id="daysInput" class="text" type="number" min="1" max="365" value="30" style="margin-top:8px" /><button class="btn" style="margin-top:8px" onclick="generatePlan()">إنشاء الخطة</button><div id="planResult" style="margin-top:10px"></div></div></div></div>';
}

function generatePlan() {
  const goal = document.getElementById('goalInput').value.trim();
  const days = document.getElementById('daysInput').value || 30;
  if (!goal) return alert('أدخل الهدف');
  // setTyping(true); startTimer();
  const prompt = 'أنشئ خطة مفصلة لهدف: "' + goal + '" خلال ' + days + ' يوم بفقرات واضحة ومُرقّمة.';
  // try {
  //   const ai = await sendToAI(prompt, [], sessionMemory.slice(-SESSION_LIMIT));
  //   setTyping(false); stopTimer();
  //   document.getElementById('planResult').innerHTML = '<div class="msg ai" style="margin-top:10px">' + ai.replace(/\n/g, '<br>') + '</div>';
  // } catch (e) {
  //   setTyping(false); stopTimer();
  //   document.getElementById('planResult').textContent = 'تعذّر إنشاء الخطة.';
  // }
}

// Language switching
function setLang(l) {
  lang = l;
  localStorage.setItem('nibrasLang', l);
  applyLang();
}

function applyLang() {
  const L = LANGS[lang];
  // Header & Controls
  document.title = lang === 'ar' ? 'نبراس - منصة التعلم الذكية (نسخة محسّنة)' : lang === 'en' ? 'Nibras - Smart Learning Platform' : "Nibras - Akıllı Öğrenme Platformu";
  els.themeBtn.textContent = L.theme;
  els.clearBtn.textContent = L.clear;
  els.exportBtn.textContent = L.export;
  // Stats
  els.questions.nextElementSibling.textContent = L.stats[0];
  els.level.nextElementSibling.textContent = L.stats[1];
  els.points.nextElementSibling.textContent = L.stats[2];
  els.timer.nextElementSibling.textContent = L.stats[3];
  // Sidebar
  document.querySelectorAll('.menu .item').forEach((el, i) => el.textContent = L.tools[i]);
  document.querySelector('.progress').previousElementSibling.textContent = L.progress;
  document.querySelector('.section-title[style*="SEVEN_CODE7"]').textContent = '📺 SEVEN_CODE7';
  document.querySelector('.section-title[style*="SEVEN_CODE7"]').nextElementSibling.textContent = L.youtube;
  document.querySelector('.btn.yt').textContent = L.subscribe;
  document.querySelector('.tools .btn:not(.yt)').textContent = L.explore;
  els.badges.innerHTML = '<span class="badge">' + L.badges + '</span>';
  // Chat
  els.send.textContent = L.send;
  els.upload.textContent = L.upload;
  els.editBtn.textContent = L.edit;
  els.repeatBtn.textContent = L.repeat;
  document.querySelector('.hint').textContent = L.hint;
  // Features
  document.querySelector('.section-title[style*="المزايا"],.section-title[style*="Features"]').textContent = lang === 'ar' ? '⚙ المزايا' : lang === 'en' ? '⚙ Features' : '⚙ Özellikler';
  document.querySelector('.card ul.hint').innerHTML = L.features.map(f => '<li>' + f + '</li>').join('');
}

// Session export/import
function exportSession() {
  const blob = new Blob([JSON.stringify({ history, userState }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'nibras_session.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
  showSuccess('✅ تم تصدير الجلسة بنجاح!');
}

// Memory clearing
function clearMemory() {
  // clearMemory from storage.js
  // localStorage.removeItem('nibras.store');
  // localStorage.removeItem('nibras.store.gz');
}

// Edit/repeat last message
function editLastMessage() {
  // for (let i = history.length - 1; i >= 0; i--) {
  //   if (history[i].role === 'user') {
  //     els.input.value = history[i].text || '';
  //     els.input.focus();
  //     break;
  //   }
  // }
}

function repeatLastMessage() {
  // for (let i = history.length - 1; i >= 0; i--) {
  //   if (history[i].role === 'user') {
  //     els.input.value = history[i].text || '';
  //     sendMessage();
  //     break;
  //   }
  // }
}

// Success message display
function showSuccess(msg) {
  const div = document.createElement('div');
  div.style = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#4CAF50;color:white;padding:12px 20px;border-radius:8px;z-index:2000;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

// YouTube content loading
function loadSevenCodeContent() {
  els.chat.innerHTML = '<div class="row"><div class="msg ai"><h3 style="color:var(--brand);margin-bottom:8px">📺 محتوى SEVEN_CODE7</h3><p class="hint">أحدث الدروس في HTML/CSS, JavaScript, React, AI</p><a class="btn yt" href="https://www.youtube.com/@SEVEN_CODE7" target="_blank">🎥 شاهد الآن</a></div></div>';
}

// Export all UI functions
export {
  setTheme,
  awardPoints,
  animatePoints,
  updateStatsUI,
  ensureBadges,
  switchMode,
  createPlanner,
  generatePlan,
  setLang,
  applyLang,
  exportSession,
  clearMemory,
  editLastMessage,
  repeatLastMessage,
  showSuccess,
  loadSevenCodeContent,
  userState,
  lang,
  LANGS
};