const slides = [...document.querySelectorAll('.slide')];
const currentLabel = document.querySelector('#current');
const totalLabel = document.querySelector('#total');
const progressBar = document.querySelector('#progress-bar');
const prevButton = document.querySelector('#prev');
const nextButton = document.querySelector('#next');
const overviewButton = document.querySelector('#overview');
const fullscreenButton = document.querySelector('#fullscreen');

let currentSlide = 0;
let overviewOpen = false;

totalLabel.textContent = slides.length;

function render() {
  slides.forEach((slide, index) => {
    slide.classList.toggle('active', index === currentSlide);
    slide.setAttribute('aria-hidden', String(!overviewOpen && index !== currentSlide));
  });

  currentLabel.textContent = currentSlide + 1;
  progressBar.style.width = `${((currentSlide + 1) / slides.length) * 100}%`;
  prevButton.disabled = currentSlide === 0;
  nextButton.disabled = currentSlide === slides.length - 1;
  document.title = `${currentSlide + 1}/${slides.length} — ${slides[currentSlide].dataset.title}`;
  window.location.hash = `slide-${currentSlide + 1}`;
}

function goTo(index) {
  currentSlide = Math.max(0, Math.min(index, slides.length - 1));
  if (overviewOpen) toggleOverview(false);
  render();
}

function toggleOverview(force) {
  overviewOpen = typeof force === 'boolean' ? force : !overviewOpen;
  document.body.classList.toggle('overview', overviewOpen);
  overviewButton.setAttribute('aria-pressed', String(overviewOpen));
  slides.forEach(slide => slide.setAttribute('aria-hidden', 'false'));
  if (!overviewOpen) render();
  else slides[currentSlide].scrollIntoView({ block: 'center', behavior: 'smooth' });
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen?.();
  } else {
    await document.exitFullscreen?.();
  }
}

prevButton.addEventListener('click', () => goTo(currentSlide - 1));
nextButton.addEventListener('click', () => goTo(currentSlide + 1));
overviewButton.addEventListener('click', () => toggleOverview());
fullscreenButton.addEventListener('click', toggleFullscreen);

slides.forEach((slide, index) => {
  slide.addEventListener('click', event => {
    if (overviewOpen) goTo(index);
    else if (!event.target.closest('a, button')) goTo(currentSlide + 1);
  });
});

document.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
    event.preventDefault();
    goTo(currentSlide + 1);
  } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
    event.preventDefault();
    goTo(currentSlide - 1);
  } else if (event.key === 'Home') {
    goTo(0);
  } else if (event.key === 'End') {
    goTo(slides.length - 1);
  } else if (event.key.toLowerCase() === 'o') {
    toggleOverview();
  } else if (event.key.toLowerCase() === 'f') {
    toggleFullscreen();
  } else if (event.key === 'Escape' && overviewOpen) {
    toggleOverview(false);
  }
});

const hashSlide = Number.parseInt(window.location.hash.replace('#slide-', ''), 10);
if (Number.isInteger(hashSlide) && hashSlide >= 1 && hashSlide <= slides.length) {
  currentSlide = hashSlide - 1;
}

render();
