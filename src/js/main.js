/* ==========================================================================
   JT Design — main.js
   Vanilla JS, без зависимостей и глобальных переменных (IIFE + 'use strict').
   Модули: мобильное меню, тень шапки, фильтр портфолио, год в подвале,
   появление секций при скролле, валидация формы заявки.
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
     3. Фильтр портфолио
     Без JS видны все проекты, поэтому фильтрация — прогрессивное улучшение.
     --------------------------------------------------------------------- */
  function initFilter() {
    var group = document.querySelector('[data-filter]');
    var list = document.querySelector('[data-projects]');
    if (!group || !list) return;

    var buttons = Array.prototype.slice.call(group.querySelectorAll('[data-filter-value]'));
    var cards = Array.prototype.slice.call(list.querySelectorAll('[data-category]'));
    var status = document.querySelector('[data-filter-status]');

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var value = button.getAttribute('data-filter-value');
        var visible = 0;

        buttons.forEach(function (other) {
          other.setAttribute('aria-pressed', other === button ? 'true' : 'false');
        });

        cards.forEach(function (card) {
          var match = value === 'all' || card.getAttribute('data-category') === value;
          card.hidden = !match;
          if (match) visible += 1;
        });

        // Объявляем результат скринридеру
        if (status) {
          status.textContent = 'Показано проектов: ' + visible;
        }
      });
    });
  }

  /* ---------------------------------------------------------------------
     4. Текущий год в подвале
     --------------------------------------------------------------------- */
  function initYear() {
    var nodes = document.querySelectorAll('[data-year]');
    var year = String(new Date().getFullYear());
    Array.prototype.forEach.call(nodes, function (node) { node.textContent = year; });
  }

  /* ---------------------------------------------------------------------
     5. Появление секций при скролле
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
     6. Форма заявки: клиентская валидация
     TODO: подключить бэкенд — здесь будет POST на endpoint (Formspree, n8n,
     собственный API). Пока сообщение носит демонстрационный характер.
     --------------------------------------------------------------------- */
  function initContactForm() {
    var form = document.querySelector('[data-contact-form]');
    if (!form) return;

    var status = form.querySelector('[data-form-status]');

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var name = form.elements.name;
      var contact = form.elements.contact;
      var invalid = [];

      [name, contact].forEach(function (field) {
        var ok = field.value.trim().length > 0;
        field.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok) invalid.push(field);
      });

      if (invalid.length) {
        status.textContent = 'Заполните, пожалуйста, поля «Имя» и «Контакт».';
        invalid[0].focus();
        return;
      }

      // Здесь будет реальная отправка на бэкенд
      status.textContent = 'Спасибо, ' + name.value.trim() + '! Заявка принята — свяжемся в течение рабочего дня.';
      form.reset();
    });
  }

  /* ---------------------------------------------------------------------
     Инициализация
     --------------------------------------------------------------------- */
  function init() {
    initNav();
    initHeaderShadow();
    initFilter();
    initYear();
    initReveal();
    initContactForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
