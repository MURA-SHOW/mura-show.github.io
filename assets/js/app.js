// MURA SHOW — мелочи, ради которых не нужен фреймворк.
(function () {
  'use strict';

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  // спокойный режим ставит скрипт в <head> (класс calm): система просит «без анимации»
  // и посетитель не включил движение сам. Тогда блоки проявляются без сдвига, циклов нет
  var root = document.documentElement;
  // не /\bcalm\b/: оно находит calm и внутри os-calm — после «Включить анимацию» сайт оставался
  // спокойным, а кнопка не переключалась обратно (05.10.2026)
  var calm = root.classList.contains('calm');
  var smooth = calm ? 'auto' : 'smooth';
  var hasIO = 'IntersectionObserver' in window;

  // кнопка движения в подвале: видна, только если система просит «без анимации».
  // Выбор запоминается; тот же выбор делает адрес с ?motion=1 и ?motion=0
  var motionBtn = document.querySelector('button.motion-toggle');   // не [data-motion]: тот же атрибут
  // после включения движения стоит на <html>, и textContent ниже стирал всю страницу (Н40, 05.10.2026)
  if (motionBtn && root.classList.contains('os-calm')) {
    motionBtn.hidden = false;
    motionBtn.textContent = calm ? 'Включить анимацию' : 'Выключить анимацию';
    motionBtn.addEventListener('click', function () {
      try {
        if (calm) { localStorage.setItem('mura-motion', '1'); } else { localStorage.removeItem('mura-motion'); }
      } catch (e) { /* хранилище закрыто — останется как есть */ }
      location.replace(location.pathname + location.hash);
    });
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
    // пока меню открыто, нижняя панель уходит: на невысоком телефоне (667 px) она
    // ложилась поверх кнопок мессенджеров в меню, и «ВКонтакте» было не нажать
    var setMenu = function (open) {
      var bar = document.querySelector('[data-dock]');
      menu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (bar) { bar.classList.toggle('is-menu', open); }
    };
    burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { setMenu(false); }
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
    // ссылка с #panel-show открывает сразу нужную вкладку
    var asked = location.hash && box.querySelector('[aria-controls="' + location.hash.slice(1) + '"]');
    select(asked || box.querySelector('[aria-selected=true]') || tabs[0], false);
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
    var preRow = calc.querySelector('[data-calc-pre-row]');
    var heroEl = calc.querySelector('[name=hero]');
    var suitBox = calc.querySelector('[name=suit]').closest('fieldset');
    var pickHours = function (h) {
      var el = calc.querySelector('[name=hours][value="' + h + '"]');
      if (el) { el.checked = true; }
    };
    var pickShows = function (slugs) {
      each(calc.querySelectorAll('[name=show]'), function (s) {
        s.checked = slugs.indexOf(s.getAttribute('data-slug')) >= 0;
      });
    };
    // герой из каталога сам ставит костюм: у четырёх VIP-героев цена часа другая
    var suitByHero = function () {
      if (!heroEl.value) { return; }
      var vip = heroEl.options[heroEl.selectedIndex].hasAttribute('data-vip');
      calc.querySelector('[name=suit][data-kind=' + (vip ? 'vip' : 'base') + ']').checked = true;
    };
    var recalc = function (pop) {
      var suit = calc.querySelector('[name=suit]:checked');
      var hoursEl = calc.querySelector('[name=hours]:checked');
      var hours = +hoursEl.value;
      var lines = [];
      var total = 0;
      if (heroEl.value) {
        lines.push(['Герой', heroEl.options[heroEl.selectedIndex].text.replace(' · VIP', '')]);
      }
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
      // ноль рублей читается как «бесплатно»: пустой выбор и шоу «по запросу» пишем словами
      var priced = lines.some(function (l) { return l[0] !== 'Герой'; });
      totalEl.textContent = total ? money(total) : priced ? 'по запросу' : 'выберите шоу';
      totalEl.classList.toggle('is-word', !total);
      preEl.textContent = money(Math.round(total * 0.2));
      preRow.hidden = !total;
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
      calcText = priced
        ? 'Расчёт с сайта: ' + lines.map(function (l) { return l[0] + ' — ' + l[1]; }).join('; ') +
          (total ? '. Предварительно ' + money(total) + '.' : '.')
        : '';
      if (pop && !calm) {
        totalEl.classList.remove('is-pop');
        void totalEl.offsetWidth;                  // перезапуск: класс тот же, анимация новая
        totalEl.classList.add('is-pop');
      }
    };
    // ссылка со страницы шоу или героя открывает расчёт уже заполненным
    var q = new URLSearchParams(location.search);
    if (q.get('hero')) { heroEl.value = q.get('hero'); suitByHero(); }
    if (q.get('hours')) { pickHours(q.get('hours')); }
    if (q.get('show')) { pickShows(q.get('show').split(',')); }
    calc.hidden = false;
    heroEl.addEventListener('change', suitByHero);
    calc.addEventListener('change', function () { recalc(true); });
    calc.addEventListener('submit', function (e) { e.preventDefault(); });
    each(calc.querySelectorAll('[data-preset]'), function (b) {
      b.addEventListener('click', function () {
        pickHours(b.getAttribute('data-hours'));
        pickShows(b.getAttribute('data-shows').split(','));
        recalc(true);
      });
    });
    recalc(false);
    // из итога — сразу в чат: имя и номер в мессенджере видны и так, форма тут лишняя
    each(calc.querySelectorAll('[data-calc-to]'), function (a) {
      a.addEventListener('click', function () {
        a.href = LINKS[a.getAttribute('data-calc-to')](
          'Здравствуйте! ' + (calcText || 'Хочу узнать про праздник.'));
      });
    });
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
      var topic = a.getAttribute('data-prefill');
      if (f && !f.about.value.trim()) { f.about.value = topic + (topic.indexOf(':') < 0 ? ': ' : '. '); }
    });
  });

  // блок выезжает при прокрутке — но только тот, что ниже экрана на момент загрузки:
  // видимое не прячем, чтобы страница не мигала
  if (hasIO) {
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

  // каталог образов: кнопки-вселенные и поиск по имени работают вместе —
  // и по сетке с кадрами, и по списку тех, кого студия не снимала
  var catalog = document.querySelector('[data-catalog]');
  if (catalog) {
    var boxes = [catalog, document.querySelector('[data-catalog-more]')].filter(Boolean);
    var buttons = document.querySelectorAll('[data-filter]');
    var search = document.querySelector('[data-catalog-search]');
    var none = document.querySelector('[data-catalog-none]');
    var group = 'все';
    // «человек паук» находит «Человек-паук»: дефисы, кавычки и двойные пробелы не в счёт
    var plain = function (s) {
      return s.toLowerCase().replace(/ё/g, 'е').replace(/[-–—«»"':,.]+/g, ' ').replace(/ +/g, ' ').trim();
    };
    // «человека паука» находит «Человек-паук»: у длинных слов запроса падежный хвост
    // (две последние буквы) не сравниваем, каждое слово запроса должно найтись в имени
    var hit = function (name, q) {
      return q.split(' ').every(function (w) {
        return name.indexOf(w.length > 4 ? w.slice(0, -2) : w) >= 0;
      });
    };
    var apply = function () {
      var q = search ? plain(search.value.trim()) : '';
      var found = 0;
      boxes.forEach(function (box) {
        var left = 0;
        each(box.children, function (card) {
          var show = (group === 'все' || card.getAttribute('data-group') === group) &&
                     (!q || hit(plain((card.getAttribute('data-name') || '') + ' ' +
                                      (card.getAttribute('data-group') || '')), q));
          card.style.display = show ? '' : 'none';
          if (show) { left++; }
        });
        found += left;
        // пустая секция под сеткой смотрится как поломка — прячем её целиком
        var section = box.closest('section');
        if (section && box.hasAttribute('data-catalog-more')) {
          section.style.display = left ? '' : 'none';
        }
      });
      if (none) { none.hidden = found > 0; }
    };
    each(buttons, function (btn) {
      btn.addEventListener('click', function () {
        group = btn.getAttribute('data-filter');
        each(buttons, function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        apply();
      });
    });
    if (search) { search.addEventListener('input', apply); }
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
    // Telegram принимает черновик в ссылке на имя: t.me/<имя>?text= (core.telegram.org/api/links)
    tg: function (t) { return 'https://t.me/MURA_PRODUCTION?text=' + encodeURIComponent(t); },
    vk: function () { return 'https://vk.me/mura__show'; }           // сюда текст не передать
  };
  // Копируем сразу, в том же нажатии: новая вкладка забирает фокус, и отложенная запись
  // в буфер (clipboard.writeText) в Safari может не успеть. Запасной путь — она же.
  function copyNow(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-999px;top:0;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    if (!ok && navigator.clipboard) { navigator.clipboard.writeText(text).catch(function () {}); }
  }

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
      if (to !== 'wa') {
        copyNow(text);
        if (note) {
          note.textContent = to === 'tg'
            ? 'Заявка откроется в Telegram готовым сообщением. Если поле пустое — текст в буфере, вставьте его.'
            : 'Заявка скопирована — вставьте её в чат, который сейчас откроется.';
        }
      }
      var url = LINKS[to] ? LINKS[to](text) : urls[to];
      if (url) { window.open(url, '_blank', 'noopener'); }
    });
  });
})();
