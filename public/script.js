/* ═══════════════════════════════════════════════════
   NEXUS-7 CYBERPUNK CHATBOT — MAIN SCRIPT
   ═══════════════════════════════════════════════════ */

// ─── State ───────────────────────────────────────
const state = {
  sessionId: generateSessionId(),
  sessions: [],
  isTyping: false,
  messageCount: 0,
};

// ─── DOM Elements ────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const chatMessages = $('#chatMessages');
const messageInput = $('#messageInput');
const sendBtn = $('#sendBtn');
const charCount = $('#charCount');
const welcomeScreen = $('#welcomeScreen');
const hudTime = $('#hudTime');
const sessionList = $('#sessionList');
const newSessionBtn = $('#newSessionBtn');
const glitchOverlay = $('#glitchOverlay');
const rainContainer = $('#rainContainer');
const particleCanvas = $('#particleCanvas');

// ─── Initialize ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initRain();
  initParticles();
  initEventListeners();
  initSession();
  initAudioContext();
});

// ─── Clock ───────────────────────────────────────
function initClock() {
  function update() {
    const now = new Date();
    hudTime.textContent = now.toLocaleTimeString('en-US', { hour12: false });
  }
  update();
  setInterval(update, 1000);
}

// ─── Rain Effect ─────────────────────────────────
function initRain() {
  const count = 60;
  for (let i = 0; i < count; i++) {
    const drop = document.createElement('div');
    drop.className = 'raindrop';
    drop.style.left = Math.random() * 100 + '%';
    drop.style.height = Math.random() * 60 + 40 + 'px';
    drop.style.animationDuration = Math.random() * 1.5 + 1 + 's';
    drop.style.animationDelay = Math.random() * 3 + 's';
    drop.style.opacity = Math.random() * 0.3 + 0.1;
    rainContainer.appendChild(drop);
  }
}

// ─── Particle System ─────────────────────────────
function initParticles() {
  const ctx = particleCanvas.getContext('2d');
  let particles = [];
  const PARTICLE_COUNT = 40;

  function resize() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * particleCanvas.width;
      this.y = Math.random() * particleCanvas.height;
      this.size = Math.random() * 1.5 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.4 + 0.1;
      this.hue = Math.random() > 0.5 ? 180 : 290; // cyan or purple
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.opacity += (Math.random() - 0.5) * 0.01;
      this.opacity = Math.max(0.05, Math.min(0.5, this.opacity));
      if (this.x < 0 || this.x > particleCanvas.width ||
          this.y < 0 || this.y > particleCanvas.height) {
        this.reset();
      }
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 100%, 60%, ${this.opacity})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    
    // Draw connection lines between close particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${0.05 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
}

// ─── Audio System (UI Sounds) ────────────────────
let audioCtx;

function initAudioContext() {
  document.addEventListener('click', () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, { once: true });
}

function playSound(type) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  switch (type) {
    case 'send':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
      break;
    case 'receive':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
      break;
    case 'click':
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
      break;
  }
}

// ─── Glitch Effect ───────────────────────────────
function triggerGlitch() {
  glitchOverlay.classList.add('active');
  setTimeout(() => glitchOverlay.classList.remove('active'), 200);
}

// ─── Sessions ────────────────────────────────────
function generateSessionId() {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

function initSession() {
  const session = {
    id: state.sessionId,
    name: `Session ${state.sessions.length + 1}`,
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
  state.sessions.push(session);
  renderSessions();
}

function renderSessions() {
  sessionList.innerHTML = '';
  state.sessions.forEach(s => {
    const el = document.createElement('div');
    el.className = `session-item ${s.id === state.sessionId ? 'active' : ''}`;
    el.textContent = s.name;
    el.title = s.time;
    el.addEventListener('click', () => {
      state.sessionId = s.id;
      playSound('click');
      renderSessions();
    });
    sessionList.appendChild(el);
  });
}

// ─── Event Listeners ─────────────────────────────
function initEventListeners() {
  // Auto-resize textarea
  messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
    charCount.textContent = `${messageInput.value.length} / 4000`;
    sendBtn.disabled = !messageInput.value.trim() || state.isTyping;
  });

  // Send on Enter (Shift+Enter for newline)
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) sendMessage();
    }
  });

  // Send button click
  sendBtn.addEventListener('click', () => {
    if (!sendBtn.disabled) sendMessage();
  });

  // New session
  newSessionBtn.addEventListener('click', () => {
    playSound('click');
    triggerGlitch();
    state.sessionId = generateSessionId();
    state.messageCount = 0;
    chatMessages.innerHTML = '';
    chatMessages.appendChild(createWelcomeScreen());
    welcomeScreen && (welcomeScreen.style.display = 'flex');
    initSession();
  });

  // Quick commands
  document.querySelectorAll('.quick-cmd').forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.dataset.cmd;
      messageInput.value = cmd;
      messageInput.dispatchEvent(new Event('input'));
      playSound('click');
      sendMessage();
    });
  });
}

