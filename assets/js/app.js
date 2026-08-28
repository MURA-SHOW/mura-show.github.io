// MURA SHOW — четыре мелочи, ради которых не нужен фреймворк.
(function () {
  'use strict';

  // видео подключается после текста и картинок: первый экран не ждёт мегабайты,
  // а то, что ниже сгиба, грузится, только когда до него доскроллили
  function playVideo(v) {
    if (v.src) { return; }
    var sm = v.getAttribute('data-src-sm');
    v.src = (sm && window.innerWidth < 800) ? sm : v.getAttribute('data-src');
    var p = v.play();
    if (p && p.catch) { p.catch(function () {}); }
  }
  function initVideo() {
    var all = document.querySelectorAll('video[data-src]');
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(all, playVideo);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { playVideo(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: '200px' });
    Array.prototype.forEach.call(all, function (v) { io.observe(v); });
  }
  if (document.readyState === 'complete') { initVideo(); }
  else { window.addEventListener('load', initVideo); }
  // вкладку открыли в фоне — браузер ставит петлю на паузу, возвращаем при показе
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { return; }
    Array.prototype.forEach.call(document.querySelectorAll('video[data-src]'), function (v) {
      if (v.src && v.paused) { var p = v.play(); if (p && p.catch) { p.catch(function () {}); } }
    });
  });

  // мобильное меню
  var burger = document.querySelector('[data-burger]');
  var menu = document.querySelector('[data-menu]');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        menu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // фильтр каталога образов: сетка с кадрами и список тех, кого студия не снимала
  var catalog = document.querySelector('[data-catalog]');
  if (catalog) {
    var boxes = [catalog, document.querySelector('[data-catalog-more]')].filter(Boolean);
    var buttons = document.querySelectorAll('[data-filter]');
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener('click', function () {
        var group = btn.getAttribute('data-filter');
        Array.prototype.forEach.call(buttons, function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        boxes.forEach(function (box) {
          var left = 0;
          Array.prototype.forEach.call(box.children, function (card) {
            var show = group === 'все' || card.getAttribute('data-group') === group;
            card.style.display = show ? '' : 'none';
            if (show) { left++; }
          });
          // пустая секция под сеткой смотрится как поломка — прячем её целиком
          var section = box.closest('section');
          if (section && box.hasAttribute('data-catalog-more')) {
            section.style.display = left ? '' : 'none';
          }
        });
      });
    });
  }

  // номер копируется в буфер: в MAX чат ищут по номеру, ссылки на него мессенджер не даёт
  Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (b) {
    b.addEventListener('click', function () {
      var val = b.getAttribute('data-copy');
      var note = document.querySelector('[data-copy-note]');
      function said(text) { if (note) { note.textContent = text; } }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(val).then(
          function () { said('Номер ' + val + ' скопирован — вставьте его в поиск MAX.'); },
          function () { said('Номер для MAX: ' + val); });
      } else {
        said('Номер для MAX: ' + val);
      }
    });
  });

  // заявка уходит в тот мессенджер, который выбрал человек: сервера у сайта нет
  var LINKS = {
    wa: function (t) { return 'https://wa.me/79252081419?text=' + encodeURIComponent(t); },
    tg: function () { return 'https://t.me/MURA_PRODUCTION'; },      // текст в личный чат не передаётся
    vk: function () { return 'https://vk.me/mura__show'; }
  };

  Array.prototype.forEach.call(document.querySelectorAll('[data-lead]'), function (f) {
    var to = 'wa';
    var urls = {};
    Array.prototype.forEach.call(f.querySelectorAll('[data-to]'), function (b) {
      var kind = b.getAttribute('data-to');
      if (b.getAttribute('data-url')) { urls[kind] = b.getAttribute('data-url'); }
      b.addEventListener('click', function () { to = kind; });
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (f.name.value || '').trim();
      var contact = (f.contact.value || '').trim();
      var about = (f.about.value || '').trim();
      if (!name || !contact) {
        f.querySelector(name ? '[name=contact]' : '[name=name]').focus();
        return;
      }
      var text = 'Здравствуйте! Заявка с сайта.\n' +
        'Имя: ' + name + '\n' +
        'Связь: ' + contact +
        (about ? '\nПраздник: ' + about : '') +
        (f.dataset.subject ? '\nРаздел: ' + f.dataset.subject : '');
      var note = f.querySelector('[data-lead-note]');
      if (to !== 'wa' && navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () {
          if (note) { note.textContent = 'Заявка скопирована — вставьте её в чат, который сейчас откроется.'; }
        });
      }
      var url = LINKS[to] ? LINKS[to](text) : urls[to];
      if (url) { window.open(url, '_blank', 'noopener'); }
    });
  });
})();
