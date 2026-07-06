import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import './site.css';

document.documentElement.classList.replace('no-js', 'js');

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Mark the current page in the nav. */
const here = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll<HTMLAnchorElement>('.site-nav a').forEach((a) => {
  const target = a.getAttribute('href') || '';
  if (target === here || (here === '' && target === 'index.html')) {
    a.setAttribute('aria-current', 'page');
  }
});

/* Scroll reveals. */
if (!reduced) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.rv').forEach((el) => io.observe(el));
} else {
  document.querySelectorAll('.rv').forEach((el) => el.classList.add('in'));
}

/* Count-ups on the stat band. */
function animateCount(el: HTMLElement): void {
  if (el.dataset.done) return;
  el.dataset.done = '1';
  const to = parseFloat(el.dataset.to!);
  const dec = parseInt(el.dataset.dec ?? '0', 10);
  const prefix = el.dataset.prefix ?? '';
  const suffix = el.dataset.suffix ?? '';
  const fmt = (v: number) =>
    prefix + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
  if (reduced) {
    el.textContent = fmt(to);
    return;
  }
  const t0 = performance.now();
  const dur = 1200;
  const tick = (now: number): void => {
    const p = Math.min((now - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(dec ? to * eased : Math.round(to * eased));
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = fmt(to);
  };
  requestAnimationFrame(tick);
}
const countIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        animateCount(e.target as HTMLElement);
        countIO.unobserve(e.target);
      }
    });
  },
  { threshold: 0.5 }
);
document.querySelectorAll<HTMLElement>('.count[data-to]').forEach((el) => countIO.observe(el));
