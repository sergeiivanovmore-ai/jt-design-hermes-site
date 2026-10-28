/* ==========================================================================
   JT Design — main.js (v3)
   Vanilla JS, без зависимостей и глобальных переменных (IIFE + 'use strict').
   Карусели построены на нативном горизонтальном скролле (scroll-snap):
   свайп работает на мобильных даже без JS, стрелки/точки управляют
   scrollLeft и подсвечивают текущую позицию по факту скролла.
   Модули: мобильное меню, тень шапки, карусель проектов с сегментами,
   карусель галереи проекта, год в подвале, появление секций.
   ========================================================================== */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     1. Мобильное меню
     --------------------------------------------------------------------- */
  function initNav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var nav = document.querySelector('[data-nav]');
    if (!toggle || !nav) return;

    function close() {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.removeProperty('overflow');
    }

    toggle.addEventListener('click', function () {
      var isOpen = toggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        close();
      } else {
        nav.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
        // Блокируем прокрутку фона, пока открыто меню
        document.body.style.overflow = 'hidden';
      }
    });

    // Escape закрывает меню и возвращает фокус на кнопку
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        close();
        toggle.focus();
      }
    });

    // Клик вне панели закрывает меню
    document.addEventListener('click', function (event) {
      if (!nav.classList.contains('is-open')) return;
      if (!nav.contains(event.target) && !toggle.contains(event.target)) close();
    });

    // При переходе на десктопный брейкпоинт меню-панель сбрасывается
    var desktop = window.matchMedia('(min-width: 1024px)');
    desktop.addEventListener('change', function (event) {
      if (event.matches) close();
    });
  }

  /* ---------------------------------------------------------------------
     2. Тень шапки при прокрутке
     --------------------------------------------------------------------- */
  function initHeaderShadow() {
    var header = document.querySelector('[data-header]');
    if (!header) return;

    var ticking = false;
    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ---------------------------------------------------------------------
     Общая утилита: шаг карусели = ширина первого видимого слайда + gap.
     --------------------------------------------------------------------- */
  function slideStep(track) {
    var first = track.querySelector('li:not([hidden])');
    if (!first) return 0;
    var style = window.getComputedStyle(track);
    var gap = parseFloat(style.columnGap || style.gap || '0') || 0;
    return first.getBoundingClientRect().width + gap;
  }

  function scrollBehavior() {
    return prefersReducedMotion ? 'auto' : 'smooth';
  }

  /* ---------------------------------------------------------------------
     3. Карусель проектов с сегментами (scroll-snap).
     Свайп — нативный скролл, работает на мобильных; стрелки/точки
     управляют scrollLeft, активная точка определяется по факту скролла.
     --------------------------------------------------------------------- */
  function initProjectCarousel() {
    var root = document.querySelector('[data-carousel]');
    if (!root) return;

    var viewport = root.querySelector('.carousel__viewport');
    var track = root.querySelector('[data-track]');
    var slides = Array.prototype.slice.call(root.querySelectorAll('.carousel__slide'));
    var segs = Array.prototype.slice.call(root.querySelectorAll('[data-seg]'));
    var prevBtn = root.querySelector('[data-prev]');
    var nextBtn = root.querySelector('[data-next]');
    var dotsBox = root.querySelector('[data-dots]');
    var status = root.querySelector('[data-carousel-status]');
    if (!viewport || !track || !slides.length) return;

    function visibleSlides() {
      return slides.filter(function (s) { return !s.hidden; });
    }

    function perView() {
      var w = window.innerWidth;
      return w >= 1024 ? 3 : (w >= 768 ? 2 : 1);
    }

    function maxIndex() {
      return Math.max(0, visibleSlides().length - perView());
    }

    function buildDots() {
      if (!dotsBox) return;
      dotsBox.innerHTML = '';
      var pages = maxIndex() + 1;
      for (var i = 0; i < pages; i++) {
        (function (idx) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'carousel__dot';
          b.setAttribute('aria-label', 'Страница ' + (idx + 1));
          b.addEventListener('click', function () {
            viewport.scrollTo({ left: idx * slideStep(track), behavior: scrollBehavior() });
          });
          dotsBox.appendChild(b);
        })(i);
      }
    }

    function update() {
      var step = slideStep(track);
      var index = step > 0 ? Math.round(viewport.scrollLeft / step) : 0;
      index = Math.max(0, Math.min(maxIndex(), index));

      if (dotsBox) {
        Array.prototype.forEach.call(dotsBox.children, function (d, i) {
          d.classList.toggle('is-active', i === index);
        });
      }
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index >= maxIndex();
      if (status) status.textContent = 'Слайд ' + (index + 1) + ' из ' + (maxIndex() + 1);
    }

    function goTo(delta) {
      var step = slideStep(track);
      var index = step > 0 ? Math.round(viewport.scrollLeft / step) : 0;
      var target = Math.max(0, Math.min(maxIndex(), index + delta));
      viewport.scrollTo({ left: target * step, behavior: scrollBehavior() });
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(1); });

    // Подсветка точки по фактическому скроллу (в т.ч. после свайпа пальцем)
    var raf = null;
    viewport.addEventListener('scroll', function () {
      if (raf) return;
      raf = window.requestAnimationFrame(function () {
        raf = null;
        update();
      });
    }, { passive: true });

    segs.forEach(function (seg) {
      seg.addEventListener('click', function () {
        segs.forEach(function (s) {
          s.setAttribute('aria-selected', s === seg ? 'true' : 'false');
        });
        var value = seg.getAttribute('data-seg');
        slides.forEach(function (s) {
          var vals = (s.getAttribute('data-seg-values') || '').split(/\s+/);
          s.hidden = value !== 'all' && vals.indexOf(value) === -1;
        });
        viewport.scrollTo({ left: 0, behavior: 'auto' });
        buildDots();
        update();
        if (status) status.textContent = 'Показано проектов: ' + visibleSlides().length;
      });
    });

    document.addEventListener('keydown', function (event) {
      if (!root.contains(document.activeElement)) return;
      if (event.key === 'ArrowLeft') goTo(-1);
      if (event.key === 'ArrowRight') goTo(1);
    });

    var resizeT = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(function () {
        buildDots();
        update();
      }, 150);
    });

    buildDots();
    update();
  }

  /* ---------------------------------------------------------------------
     4. Карусель галереи проекта (scroll-snap + миниатюры)
     --------------------------------------------------------------------- */
  function initProjectGallery() {
    var root = document.querySelector('[data-pgal]');
    if (!root) return;
    var viewport = root.querySelector('.pgal__viewport');
    var track = root.querySelector('[data-pgal-track]');
    var slides = Array.prototype.slice.call(root.querySelectorAll('.pgal__slide'));
    var prevBtn = root.querySelector('[data-pgal-prev]');
    var nextBtn = root.querySelector('[data-pgal-next]');
    var dots = Array.prototype.slice.call(root.querySelectorAll('.pgal__dot'));
    var thumbs = Array.prototype.slice.call(root.querySelectorAll('.pgal__thumb'));
    var status = root.querySelector('[data-pgal-status]');
    if (!viewport || !track || !slides.length) return;

    function update() {
      var step = slideStep(track);
      var index = step > 0 ? Math.round(viewport.scrollLeft / step) : 0;
      index = Math.max(0, Math.min(slides.length - 1, index));

      dots.forEach(function (d, i) {
        d.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
      thumbs.forEach(function (t, i) {
        t.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
      // Активную миниатюру держим в поле зрения, прокручивая ТОЛЬКО полосу
      // миниатюр: scrollIntoView мог утащить вниз всю страницу при свайпе.
      if (thumbs[index] && thumbs[index].parentElement) {
        var strip = thumbs[index].parentElement;
        if (strip.scrollWidth > strip.clientWidth) {
          strip.scrollLeft = Math.max(0, thumbs[index].offsetLeft
            - (strip.clientWidth - thumbs[index].offsetWidth) / 2);
        }
      }
      if (status) status.textContent = 'Фото ' + (index + 1) + ' из ' + slides.length;
    }

    function goTo(delta) {
      var step = slideStep(track);
      var index = step > 0 ? Math.round(viewport.scrollLeft / step) : 0;
      var target = Math.max(0, Math.min(slides.length - 1, index + delta));
      viewport.scrollTo({ left: target * step, behavior: scrollBehavior() });
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(1); });
    dots.forEach(function (d) {
      d.addEventListener('click', function () {
        viewport.scrollTo({
          left: parseInt(d.dataset.goto, 10) * slideStep(track),
          behavior: scrollBehavior(),
        });
      });
    });
    thumbs.forEach(function (t) {
      t.addEventListener('click', function () {
        viewport.scrollTo({
          left: parseInt(t.dataset.goto, 10) * slideStep(track),
          behavior: scrollBehavior(),
        });
      });
    });

    var raf = null;
    viewport.addEventListener('scroll', function () {
      if (raf) return;
      raf = window.requestAnimationFrame(function () {
        raf = null;
        update();
      });
    }, { passive: true });

    document.addEventListener('keydown', function (event) {
      if (!root.contains(document.activeElement)) return;
      if (event.key === 'ArrowLeft') goTo(-1);
      if (event.key === 'ArrowRight') goTo(1);
    });

    update();
  }

  /* ---------------------------------------------------------------------
     5. Текущий год в подвале
     --------------------------------------------------------------------- */
  function initYear() {
    var nodes = document.querySelectorAll('[data-year]');
    var year = String(new Date().getFullYear());
    Array.prototype.forEach.call(nodes, function (node) { node.textContent = year; });
  }

  /* ---------------------------------------------------------------------
     6. Появление секций при скролле
     --------------------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    // Нет IntersectionObserver или пользователь просил меньше анимации — показываем сразу
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (item) { item.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

    Array.prototype.forEach.call(items, function (item) {
      item.classList.add('reveal');
      observer.observe(item);
    });
  }

  /* ---------------------------------------------------------------------
     Инициализация
     --------------------------------------------------------------------- */
  function init() {
    initNav();
    initHeaderShadow();
    initProjectCarousel();
    initProjectGallery();
    initYear();
    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
