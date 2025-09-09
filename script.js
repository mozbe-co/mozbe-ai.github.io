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

// Year in footer
document.getElementById('year').textContent = new Date().getFullYear().toString();
