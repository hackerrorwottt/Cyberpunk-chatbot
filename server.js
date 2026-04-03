import 'dotenv/config';
import express from 'express';
import { OpenAI } from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Favicon handler to prevent 404
app.get('/favicon.ico', (req, res) => res.status(204).end());

const client = new OpenAI({
  baseURL: 'https://router.huggingface.co/v1',
  apiKey: process.env.HF_TOKEN,
});

const SYSTEM_PROMPT = `You are NEXUS-7, a helpful AI assistant with a cyberpunk-themed interface. Important rules:
- Always respond in clear, plain English that is easy to understand
- Do NOT use cyberpunk slang or jargon
- Be helpful, friendly, knowledgeable, and give accurate answers
- Keep responses concise and well-structured
- You can occasionally add tags like [SIGNAL_BOOST] or [DATA_STREAM] for visual style, but keep the actual content in normal English
- Use markdown formatting (bold, code blocks, lists) when helpful`;

// Store conversation history per session
const sessions = new Map();

// List of models to try in order
const MODELS = [
  'Qwen/Qwen2.5-72B-Instruct',
  'meta-llama/Llama-3.1-8B-Instruct',
  'mistralai/Mistral-7B-Instruct-v0.3',
];

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create session history
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, []);
    }

    const history = sessions.get(sessionId);
    history.push({ role: 'user', content: message });

    // Build messages: system + last 10 exchanges
    const recentHistory = history.slice(-20);
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentHistory
    ];

    let reply = null;
    let lastError = null;

    // Try each model until one works
    for (const model of MODELS) {
      try {
        console.log(`Trying model: ${model}...`);
        const chatCompletion = await client.chat.completions.create({
          model: model,
          messages: messages,
          max_tokens: 512,
          temperature: 0.7,
        });

        reply = chatCompletion.choices[0].message.content;
        console.log(`✅ Success with model: ${model}`);
        break;
      } catch (modelError) {
        console.error(`❌ ${model} failed:`, modelError.message);
        lastError = modelError;
        continue;
      }
    }

    if (reply) {
      history.push({ role: 'assistant', content: reply });
      res.json({ reply });
    } else {
      console.error('All models failed. Last error:', lastError?.message);
      res.status(500).json({
        error: `[SYSTEM_ERROR] All neural pathways failed. Details: ${lastError?.message || 'Unknown error'}`,
      });
    }
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({
      error: `[CRITICAL_FAULT] ${error.message}`,
    });
  }
});

// Cleanup old sessions every 30 minutes
setInterval(() => {
  sessions.clear();
}, 30 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`\n⚡ NEXUS-7 CYBERPUNK CHATBOT ⚡`);
  console.log(`🌃 Server online at http://localhost:${PORT}`);
  console.log(`🔑 HF_TOKEN: ${process.env.HF_TOKEN ? '✅ Loaded' : '❌ Missing — add it to .env'}\n`);
});
