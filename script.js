// ===== Mejoras y dinamismo JS para UX
// - Menú móvil accesible
// - Carrusel con controles accesibles y autoplay/pause
// - Reveal-on-scroll para microinteracciones
// - Scrollspy y otras utilidades

// ===== Helpers
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// ===== Menú móvil
const header = document.getElementById('header');
const nav = document.getElementById('nav');
const hamburger = document.getElementById('hamburger');

function setMenu(open){
  const isOpen = Boolean(open);
  nav.classList.toggle('open', isOpen);
  hamburger.classList.toggle('active', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
}

function toggleMenu(){ setMenu(!nav.classList.contains('open')); }
hamburger.addEventListener('click', toggleMenu);

// Close with ESC when mobile menu open
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('open')) setMenu(false);
});

// Close menu when clicking a link (mobile)
nav.addEventListener('click', (e) => {
  if (e.target.tagName === 'A' && nav.classList.contains('open')) setMenu(false);
});

// ===== Header shadow on scroll
const onScroll = () => {
  if (window.scrollY > 6) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
};
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// ===== Año en footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===== Tabs (Estudiantes / Arrendadores) - accesible
const tabs = $$('.tabs .tab');
const carousels = $$('.carousel-container');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected','false'); });
    tab.classList.add('is-active'); tab.setAttribute('aria-selected','true');
    const targetSel = tab.dataset.target;
    carousels.forEach(c => c.classList.toggle('is-visible', `#${c.id}` === targetSel));
  });
  tab.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') tab.click(); });
});

// ===== Carrusel: autoplay + controls + keyboard
$$('.carousel-container').forEach(carousel => {
  const track = carousel.querySelector('.carousel-track');
  const prevBtn = carousel.querySelector('.prev');
  const nextBtn = carousel.querySelector('.next');
  let autoplay = true;
  let timer = null;

  // shift first item to end
  const shiftNext = () => {
    const first = track.querySelector('.card');
    if (!first) return;
    track.appendChild(first);
  };
  // move last item to start
  const shiftPrev = () => {
    const items = track.querySelectorAll('.card');
    const last = items[items.length - 1];
    if (!last) return;
    track.prepend(last);
  };

  // Controls
  if (nextBtn) nextBtn.addEventListener('click', () => { pauseAutoplay(); shiftNext(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { pauseAutoplay(); shiftPrev(); });

  // Dots (pagination)
  const dotsWrap = carousel.querySelector('.carousel-dots');
  let dots = [];
  if (dotsWrap) {
    // count unique slides (assume the first half before duplication)
    const cards = track.querySelectorAll('.card');
    const uniqueCount = Math.ceil(cards.length / 2);
    for (let i = 0; i < uniqueCount; i++){
      const b = document.createElement('button');
      b.type = 'button';
      if (i === 0) b.classList.add('is-active');
      b.addEventListener('click', () => { pauseAutoplay(); // rotate until index 0 is desired
        // rotate track so that card at index i becomes first
        for (let r=0;r<i;r++) shiftNext();
      });
      dotsWrap.appendChild(b);
      dots.push(b);
    }
  }

  // Pause on hover/focus, resume on leave/blur
  const pause = () => { if (track) track.style.animationPlayState = 'paused'; autoplay = false; clearTimeout(timer); };
  const resume = () => { if (track) track.style.animationPlayState = 'running'; autoplay = true; startAutoplay(); };
  [carousel, prevBtn, nextBtn].forEach(el => {
    if (!el) return;
    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);
    el.addEventListener('focusin', pause);
    el.addEventListener('focusout', resume);
  });

  // Keyboard for controls
  if (prevBtn) prevBtn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); prevBtn.click(); } });
  if (nextBtn) nextBtn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextBtn.click(); } });

  // autoplay that periodically shifts next
  function startAutoplay(){
    clearTimeout(timer);
    if (!autoplay) return;
    timer = setTimeout(() => { shiftNext(); startAutoplay(); }, 4500);
  }
  function pauseAutoplay(){ autoplay = false; clearTimeout(timer); }

  // update dots when shifting
  const updateDots = () => {
    if (!dots.length) return;
    // determine index of the first visible original card
    const cards = track.querySelectorAll('.card');
    const uniqueCount = Math.ceil(cards.length / 2);
    // find the card that is first in DOM and belongs to the original set
    const first = cards[0];
    let idx = 0;
    // find its position among first uniqueCount cards by matching src or text
    const originals = Array.from(cards).slice(0, uniqueCount);
    idx = originals.findIndex(c => c.isSameNode(first));
    if (idx === -1) idx = 0;
    dots.forEach((d,i)=> d.classList.toggle('is-active', i===idx));
  };

  // Wrap shiftNext/shiftPrev to update dots
  const origShiftNext = shiftNext;
  const origShiftPrev = shiftPrev;
  shiftNext = () => { origShiftNext(); updateDots(); };
  shiftPrev = () => { origShiftPrev(); updateDots(); };

  startAutoplay();
});

// ===== Reveal on scroll for elements with .reveal
const revealEls = $$('.reveal');
if (revealEls.length) {
  const revIo = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const d = el.getAttribute('data-delay');
        if (d) el.style.setProperty('--d', `${d}ms`);
        el.classList.add('is-visible');
        revIo.unobserve(el);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => revIo.observe(el));
}

// ===== Scrollspy - resalta link activo según sección visible
const navLinks = $$('#nav a[href^="#"]').filter(a => !a.classList.contains('btn'));
const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);

const setActive = (id) => {
  navLinks.forEach(a => { const match = a.getAttribute('href') === `#${id}`; a.classList.toggle('active', match); });
};

if (sections.length) {
  const io = new IntersectionObserver((entries) => {
    const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setActive(visible.target.id);
  }, {
    rootMargin: `-${parseInt(getComputedStyle(document.documentElement).getPropertyValue('--headerH'))+10}px 0px -40% 0px`,
    threshold: [0.2, 0.4, 0.6, 0.8]
  });
  sections.forEach(sec => io.observe(sec));
}

// Reaplicar offset si hay hash al cargar
window.addEventListener('load', () => {
  if (location.hash) {
    const el = document.querySelector(location.hash);
    if (el) el.scrollIntoView();
  }
});