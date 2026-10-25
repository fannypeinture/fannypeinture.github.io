import PhotoSwipeLightbox from './vendor/photoswipe-lightbox.esm.js';

const hero = document.getElementById('hero-swiper');
const grid = document.getElementById('photo-gallery');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let swiper;

function create(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}
function localImage(path) {
  if (typeof path !== 'string') return null;
  try {
    const url = new URL(path, location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith('/assets/photos/')) return null;
    return url.pathname;
  } catch { return null; }
}
function makeLink(photo, caption, eager = false) {
  const src = localImage(photo.image);
  if (!src) return null;
  const a = create('a'); a.href = src;
  a.setAttribute('aria-label', `Agrandir : ${caption}`);
  a.dataset.caption = caption;
  a.dataset.pswpWidth = Number(photo.width) > 0 ? String(Number(photo.width)) : '1600';
  a.dataset.pswpHeight = Number(photo.height) > 0 ? String(Number(photo.height)) : '1200';
  const img = create('img'); img.src = src; img.alt = photo.alt || caption;
  img.loading = eager ? 'eager' : 'lazy';
  if (eager) img.fetchPriority = 'high';
  if (Number(photo.width) > 0 && Number(photo.height) > 0) { img.width = Number(photo.width); img.height = Number(photo.height); }
  img.addEventListener('load', () => {
    a.dataset.pswpWidth = String(img.naturalWidth); a.dataset.pswpHeight = String(img.naturalHeight);
  });
  a.append(img);
  const zoom = create('span', 'photo-expand', '⤢'); zoom.setAttribute('aria-hidden', 'true'); a.append(zoom);
  return a;
}
function updateContent(projects) {
  const visible = projects.filter(p => p.published !== false && p.photos?.some(photo => localImage(photo.image)));
  if (!visible.length) {
    grid.replaceChildren(create('p', '', 'De nouvelles réalisations seront bientôt présentées ici.'));
    hero.parentElement.hidden = true;
    document.querySelector('.illustration-note').hidden = true;
    document.querySelector('.gallery-filters').hidden = true;
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const project of visible) {
    const article = create('article', 'gallery-item');
    article.dataset.categories = (project.categories || []).join(' ');
    const photos = project.photos.filter(p => localImage(p.image));
    const preferred = photos.find(p => p.image === project.cover) || photos[0];
    const ordered = [preferred, ...photos.filter(p => p !== preferred)];
    ordered.forEach((photo, n) => {
      const suffix = project.illustration ? ' — Photo d’illustration' : '';
      const a = makeLink(photo, project.title + (project.description ? ` — ${project.description}` : '') + suffix);
      if (n > 0) { a.hidden = true; a.className = 'additional-photo'; }
      article.append(a);
    });
    const label = create('div', 'gallery-label'); label.append(create('span', '', project.title));
    if (project.illustration) label.append(create('small', '', 'Photo d’illustration'));
    article.append(label); fragment.append(article);
  }
  grid.replaceChildren(fragment);
  const selected = visible.filter(p => p.featured);
  const featured = selected.length ? selected : visible.slice(0, 3);
  if (featured.length) {
    const wrapper = hero.querySelector('.swiper-wrapper'); wrapper.replaceChildren();
    for (const [i, project] of featured.entries()) {
      const photo = project.photos.find(p => p.image === project.cover) || project.photos[0];
      const slide = create('div', 'swiper-slide');
      const a = makeLink(photo, project.title + (project.illustration ? ' — Photo d’illustration' : ''), i === 0);
      if (!a) continue;
      slide.append(a);
      const caption = create('div', 'slide-caption'); caption.append(create('span', '', project.title));
      if (project.illustration) caption.append(create('small', '', 'Photo d’illustration'));
      slide.append(caption); wrapper.append(slide);
    }
  }
  const note = document.querySelector('.illustration-note');
  if (note && visible.every(p => !p.illustration)) note.hidden = true;
}

