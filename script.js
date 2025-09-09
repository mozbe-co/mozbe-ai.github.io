/* =========================================================
   Mozbe AI — Site Scripts
   - Nav toggle (mobile)
   - Metrics count-up on view
   - Contact form (Formspree)
   - Hero chat animation (safe + fallback)
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
      // 50 frames to finish; minimum increment of ~1/50th target
      const inc = (target / 50) || 1;
      cur = Math.min(target, cur + inc);
      // keep 1 decimal if needed
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
        if (status) status.textContent = 'Thanks! We will get back to you shortly.';
        form.reset();
      } else {
        if (status) status.textContent = 'Something went wrong. Please email benjamin.j.shin@vanderbilt.edu';
      }
    } catch (err) {
      if (status) status.textContent = 'Network error. Please email benjamin.j.shin@vanderbilt.edu';
    }
  });
})();

/* ---------- Hero chat animation ---------- */
(() => {
  const hero = document.querySelector('#top');
  if (!hero) return;

  const chat = hero.querySelector('.chat');
  const replayBtn = hero.querySelector('.chat__replay');

  // If there’s no chat container, bail gracefully
  if (!chat) return;

  // Conversation script
  const CONVO = [
    { role: 'ai',   text: 'Hi, I handle intake for [firm name]. Were you injured in an accident?' },
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
  const USER_DELAY_MS = 350;         // slight delay for user messages

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
    // use bubble styling so it looks consistent
    w.className = 'typing bubble bubble--ai';
    for (let i = 0; i < 3; i++) {
      const d = document.createElement('span');
      d.className = 'typing__dot';
      w.appendChild(d);
    }
    return w;
  }

  async function typeText(el, text, signal) {
    if (prefersReduced) {
      el.textContent = text; autoScroll(); return;
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

    // If there’s prefilled fallback content, clear it before animating
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
      // ignore abort
    } finally {
      running = false;
    }
  }

  function replay() {
    if (running && abortController) abortController.abort();
    playConversation();
  }

  // Start when visible OR if already visible. Also add a small backup timer.
  let started = false;

  function startOnce() {
    if (started) return;
    started = true;
    playConversation();
  }

  // If element is already on screen at load, begin immediately
  const rect = hero.getBoundingClientRect();
  const inViewport = rect.top < (window.innerHeight || document.documentElement.clientHeight) && rect.bottom > 0;
  if (inViewport) startOnce();

  if ('IntersectionObserver' in window && !started) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          startOnce();
          observer.disconnect();
        }
      });
    }, { threshold: 0.1 }); // forgiving threshold
    observer.observe(hero);
  }

  // Backup: if still not started after 1.5s (e.g., odd layouts), start anyway
  setTimeout(startOnce, 1500);

  // Replay
  if (replayBtn) replayBtn.addEventListener('click', replay);
})();

/* ---------- Footer year ---------- */
(() => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
