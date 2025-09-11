/* =========================================================
   Mozbe AI — Site Scripts
   - Nav toggle (mobile)
   - Metrics count-up on view
   - Contact form (Formspree)
   - Hero chat animation (general booking demo)
   - Footer year
   ========================================================= */

/* ---------- Nav toggle ---------- */
(() => {
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.getElementById('menu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
})();

/* ---------- Metrics count-up ---------- */
(() => {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const animate = (el) => {
    const target = parseFloat(el.dataset.count);
    if (Number.isNaN(target)) return;
    let cur = 0;
    const step = () => {
      const inc = (target / 50) || 1; // ~50 frames
      cur = Math.min(target, cur + inc);
      el.textContent = (Math.round(cur * 10) / 10).toString();
      if (cur < target) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.35 });

  counters.forEach(c => io.observe(c));
})();

/* ---------- Contact form (Formspree) ---------- */
(() => {
  const form = document.getElementById('contact');
  if (!form) return;
  const status = document.querySelector('.form__status');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (status) status.textContent = 'Sending…';
    try {
      const formData = new FormData(form);
      const resp = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });
      if (resp.ok) {
        if (status) status.textContent = 'Thanks! We’ll get back to you shortly.';
        form.reset();
      } else {
        if (status) status.textContent = 'Something went wrong. Please email benjamin.j.shin@vanderbilt.edu';
      }
    } catch (err) {
      if (status) status.textContent = 'Network error. Please email benjamin.j.shin@vanderbilt.edu';
    }
  });
})();

/* ---------- Hero chat animation (general booking) ---------- */
(() => {
  const hero = document.querySelector('#top');
  if (!hero) return;

  const chat = hero.querySelector('.chat');
  const replayBtn = hero.querySelector('.chat__replay');
  if (!chat) return;

  const CONVO = [
    { role: 'ai',   text: 'Hi! I’m Mozbe—can I help you book a nail appointment?' },
    { role: 'user', text: 'Yes, tomorrow after 3pm.' },
    { role: 'ai',   text: 'Great—Gel manicure at 3:30pm or 4:15pm. Preferences?' },
    { role: 'user', text: '4:15pm with Kim.' },
    { role: 'ai',   text: 'Got it. Please confirm your name and phone.' },
    { role: 'user', text: 'Alex Chen, (555) 987-1212.' },
    { role: 'ai',   text: 'Thanks! Sending confirmation + calendar invite.' },
    { role: 'confirm', text: '4:15pm booked ✔︎ Calendar invite sent' }
  ];

  const TYPE_SPEED_MS = 16;
  const AI_THINK_MS = [700, 1100];
  const USER_DELAY_MS = 350;

  let running = false;
  let abortController = null;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const rand = (min, max) => Math.floor(min + Math.random() * (max - min));
  const autoScroll = () => { chat.scrollTop = chat.scrollHeight; };

  function makeBubble(role, text = '') {
    if (role === 'confirm') {
      const el = document.createElement('div');
      el.className = 'confirm';
      el.textContent = text;
      return el;
    }
    const el = document.createElement('div');
    el.className = `bubble bubble--${role}`;
    el.textContent = '';
    return el;
  }

  function typingIndicator() {
    const w = document.createElement('div');
    w.className = 'typing bubble bubble--ai';
    for (let i = 0; i < 3; i++) {
      const d = document.createElement('span');
      d.className = 'typing__dot';
      w.appendChild(d);
    }
    return w;
  }

  async function typeText(el, text, signal) {
    if (prefersReduced) { el.textContent = text; autoScroll(); return; }
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
    chat.innerHTML = '';

    try {
      for (const msg of CONVO) {
        if (signal.aborted) break;
        if (msg.role === 'ai') {
          const typing = typingIndicator();
          chat.appendChild(typing); autoScroll();
          await sleep(rand(...AI_THINK_MS));
          typing.remove();
          const b = makeBubble('ai');
          chat.appendChild(b);
          await typeText(b, msg.text, signal);
        } else if (msg.role === 'user') {
          await sleep(USER_DELAY_MS);
          const b = makeBubble('user');
          chat.appendChild(b);
          await typeText(b, msg.text, signal);
        } else {
          await sleep(250);
          chat.appendChild(makeBubble('confirm', msg.text));
          autoScroll();
        }
      }
    } catch (_) {
      /* ignore abort */
    } finally {
      running = false;
    }
  }

  function replay() {
    if (running && abortController) abortController.abort();
    playConversation();
  }

  // Autostart when visible (with backup timer)
  let started = false;
  function startOnce(){ if (started) return; started = true; playConversation(); }
  const rect = hero.getBoundingClientRect();
  const inViewport = rect.top < (window.innerHeight || document.documentElement.clientHeight) && rect.bottom > 0;
  if (inViewport) startOnce();

  if ('IntersectionObserver' in window && !started) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting){ startOnce(); observer.disconnect(); } });
    }, { threshold: 0.1 });
    observer.observe(hero);
  }
  setTimeout(startOnce, 1500);

  if (replayBtn) replayBtn.addEventListener('click', replay);
})();

/* ---------- Footer year ---------- */
(() => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
