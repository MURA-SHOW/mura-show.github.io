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

  // заявка уходит в WhatsApp готовым текстом: своего сервера у сайта нет
  Array.prototype.forEach.call(document.querySelectorAll('[data-lead]'), function (f) {
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
      window.open('https://wa.me/79252081419?text=' + encodeURIComponent(text), '_blank', 'noopener');
    });
  });
})();
