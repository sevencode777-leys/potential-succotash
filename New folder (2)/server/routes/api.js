const express = require('express');
const router = express.Router();
const fetchWithRetry = require('../utils/fetchWithRetry');
const admin = require('../config/firebase');

// Function to generate system prompt based on mode
function getSystemPrompt(mode) {
  const teamInfo = 'تم تطوير هذا النظام بواسطة استوديو seven_code7، بمساهمة أساسية من ليث، محمود، ومعتصم.';
  const prompts = {
    learn: teamInfo + '\nأنت معلم افتراضي متقدم في "نبراس". اشرح بوضوح، استخدم أمثلة حقيقية وأسئلة سقراطية، وقدّم خطوات عملية مختصرة.',
    examples: teamInfo + '\nقدّم 3-4 أمثلة متنوعة مع تطبيقات عملية وتخيل بصري مختصر.',
    practice: teamInfo + '\nأنشئ تمارين متدرجة مع تصحيح فوري ونصائح.',
    workshop: teamInfo + '\nخطة تنفيذ خطوة بخطوة مع تحذير من الأخطاء الشائعة.'
  };
  return prompts[mode] || prompts.learn;
}

// Optional Firebase auth middleware
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next(); // Proceed if no token
  const token = authHeader.split(' ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// POST /chat endpoint
router.post('/chat', authMiddleware, async (req, res) => {
  const { provider, text, images, context, mode } = req.body;

  // Validate required fields
  if (!provider || !text || !Array.isArray(images) || !Array.isArray(context) || !mode) {
    return res.status(400).json({ success: false, error: 'Missing or invalid required fields: provider, text, images (array), context (array), mode' });
  }

  // Validate provider
  if (!['gemini', 'openai'].includes(provider)) {
    return res.status(400).json({ success: false, error: 'Invalid provider. Must be "gemini" or "openai"' });
  }

  const sys = getSystemPrompt(mode);
  let body, url, headers;

  if (provider === 'gemini') {
    const contents = [];
    // Add system prompt as initial user message
    contents.push({ role: 'user', parts: [{ text: sys }] });
    contents.push({ role: 'model', parts: [{ text: 'فهمت.' }] }); // Acknowledge system prompt

    // Add context messages
    for (const m of context) {
      contents.push({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text || '' }] });
    }

    // Add user message with text and images
    const parts = [{ text: text }];
    for (const img of images) {
      // Extract MIME type and base64 data from data URL
      const [mimePart, dataPart] = img.split(',');
      const mimeType = mimePart.split(':')[1].split(';')[0];
      const data = dataPart;
      parts.push({ inline_data: { mime_type: mimeType, data: data } });
    }
    contents.push({ role: 'user', parts });

    body = {
      contents,
      generationConfig: { temperature: 0.8, topK: 40, topP: 0.95, maxOutputTokens: 1024 }
    };
    url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    headers = { 'Content-Type': 'application/json' };
  } else if (provider === 'openai') {
    const messages = [{ role: 'system', content: sys }];

    // Add context messages
    for (const m of context) {
      messages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text || '' });
    }

    // Add user message with text and images
    const userContent = [{ type: 'text', text: text }];
    for (const img of images) {
      userContent.push({ type: 'image_url', image_url: { url: img } });
    }
    messages.push({ role: 'user', content: userContent });

    body = {
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7
    };
    url = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    };
  }

  try {
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      timeout: 30000, // 30 seconds
      retries: 3
    });

    const data = await response.json();

    if (!response.ok) {
      return res.json({ success: false, error: data.error?.message || 'API error' });
    }

    let aiText;
    if (provider === 'gemini') {
      aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      aiText = data.choices?.[0]?.message?.content || '';
    }

    res.json({ success: true, text: aiText });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;