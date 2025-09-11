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

