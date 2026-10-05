/* MURA SHOW — страница «Собери праздник»: тема → герой → часы и шоу → сумма.
   Цены приходят из разметки (data-base, data-vip, value у шоу): их пишет генератор из прайса,
   своих чисел здесь нет. Текст сообщения собран так же, как в расчёте на странице цен. */
(function () {
  'use strict';
  var box = document.querySelector('[data-pb]');
  if (!box) { return; }

  var root = document.documentElement;
  // движение выключает переключатель сайта (класс calm); пока его нет — системная настройка
  var calm = /(^|\s)calm(\s|$)/.test(root.className) ||
    (!root.hasAttribute('data-motion') && !!window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var smooth = calm ? 'auto' : 'smooth';

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function one(sel) { return box.querySelector(sel); }
  function money(x, sp) { return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, sp) + sp + '₽'; }
  var NB = ' ';

  var BASE = +box.getAttribute('data-base'), VIP = +box.getAttribute('data-vip');
  var panel2 = one('[data-pb-panel="2"]'), panel3 = one('[data-pb-panel="3"]');
  var totalEl = one('[data-pb-total]'), linesEl = one('[data-pb-lines]');
  var preEl = one('[data-pb-pre]'), preRow = one('[data-pb-pre-row]'), moreCap = one('[data-pb-more]');
  var said = {}, steps = {};
  each(document.querySelectorAll('[data-pb-said]'), function (el) {
    said[el.getAttribute('data-pb-said')] = { el: el, hint: el.textContent };
  });
  each(document.querySelectorAll('[data-pb-step]'), function (el) { steps[el.getAttribute('data-pb-step')] = el; });

  var text = '';            // сообщение для мессенджера, обычные пробелы

  function picked(name) { return one('[name=' + name + ']:checked'); }
  // выбранная плитка и карточка: класс вместо :has(), которого нет в браузерах постарше
  function mark(name) {
    each(box.querySelectorAll('.pb-pick > [name=' + name + '], .pb-hero > [name=' + name + ']'), function (i) {
      i.parentNode.classList.toggle('is-on', i.checked);
    });
  }
  // на телефоне сумма живёт в нижней панели сайта: блок суммы стоит под длинным списком шоу
  var dock = document.querySelector('.dock-price');
  var dockCap = dock && dock.querySelector('small'), dockSum = dock && dock.querySelector('b');

  function say(n, value) {
    said[n].el.textContent = value || said[n].hint;
    steps[n].classList.toggle('is-done', !!value);
  }

  // панель появляется под выбором; к ней едем только после нажатия мышью или пальцем:
  // стрелки на клавиатуре перебирают варианты, и прыжок страницы на каждый шаг сбивал бы с места
  var byPointer = false;
  box.addEventListener('pointerdown', function () { byPointer = true; });
  box.addEventListener('keydown', function () { byPointer = false; });
  function open(panel) {
    var was = panel.hidden;
    panel.hidden = false;
    if (was && !calm) {
      panel.classList.add('is-in');
      setTimeout(function () { panel.classList.remove('is-in'); }, 400);
    }
    if (byPointer) { panel.scrollIntoView({ behavior: smooth, block: 'start' }); }
  }

  function onGroup() {
    var g = picked('group');
    if (!g) { return; }
    var hero = picked('hero'), listed = 0;
    each(panel2.querySelectorAll('[data-group]'), function (el) {
      var on = el.getAttribute('data-group') === g.value;
      el.hidden = !on;
      if (on && el.classList.contains('opt')) { listed++; }
    });
    moreCap.hidden = !listed;
    // герой из прошлой темы остался бы выбранным, но невидимым
    if (hero && hero.value && hero.closest('[data-group]').hidden) { hero.checked = false; }
    say(1, g.value);
    open(panel2);
    recalc();
  }

  function recalc() {
    var g = picked('group'), hero = picked('hero'), hoursEl = picked('hours');
    var hours = +hoursEl.value, vip = !!(hero && hero.hasAttribute('data-vip'));
    // подпись «2 часа» типограф сайта склеил неразрывным пробелом — в сообщение он не нужен
    var hoursText = hoursEl.nextElementSibling.textContent.replace(/ /g, ' ');
    var lines = [], total = 0, extra = [];

    if (hero && hero.value) { lines.push(['Герой', hero.getAttribute('data-name')]); }
    else if (hero && g) { lines.push(['Тема', g.value + ', героя выберем вместе']); }
    var p = (vip ? VIP : BASE) * hours;
    total += p;
    lines.push(['Программа, ' + hoursText + ', ' + (vip ? 'VIP-костюм' : 'обычный костюм'), p]);
    each(box.querySelectorAll('[name=show]:checked'), function (s) {
      total += +s.value;
      lines.push([s.getAttribute('data-name'), +s.value || 'по запросу']);
      extra.push(s.getAttribute('data-name').toLowerCase());
    });

    totalEl.textContent = money(total, NB);
    preEl.textContent = money(Math.round(total * 0.2), NB);
    linesEl.innerHTML = '';
    lines.forEach(function (l) {
      var li = document.createElement('li'), a = document.createElement('span'), b = document.createElement('span');
      a.textContent = l[0];
      b.textContent = typeof l[1] === 'number' ? money(l[1], NB) : l[1];
      li.appendChild(a); li.appendChild(b); linesEl.appendChild(li);
    });
    text = 'Расчёт с сайта: ' + lines.map(function (l) {
      return l[0] + ' — ' + (typeof l[1] === 'number' ? money(l[1], ' ') : l[1]);
    }).join('; ') + '. Предварительно ' + money(total, ' ') + '.';

    mark('group'); mark('hero');
    if (hero && dockSum) {
      dockCap.textContent = 'ваш набор';
      dockSum.textContent = money(total, NB);
      dock.setAttribute('href', '#shag-3');
    }
    say(2, hero ? (hero.value ? hero.getAttribute('data-name') : 'Выберем вместе') : '');
    say(3, hero ? hoursText + (extra.length > 2 ? ' + ' + extra.length + ' шоу' : extra.length ? ' + ' + extra.join(', ') : '') : '');
    if (hero && !calm) {                           // сумма «подпрыгивает», как в расчёте
      totalEl.classList.remove('is-pop');
      void totalEl.offsetWidth;
      totalEl.classList.add('is-pop');
    }
  }

  box.addEventListener('change', function (e) {
    var name = e.target.name;
    if (name === 'group') { onGroup(); return; }
    if (name === 'hero') { open(panel3); }
    recalc();
  });
  box.addEventListener('submit', function (e) { e.preventDefault(); });

  // ссылки строятся в момент нажатия: в них уходит то, что выбрано сейчас
  each(box.querySelectorAll('[data-pb-to]'), function (a) {
    var base = a.href.split('?')[0];
    a.addEventListener('click', function () {
      a.href = base + '?text=' + encodeURIComponent('Здравствуйте! ' + text);
    });
  });
  one('[data-pb-send]').addEventListener('click', function () {
    var f = document.querySelector('[data-lead]');
    if (f && f.about) { f.about.value = text; }
  });

  // шаг в полоске сверху ведёт к своей панели, если до неё уже дошли
  each(document.querySelectorAll('[data-pb-step] a'), function (a) {
    a.addEventListener('click', function (e) {
      var panel = document.querySelector(a.getAttribute('href'));
      e.preventDefault();
      if (panel && !panel.hidden) {
        panel.scrollIntoView({ behavior: smooth, block: 'start' });
        var first = panel.querySelector('input:checked, input');
        if (first) { first.focus({ preventScroll: true }); }
      }
    });
  });

  box.hidden = false;
  // браузер после «назад» возвращает отмеченные поля: поднимаем панели под них
  if (picked('group')) { onGroup(); if (picked('hero')) { open(panel3); } }
  recalc();
})();
