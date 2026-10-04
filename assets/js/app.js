// MURA SHOW — мелочи, ради которых не нужен фреймворк.
(function () {
  'use strict';

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var smooth = calm ? 'auto' : 'smooth';
  var hasIO = 'IntersectionObserver' in window;

  // заставка-акула: идёт сама на CSS, здесь только пропуск по касанию и уборка за собой
  var intro = document.querySelector('[data-intro]');
  if (intro) {
    var gone = function () { if (intro.parentNode) { intro.parentNode.removeChild(intro); } };
    if (/\bno-intro\b/.test(document.documentElement.className)) {
      gone();
    } else {
      var skip = function () { intro.classList.add('is-skip'); setTimeout(gone, 200); };
      intro.addEventListener('click', skip);
      document.addEventListener('keydown', skip, { once: true });
      setTimeout(gone, 1700);
    }
  }

  // видео подключается после текста и картинок: первый экран не ждёт мегабайты.
  // Играет только то, что на экране: ушло из виду — пауза, батарея телефона цела
  function play(v) {
    if (!v.src) {
      var sm = v.getAttribute('data-src-sm');
      v.src = (sm && window.innerWidth < 800) ? sm : v.getAttribute('data-src');
    }
    var p = v.play();
    if (p && p.catch) { p.catch(function () {}); }
  }
  function initVideo() {
    var all = document.querySelectorAll('video[data-src]');
    if (!hasIO) { each(all, play); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        e.target._seen = e.isIntersecting;
        if (e.isIntersecting) { play(e.target); }
        else if (e.target.src) { e.target.pause(); }
      });
    }, { rootMargin: '200px' });
    each(all, function (v) { io.observe(v); });
  }
  if (document.readyState === 'complete') { initVideo(); }
  else { window.addEventListener('load', initVideo); }
  // вкладку открыли в фоне — браузер ставит петлю на паузу, возвращаем при показе
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { return; }
    each(document.querySelectorAll('video[data-src]'), function (v) {
      if (v.src && v.paused && v._seen !== false) { play(v); }
    });
  });

  // «Написать»: выбор мессенджера вместо прыжка сразу в WhatsApp.
  // Таких кнопок две — в шапке и в нижней панели телефона
  var writes = document.querySelectorAll('[data-write]');
  function closeWrites(except) {
    each(writes, function (w) {
      if (w === except) { return; }
      w.querySelector('[data-write-menu]').hidden = true;
      w.querySelector('[data-write-toggle]').setAttribute('aria-expanded', 'false');
    });
  }
  each(writes, function (w) {
    var btn = w.querySelector('[data-write-toggle]');
    var menu = w.querySelector('[data-write-menu]');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeWrites(w);
      menu.hidden = !menu.hidden;
      btn.setAttribute('aria-expanded', menu.hidden ? 'false' : 'true');
    });
  });
  if (writes.length) {
    document.addEventListener('click', function (e) {
      if (!e.target.closest('[data-write]')) { closeWrites(null); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeWrites(null); }
    });
  }

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

  // нижняя панель уходит, когда на экране форма: иначе она ложится на кнопки отправки
  var dock = document.querySelector('[data-dock]');
  var lead = document.getElementById('zayavka');
  if (dock && lead && hasIO) {
    new IntersectionObserver(function (entries) {
      dock.classList.toggle('is-away', entries[0].isIntersecting);
      if (entries[0].isIntersecting) { closeWrites(null); }
    }, { threshold: 0.12 }).observe(lead);
  }

  // вкладки «Программа / Шоу». С клавиатуры панель меняется без анимации:
  // стрелками листают быстро, и движение только мешает
  each(document.querySelectorAll('[data-tabs]'), function (box) {
    var tabs = box.querySelectorAll('[role=tab]');
    function select(tab, animate) {
      each(tabs, function (t) {
        var on = t === tab;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panel.hidden = !on;
        panel.classList.toggle('is-enter', on && animate);
      });
    }
    each(tabs, function (t, i) {
      t.addEventListener('click', function () { select(t, true); });
      t.addEventListener('keydown', function (e) {
        var to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (to === undefined) { return; }
        e.preventDefault();
        var next = tabs[(to + tabs.length) % tabs.length];
        select(next, false);
        next.focus();
      });
    });
    select(box.querySelector('[aria-selected=true]') || tabs[0], false);
  });

  // клипы и фото в рамках: стрелки листают по паре, счётчик показывает, где мы
  each(document.querySelectorAll('[data-frames]'), function (box) {
    var track = box.querySelector('.frames-track');
    var prev = box.querySelector('[data-frames-prev]');
    var next = box.querySelector('[data-frames-next]');
    var count = box.querySelector('[data-frames-count]');
    var n = track.children.length;
    function step() {
      return n > 1 ? track.children[1].offsetLeft - track.children[0].offsetLeft : track.clientWidth;
    }
    function update() {
      var i = Math.max(0, Math.min(n - 1, Math.round(track.scrollLeft / step())));
      count.textContent = (i + 1) + ' / ' + n;
      prev.disabled = i === 0;
      next.disabled = i === n - 1;
    }
    track.addEventListener('scroll', update, { passive: true });
    prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: smooth }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: smooth }); });
    update();
  });

  // расчёт праздника: цены лежат в самих кнопках (value), здесь только сложение
  var calc = document.querySelector('[data-calc]');
  var calcText = '';
  if (calc) {
    var money = function (x) { return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; };
    var totalEl = calc.querySelector('[data-calc-total]');
    var linesEl = calc.querySelector('[data-calc-lines]');
    var preEl = calc.querySelector('[data-calc-pre]');
    var suitBox = calc.querySelector('[name=suit]').closest('fieldset');
    var recalc = function (pop) {
      var suit = calc.querySelector('[name=suit]:checked');
      var hoursEl = calc.querySelector('[name=hours]:checked');
      var hours = +hoursEl.value;
      var lines = [];
      var total = 0;
      if (hours) {
        var p = +suit.value * hours;
        total += p;
        lines.push(['Программа, ' + hoursEl.nextElementSibling.textContent + ', ' +
                    suit.getAttribute('data-name'), money(p)]);
      }
      suitBox.classList.toggle('is-off', !hours);
      each(calc.querySelectorAll('[name=show]:checked'), function (s) {
        var price = +s.value;
        total += price;
        lines.push([s.getAttribute('data-name'), price ? money(price) : 'по запросу']);
      });
      totalEl.textContent = money(total);
      preEl.textContent = money(Math.round(total * 0.2));
      linesEl.innerHTML = '';
      lines.forEach(function (l) {
        var li = document.createElement('li');
        var a = document.createElement('span');
        var b = document.createElement('span');
        a.textContent = l[0];
        b.textContent = l[1];
        li.appendChild(a);
        li.appendChild(b);
        linesEl.appendChild(li);
      });
      calcText = lines.length
        ? 'Расчёт с сайта: ' + lines.map(function (l) { return l[0] + ' — ' + l[1]; }).join('; ') +
          '. Предварительно ' + money(total) + '.'
        : '';
      if (pop && !calm) {
        totalEl.classList.remove('is-pop');
        void totalEl.offsetWidth;                  // перезапуск: класс тот же, анимация новая
        totalEl.classList.add('is-pop');
      }
    };
    calc.hidden = false;
    calc.addEventListener('change', function () { recalc(true); });
    calc.addEventListener('submit', function (e) { e.preventDefault(); });
    recalc(false);
    calc.querySelector('[data-calc-send]').addEventListener('click', function (e) {
      var f = document.querySelector('[data-lead]');
      if (!f) { return; }
      e.preventDefault();
      if (calcText) { f.about.value = calcText; }
      f.scrollIntoView({ behavior: smooth, block: 'center' });
      f.name.focus({ preventScroll: true });
    });
  }

  // плитка повода без своей страницы ведёт в форму и подставляет тему заявки
  each(document.querySelectorAll('[data-prefill]'), function (a) {
    a.addEventListener('click', function () {
      var f = document.querySelector('[data-lead]');
      if (f && !f.about.value.trim()) { f.about.value = a.getAttribute('data-prefill') + ': '; }
    });
  });

  // блок выезжает при прокрутке — но только тот, что ниже экрана на момент загрузки:
  // видимое не прячем, чтобы страница не мигала
  if (hasIO && !calm) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('rv-in'); seen.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    each(document.querySelectorAll('[data-reveal]'), function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.classList.add('rv');
        seen.observe(el);
      }
    });
  }

  // фильтр каталога образов: сетка с кадрами и список тех, кого студия не снимала
  var catalog = document.querySelector('[data-catalog]');
  if (catalog) {
    var boxes = [catalog, document.querySelector('[data-catalog-more]')].filter(Boolean);
    var buttons = document.querySelectorAll('[data-filter]');
    each(buttons, function (btn) {
      btn.addEventListener('click', function () {
        var group = btn.getAttribute('data-filter');
        each(buttons, function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        boxes.forEach(function (box) {
          var left = 0;
          each(box.children, function (card) {
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
  each(document.querySelectorAll('[data-copy]'), function (b) {
    b.addEventListener('click', function () {
      var val = b.getAttribute('data-copy');
      var note = document.querySelector('[data-copy-note]');
      var label = b.querySelector('span');
      function said(text) {
        if (note) { note.textContent = text; }
        else if (label) { label.textContent = 'Номер скопирован'; }
      }
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

  each(document.querySelectorAll('[data-lead]'), function (f) {
    var to = 'wa';
    var urls = {};
    each(f.querySelectorAll('[data-to]'), function (b) {
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
