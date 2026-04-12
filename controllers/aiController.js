const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function buildPrompt(feature, payload = {}) {
  if (feature === 'title') {
    const content = String(payload.body || '').trim().slice(0, 600);
    if (!content) throw new Error('Write some content first so AI can suggest a title.');

    return `You are a blog title expert. Based on the blog content below, suggest exactly 3 catchy, engaging blog titles.
Return ONLY a numbered list like:
1. Title one
2. Title two
3. Title three

Blog content:
"""
${content}
"""`;
  }

  if (feature === 'ideas') {
    const topic = String(payload.titleOrTopic || '').trim().slice(0, 200);
    if (!topic) throw new Error('Enter a title or topic first so AI can suggest ideas.');

    return `You are a creative blog writing assistant. For the blog topic below, suggest 3 short writing ideas or angles the author could explore. Each idea should be 1-2 sentences.

Return ONLY a numbered list like:
1. Idea one
2. Idea two
3. Idea three

Topic: "${topic}"`;
  }

  if (feature === 'summary') {
    const content = String(payload.body || '').trim().slice(0, 1200);
    if (!content || content.length < 80) {
      throw new Error('Write at least a few sentences before generating a summary.');
    }

    return `You are a professional editor. Summarize the blog post below in exactly 2-3 concise sentences. Return ONLY the summary, no extra text.

Blog post:
"""
${content}
"""`;
  }

  if (feature === 'tags') {
    const content = `${payload.title || ''} ${payload.body || ''}`.trim().slice(0, 800);
    if (!content) throw new Error('Add a title or content first so AI can suggest tags.');

    return `You are a content categorization expert. Based on the blog content below, suggest exactly 5 relevant tags/keywords.
Return ONLY a comma-separated list like: tech, coding, javascript, tutorial, beginner

Blog content:
"""
${content}
"""`;
  }

  throw new Error('Unsupported AI feature requested.');
}

async function generateAiContent(req, res) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Gemini API key is missing. Add GEMINI_API_KEY to the backend .env file and restart the server.',
      });
    }

    const payload = req.body || {};
    const prompt = buildPrompt(payload.feature, payload);
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 300,
          temperature: 0.8,
        },
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data?.error?.message || 'Gemini AI request failed',
      });
    }

    return res.json({
      success: true,
      result: data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '',
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || 'AI request failed' });
  }
}

module.exports = { generateAiContent };
