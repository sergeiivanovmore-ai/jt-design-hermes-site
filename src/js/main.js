/* ==========================================================================
   JT Design — main.js (v2)
   Vanilla JS, без зависимостей и глобальных переменных (IIFE + 'use strict').
   Модули: мобильное меню, тень шапки, карусель проектов с сегментами,
   карусель галереи проекта, год в подвале, появление секций при скролле.
   Форму убрали: связь — через Telegram (@JuliayTara), бэкенда нет.
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
     3. Карусель проектов с сегментами.
     Показывает 1/2/3 слайда в зависимости от ширины экрана; сегменты
     фильтруют слайды по data-seg-values. Управление: стрелки, точки,
     клавиатура (←/→ в фокусе карусели). Без JS видны все слайды подряд.
     --------------------------------------------------------------------- */
  function initProjectCarousel() {
    var root = document.querySelector('[data-carousel]');
    if (!root) return;

    var track = root.querySelector('[data-track]');
    var slides = Array.prototype.slice.call(root.querySelectorAll('.carousel__slide'));
    var segs = Array.prototype.slice.call(root.querySelectorAll('[data-seg]'));
    var prevBtn = root.querySelector('[data-prev]');
    var nextBtn = root.querySelector('[data-next]');
    var dotsBox = root.querySelector('[data-dots]');
    var status = root.querySelector('[data-carousel-status]');
    if (!track || !slides.length) return;

    var current = 0;

    function visibleSlides() {
      return slides.filter(function (s) { return !s.hidden; });
    }

    function measurePerView() {
      var w = window.innerWidth;
      if (w >= 1024) return 3;
      if (w >= 768) return 2;
      return 1;
    }

    function buildDots() {
      if (!dotsBox) return;
      var vis = visibleSlides();
      var perView = measurePerView();
      var pages = Math.max(1, vis.length - perView + 1);
      dotsBox.innerHTML = '';
      for (var i = 0; i < pages; i++) {
        (function (idx) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'carousel__dot';
          b.setAttribute('aria-label', 'Страница ' + (idx + 1));
          b.dataset.page = String(idx);
          b.addEventListener('click', function () { goTo(idx); });
          dotsBox.appendChild(b);
        })(i);
      }
    }

    function update() {
      var vis = visibleSlides();
      var perView = measurePerView();
      var maxIndex = Math.max(0, vis.length - perView);
      if (current > maxIndex) current = maxIndex;

      var slideW = 0;
      if (vis.length) {
        var rect = vis[0].getBoundingClientRect();
        var style = window.getComputedStyle(track);
        var gap = parseFloat(style.columnGap || style.gap || '0') || 0;
        slideW = rect.width + gap;
      }
      track.style.transform = 'translateX(' + (-(current * slideW)) + 'px)';

      if (dotsBox) {
        Array.prototype.forEach.call(dotsBox.children, function (d, i) {
          d.classList.toggle('is-active', i === current);
          d.setAttribute('aria-current', i === current ? 'true' : 'false');
        });
      }
      if (prevBtn) prevBtn.disabled = current === 0;
      if (nextBtn) nextBtn.disabled = current >= maxIndex;
      if (status) status.textContent = 'Слайд ' + (current + 1) + ' из ' + (maxIndex + 1);
    }

    function goTo(i) {
      current = i;
      update();
    }

    function applySegment(value) {
      slides.forEach(function (s) {
        var vals = (s.getAttribute('data-seg-values') || '').split(/\s+/);
        s.hidden = value !== 'all' && vals.indexOf(value) === -1;
      });
      current = 0;
      buildDots();
      update();
      if (status) {
        status.textContent = 'Показано проектов: ' + visibleSlides().length;
      }
    }

    segs.forEach(function (seg) {
      seg.addEventListener('click', function () {
        segs.forEach(function (s) {
          s.setAttribute('aria-selected', s === seg ? 'true' : 'false');
        });
        applySegment(seg.getAttribute('data-seg'));
      });
    });

    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(Math.max(0, current - 1)); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); });

    // Клавиатура работает, пока фокус внутри карусели
    document.addEventListener('keydown', function (event) {
      if (!root.contains(document.activeElement)) return;
      if (event.key === 'ArrowLeft') goTo(Math.max(0, current - 1));
      if (event.key === 'ArrowRight') goTo(current + 1);
    });

    // Пересчёт при ресайзе (debounce 120ms)
    var resizeT = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(update, 120);
    });

    buildDots();
    update();
  }

  /* ---------------------------------------------------------------------
     4. Карусель галереи проекта: стрелки, точки, миниатюры
     --------------------------------------------------------------------- */
  function initProjectGallery() {
    var root = document.querySelector('[data-pgal]');
    if (!root) return;
    var track = root.querySelector('[data-pgal-track]');
    var slides = Array.prototype.slice.call(root.querySelectorAll('.pgal__slide'));
    var prevBtn = root.querySelector('[data-pgal-prev]');
    var nextBtn = root.querySelector('[data-pgal-next]');
    var dots = Array.prototype.slice.call(root.querySelectorAll('.pgal__dot'));
    var thumbs = Array.prototype.slice.call(root.querySelectorAll('.pgal__thumb'));
    var status = root.querySelector('[data-pgal-status]');
    if (!track || !slides.length) return;

    var current = 0;

    function update() {
      var slide = slides[current];
      if (slide) {
        track.style.transform = 'translateX(' + (-slide.offsetLeft) + 'px)';
      }
      dots.forEach(function (d, i) {
        d.setAttribute('aria-current', i === current ? 'true' : 'false');
      });
      thumbs.forEach(function (t, i) {
        t.setAttribute('aria-current', i === current ? 'true' : 'false');
      });
      if (status) status.textContent = 'Фото ' + (current + 1) + ' из ' + slides.length;
    }

    function goTo(i) {
      current = Math.max(0, Math.min(slides.length - 1, i));
      update();
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); });
    dots.forEach(function (d) {
      d.addEventListener('click', function () { goTo(parseInt(d.dataset.goto, 10)); });
    });
    thumbs.forEach(function (t) {
      t.addEventListener('click', function () { goTo(parseInt(t.dataset.goto, 10)); });
    });

    document.addEventListener('keydown', function (event) {
      if (!root.contains(document.activeElement)) return;
      if (event.key === 'ArrowLeft') goTo(current - 1);
      if (event.key === 'ArrowRight') goTo(current + 1);
    });

    var resizeT = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(update, 120);
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