try {
  const response = await fetch('content/gallery.json', { cache: 'no-cache' });
  if (response.ok) {
    const data = await response.json();
    if (Array.isArray(data.projects)) updateContent(data.projects);
  }
} catch { /* Existing HTML remains usable when content cannot be refreshed. */ }

if (window.Swiper && !hero.parentElement.hidden) {
  const count = hero.querySelectorAll('.swiper-slide').length;
  const countNode = document.getElementById('slide-count');
  function update(sw) {
    const n = sw.realIndex + 1;
    countNode.textContent = `${String(n).padStart(2, '0')} / ${String(count).padStart(2, '0')}`;
    document.querySelector('.slider-progress span').style.width = `${n / count * 100}%`;
  }
  swiper = new window.Swiper(hero, {
    effect: 'fade', fadeEffect: { crossFade: true }, speed: reduceMotion.matches ? 0 : 700,
    loop: count > 1, allowTouchMove: true,
    autoplay: reduceMotion.matches ? false : { delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true },
    a11y: { enabled: true, prevSlideMessage: 'Photo précédente', nextSlideMessage: 'Photo suivante', slideLabelMessage: 'Photo {{index}} sur {{slidesLength}}' },
    navigation: { prevEl: '#slide-prev', nextEl: '#slide-next' }, on: { init: update, slideChange: update }
  });
  const pause = document.getElementById('slide-pause');
  if (reduceMotion.matches) { pause.hidden = true; }
  pause.addEventListener('click', () => {
    const paused = pause.getAttribute('aria-pressed') !== 'true';
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute('aria-label', paused ? 'Reprendre le diaporama' : 'Mettre le diaporama en pause');
    pause.textContent = paused ? '▷' : 'Ⅱ';
    if (paused) swiper.autoplay.stop(); else swiper.autoplay.start();
  });
  hero.addEventListener('focusin', () => swiper.autoplay?.stop());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) swiper.autoplay?.stop();
    else if (!reduceMotion.matches && pause.getAttribute('aria-pressed') !== 'true') swiper.autoplay?.start();
  });
}

const lightbox = new PhotoSwipeLightbox({
  gallery: '.photo-collection', children: 'article:not([hidden]) a[data-pswp-width], .swiper-slide a[data-pswp-width]',
  pswpModule: () => import('./vendor/photoswipe.esm.js'),
  showHideAnimationType: reduceMotion.matches ? 'none' : 'zoom',
  closeTitle: 'Fermer', zoomTitle: 'Zoomer', arrowPrevTitle: 'Photo précédente', arrowNextTitle: 'Photo suivante',
  errorMsg: 'Impossible de charger cette photo. Veuillez réessayer.'
});
lightbox.addFilter('itemData', (data) => {
  const img = data.element?.querySelector('img');
  if (img?.naturalWidth) { data.width = img.naturalWidth; data.height = img.naturalHeight; }
  return data;
});
lightbox.on('uiRegister', () => {
  lightbox.pswp.ui.registerElement({ name: 'custom-caption', order: 9, isButton: false, appendTo: 'root',
    onInit: (element, pswp) => pswp.on('change', () => {
      element.textContent = pswp.currSlide.data.element?.dataset.caption || pswp.currSlide.data.alt || '';
    })
  });
});
lightbox.on('beforeOpen', () => swiper?.autoplay?.stop());
lightbox.init();

document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  grid.classList.toggle('is-filtered', filter !== 'all');
  let count = 0;
  grid.querySelectorAll('.gallery-item').forEach(article => {
    const shown = filter === 'all' || article.dataset.categories.split(' ').includes(filter);
    article.classList.toggle('is-filtered', !shown); article.hidden = !shown; if (shown) count++;
  });
  document.getElementById('gallery-status').textContent = `${count} ambiance${count > 1 ? 's' : ''} affichée${count > 1 ? 's' : ''}.`;
}));

