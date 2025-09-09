const toggle = document.querySelector('.nav__toggle');
const menu = document.getElementById('menu');
if (toggle && menu){
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

// Animated metrics count-up
const counters = document.querySelectorAll('[data-count]');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting){
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      let cur = 0;
      const step = () => {
        const inc = (target/50) || 1;
        cur = Math.min(target, cur + inc);
        el.textContent = (Math.round(cur*10)/10).toString();
        if (cur < target) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      io.unobserve(el);
    }
  });
},{threshold:0.5});
counters.forEach(c => io.observe(c));

// Contact form (Formspree friendly)
const form = document.getElementById('contact');
const status = document.querySelector('.form__status');
if (form){
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = 'Sending…';
    try {
      const formData = new FormData(form);
      const resp = await fetch(form.action, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } });
      if (resp.ok){
        status.textContent = 'Thanks! We will get back to you shortly.';
        form.reset();
      } else {
        status.textContent = 'Something went wrong. Please email hello@mozbe.ai';
      }
    } catch(err){
      status.textContent = 'Network error. Please email hello@mozbe.ai';
    }
  });
}
(function () {
  // ===== Conversation script =====
  // role: 'ai' or 'user', text: string
  const CONVO = [
    { role: 'ai',   text: 'Hi, I handle intake for your firm. Were you injured in an accident?' },
    { role: 'user', text: 'Yes, rear-ended yesterday.' },
    { role: 'ai',   text: 'Understood. Did you receive medical treatment?' },
    { role: 'user', text: 'Yes, ER visit. Neck pain.' },
    { role: 'ai',   text: 'I can book a free consult—tomorrow 2:30pm works. Confirm?' },
    { role: 'user', text: 'Yes.' },
    { role: 'confirm', text: 'Consultation booked ✔︎' }
  ];

  // Tunables
  const TYPE_SPEED_MS = 16;          // per character
  const AI_THINK_MS = [700, 1100];   // min/max delay before AI messages
  const USER_DELAY_MS = 400;         // slight delay for user messages
  const START_ON_VIEW = true;

  const hero = document.querySelector('#top');
  const chat = hero?.querySelector('.chat');
  const replayBtn = hero?.querySelector('.chat__replay');

  if (!hero || !chat) return;

  let running = false;
  let abortController = null;

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function rand(min, max) {
    return Math.floor(min + Math.random() * (max - min));
  }

  function autoScroll() {
    chat.scrollTop = chat.scrollHeight;
  }

  function createBubble(role, text = '') {
    if (role === 'confirm') {
      const el = document.createElement('div');
      el.className = 'confirm';
      el.textContent = text;
      return el;
    }
    const el = document.createElement('div');
    el.className = `bubble bubble--${role}`;
    el.textContent = text;
    return el;
  }

  function createTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'typing';
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.className = 'typing__dot';
      wrap.appendChild(dot);
    }
    return wrap;
  }

  async function typeText(el, text, signal) {
    // Respect reduced motion: just drop full text
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      el.textContent = text;
      autoScroll();
      return;
    }
    for (let i = 0; i < text.length; i++) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      el.textContent += text[i];
      autoScroll();
      await sleep(TYPE_SPEED_MS);
    }
  }

  async function playConversation() {
    if (running) return;
    running = true;
    abortController = new AbortController();
    const { signal } = abortController;

    // Reset
    chat.innerHTML = '';

    try {
      for (const msg of CONVO) {
        if (signal.aborted) break;

        if (msg.role === 'ai') {
          const typing = createTyping();
          chat.appendChild(typing);
          autoScroll();
          await sleep(rand(...AI_THINK_MS));
          typing.remove();

          const bubble = createBubble('ai');
          chat.appendChild(bubble);
          await typeText(bubble, msg.text, signal);

        } else if (msg.role === 'user') {
          await sleep(USER_DELAY_MS);
          const bubble = createBubble('user');
          chat.appendChild(bubble);
          await typeText(bubble, msg.text, signal);

        } else if (msg.role === 'confirm') {
          await sleep(300);
          const conf = createBubble('confirm', msg.text);
          chat.appendChild(conf);
          autoScroll();
        }
      }
    } catch (e) {
      // Silently ignore aborts
    } finally {
      running = false;
    }
  }

  function replay() {
    if (running && abortController) abortController.abort();
    playConversation();
  }

  // Start when in view (for performance) or immediately
  if (START_ON_VIEW && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          playConversation();
          io.disconnect();
        }
      });
    }, { threshold: 0.35 });
    io.observe(hero);
  } else {
    playConversation();
  }

  // Replay button
  if (replayBtn) {
    replayBtn.addEventListener('click', replay);
  }
})();

// Year in footer
document.getElementById('year').textContent = new Date().getFullYear().toString();
