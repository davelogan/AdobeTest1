/*
 * Carousel block
 *
 * Authoring (in a doc, as a table):
 * | Carousel |                     |
 * | [image]  | optional caption    |
 * | [image]  | optional caption    |
 *
 * One row per slide. Swipe on touch, arrow buttons and dots on desktop.
 */
import { createOptimizedPicture } from '../../scripts/aem.js';

function createButton(className, label, html) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.setAttribute('aria-label', label);
  button.innerHTML = html;
  return button;
}

export default function decorate(block) {
  const rows = [...block.children];

  const slides = document.createElement('ul');
  slides.className = 'carousel-slides';

  rows.forEach((row, i) => {
    const [mediaCell, captionCell] = row.children;
    const slide = document.createElement('li');
    slide.className = 'carousel-slide';
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${i + 1} of ${rows.length}`);

    const img = mediaCell && mediaCell.querySelector('img');
    if (img) {
      slide.append(createOptimizedPicture(img.src, img.alt, false, [{ width: '1200' }]));
    }

    if (captionCell && captionCell.textContent.trim()) {
      const caption = document.createElement('div');
      caption.className = 'carousel-caption';
      caption.append(...captionCell.childNodes);
      slide.append(caption);
    }

    slides.append(slide);
  });

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.replaceChildren(slides);

  // nothing to navigate with a single slide
  if (rows.length < 2) return;

  const prev = createButton('carousel-prev', 'Previous slide', '&#8249;');
  const next = createButton('carousel-next', 'Next slide', '&#8250;');

  const dots = document.createElement('div');
  dots.className = 'carousel-dots';

  const goTo = (index) => {
    const count = slides.children.length;
    const target = (index + count) % count; // wrap around at both ends
    slides.scrollTo({ left: target * slides.clientWidth, behavior: 'smooth' });
  };

  const current = () => Math.round(slides.scrollLeft / slides.clientWidth);

  [...slides.children].forEach((slide, i) => {
    const dot = createButton('carousel-dot', `Go to slide ${i + 1}`, '');
    dot.addEventListener('click', () => goTo(i));
    dots.append(dot);
  });

  const updateActive = () => {
    const active = current();
    [...dots.children].forEach((dot, i) => {
      dot.setAttribute('aria-current', i === active ? 'true' : 'false');
    });
  };

  prev.addEventListener('click', () => goTo(current() - 1));
  next.addEventListener('click', () => goTo(current() + 1));

  // keep the dots in sync with swipes and scrolls
  let ticking = false;
  slides.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateActive();
      ticking = false;
    });
  });

  const nav = document.createElement('div');
  nav.className = 'carousel-nav';
  nav.append(prev, dots, next);
  block.append(nav);
  updateActive();
}