function createWelcomeScreen() {
  const div = document.createElement('div');
  div.className = 'welcome-screen';
  div.id = 'welcomeScreen';
  div.innerHTML = `
    <div class="welcome-avatar">
      <img src="ai_avatar.png" alt="NEXUS-7 AI" class="welcome-avatar-img">
      <div class="avatar-ring"></div>
      <div class="avatar-ring ring-2"></div>
      <div class="avatar-ring ring-3"></div>
    </div>
    <h1 class="welcome-title" data-text="NEXUS-7">NEXUS-7</h1>
    <p class="welcome-subtitle">NEURAL ARTIFICIAL INTELLIGENCE CONSTRUCT</p>
    <div class="welcome-divider">
      <span class="divider-line"></span>
      <span class="divider-icon">◆</span>
      <span class="divider-line"></span>
    </div>
    <p class="welcome-desc">Greetings, netrunner. I am NEXUS-7, your AI companion operating from the underbelly of Neo-Tokyo's data grid. Ask me anything — from code to cosmos, from hacking to history.</p>
    <div class="welcome-tags">
      <span class="tag">AI POWERED</span>
      <span class="tag">NEURAL NETWORK</span>
      <span class="tag">QWEN 2.5</span>
      <span class="tag">72B PARAMS</span>
    </div>
  `;
  return div;
}

// ─── Send Message ────────────────────────────────
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || state.isTyping) return;

  // Hide welcome screen
  const ws = document.getElementById('welcomeScreen');
  if (ws) ws.remove();

  state.isTyping = true;
  sendBtn.disabled = true;
  playSound('send');
  triggerGlitch();

  // Add user message
  addMessage(text, 'user');

  // Clear input
  messageInput.value = '';
  messageInput.style.height = 'auto';
  charCount.textContent = '0 / 4000';

  // Show typing indicator
  const typingEl = showTyping();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        sessionId: state.sessionId,
      }),
    });

    const data = await response.json();

    // Remove typing indicator
    typingEl.remove();

    if (response.ok) {
      playSound('receive');
      addMessage(data.reply, 'bot');
    } else {
      addMessage(data.error || 'Neural link disrupted. Signal lost.', 'bot', true);
    }
  } catch (err) {
    typingEl.remove();
    addMessage('[SIGNAL_LOST] Connection to neural network failed. Check if the server is running.', 'bot', true);
  }

  state.isTyping = false;
  sendBtn.disabled = !messageInput.value.trim();
  messageInput.focus();
}

// ─── Add Message to Chat ─────────────────────────
function addMessage(text, sender, isError = false) {
  state.messageCount++;
  const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const row = document.createElement('div');
  row.className = `message-row ${sender}-row`;

  const avatar = document.createElement('div');
  avatar.className = `message-avatar ${sender}-avatar`;

  if (sender === 'bot') {
    avatar.innerHTML = `<img src="ai_avatar.png" alt="NEXUS-7">`;
  } else {
    avatar.textContent = 'YOU';
  }

  const content = document.createElement('div');
  content.className = 'message-content';

  const bubble = document.createElement('div');
  bubble.className = `message-bubble ${sender}-bubble ${isError ? 'error-bubble' : ''}`;

  if (sender === 'bot') {
    bubble.innerHTML = formatBotMessage(text);
  } else {
    bubble.textContent = text;
  }

  const meta = document.createElement('div');
  meta.className = 'message-meta';
  meta.innerHTML = `
    <span class="meta-name">${sender === 'bot' ? 'NEXUS-7' : 'YOU'}</span>
    <span class="meta-time">${now}</span>
  `;

  content.appendChild(bubble);
  content.appendChild(meta);
  row.appendChild(avatar);
  row.appendChild(content);

  chatMessages.appendChild(row);
  scrollToBottom();

  // Update session name with first user message
  if (sender === 'user' && state.messageCount === 1) {
    const currentSession = state.sessions.find(s => s.id === state.sessionId);
    if (currentSession) {
      currentSession.name = text.length > 28 ? text.substring(0, 28) + '...' : text;
      renderSessions();
    }
  }
}

// ─── Format Bot Message ──────────────────────────
function formatBotMessage(text) {
  // Escape HTML first
  let formatted = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Format code blocks
  formatted = formatted.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Format inline code
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Format bold
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Format italic
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Format signal tags like [SIGNAL_BOOST]
  formatted = formatted.replace(/\[([A-Z_]+)\]/g, '<span class="signal-tag">[$1]</span>');

  // Format line breaks
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}

// ─── Typing Indicator ────────────────────────────
function showTyping() {
  const typing = document.createElement('div');
  typing.className = 'typing-indicator';
  typing.innerHTML = `
    <div class="message-avatar bot-avatar">
      <img src="ai_avatar.png" alt="NEXUS-7">
    </div>
    <div class="typing-bubble">
      <div class="typing-dots">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
      <span class="typing-text">NEXUS-7 IS PROCESSING...</span>
    </div>
  `;
  chatMessages.appendChild(typing);
  scrollToBottom();
  return typing;
}

// ─── Scroll to Bottom ────────────────────────────
function scrollToBottom() {
  requestAnimationFrame(() => {
    chatMessages.scrollTo({
      top: chatMessages.scrollHeight,
      behavior: 'smooth',
    });
  });
}
