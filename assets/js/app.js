// MURA SHOW — три мелочи, ради которых не нужен фреймворк.
(function () {
  'use strict';

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

  // фильтр каталога образов
  var catalog = document.querySelector('[data-catalog]');
  if (catalog) {
    var buttons = document.querySelectorAll('[data-filter]');
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener('click', function () {
        var group = btn.getAttribute('data-filter');
        Array.prototype.forEach.call(buttons, function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        Array.prototype.forEach.call(catalog.children, function (card) {
          var show = group === 'все' || card.getAttribute('data-group') === group;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  // заявка уходит в тот мессенджер, который выбрал человек: сервера у сайта нет
  var LINKS = {
    wa: function (t) { return 'https://wa.me/79252081419?text=' + encodeURIComponent(t); },
    max: function (t) { return 'https://max.ru/:share?text=' + encodeURIComponent(t); },
    tg: function () { return 'https://t.me/MURA_PRODUCTION'; },      // текст в личный чат не передаётся
    vk: function () { return 'https://vk.me/mura__show'; }
  };

  Array.prototype.forEach.call(document.querySelectorAll('[data-lead]'), function (f) {
    var to = 'wa';
    Array.prototype.forEach.call(f.querySelectorAll('[data-to]'), function (b) {
      b.addEventListener('click', function () { to = b.getAttribute('data-to'); });
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
      if ((to === 'tg' || to === 'vk') && navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () {
          if (note) { note.textContent = 'Заявка скопирована — вставьте её в чат, который сейчас откроется.'; }
        });
      }
      window.open(LINKS[to](text), '_blank', 'noopener');
    });
  });
})();
