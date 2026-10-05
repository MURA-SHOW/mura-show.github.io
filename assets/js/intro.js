// MURA SHOW — заставка: акула держит в открытой пасти знак студии, кусает экран, летят брызги,
// акула моргает и отпускает — под пастью сайт. Около 2,7 секунды, один раз за визит.
// Подключается синхронно в <head>: первый же кадр — уже пасть, страница под ней не мигает.
// Сети не трогает: зубы, глаза, знак и брызги рисуются здесь же.
//
//   …/?intro      показать в любом случае (показ заказчику, сколько угодно раз)
//   …/?intro=0    не показывать (так страницу снимает scripts/shot.py и приборы приёмки)
//   …/?intro=1200 стоп-кадр на 1200-й миллисекунде (приёмка снимками)
//
// Заставка играет целиком у всех. Раньше при системной настройке «меньше движения» она
// показывала неподвижную пасть на полсекунды — и владелец студии на своём ПК (в Windows выключены
// эффекты анимации, браузер отвечает reduce) дважды её не разглядел: «увидел начало, и загрузилась
// страница». У тех, кто просил поменьше движения (класс html.calm или системная настройка),
// убирается только встряска экрана в момент укуса. Любое касание или клавиша снимают заставку.
(function () {
  'use strict';
  var d = document, root = d.documentElement, KEY = 'mura-intro';

  var q = /[?&]intro(?:=(\d+))?(?:&|$)/.exec(location.search);
  if (q && q[1] === '0') { return; }
  var force = !!q, freeze = q && +q[1] > 1 ? +q[1] : 0;
  if (!force) {
    try {
      if (sessionStorage.getItem(KEY)) { return; }
      sessionStorage.setItem(KEY, '1');
    } catch (e) { return; }     // хранилище закрыто: лучше без заставки, чем заставка на каждой странице
  }

  var W = window.innerWidth, H = window.innerHeight;
  if (!root.animate || !W || !H || (!force && d.visibilityState === 'hidden')) { return; }

  var calm = /(^|\s)calm(\s|$)/.test(root.className) ||
    (!root.hasAttribute('data-motion') && !!window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  var INK = '#16233A', BLUE = '#1F7DD2', LIP = '#1968B3', CREAM = '#FFF1D6', PINK = '#FF72B6';

  // Зубы — треугольники с общим шагом, нижний ряд сдвинут на полшага: в сомкнутой пасти ряды
  // входят друг в друга без щелей. Высота челюсти задана в CSS как «пол-экрана + ползуба»,
  // а не в пикселях: адресная строка телефона меняет высоту окна прямо во время заставки.
  var n = Math.max(5, Math.round(W / 120));
  var p = W / n;                                   // шаг зуба
  var th = Math.round(Math.min(p * 1.1, H * 0.17));   // высота зуба
  var gum = Math.round(th * 0.3);                  // десна
  var sw = Math.max(3, Math.round(th * 0.05));     // контур, как у маскота
  var row = th + gum;                              // полоса «десна + зубы»
  var wide = H / 2 - th / 2 - gum - H * 0.05;      // сдвиг челюсти в распахнутой пасти
  var eye = Math.round(Math.min(W, H) * 0.14);

  function teeth(base, tip, shift) {
    var s = '';
    for (var i = -1; i <= n; i++) {
      var x = (i + shift) * p;
      s += 'M' + x + ' ' + base + 'L' + (x + p / 2) + ' ' + tip + 'L' + (x + p) + ' ' + base + 'Z';
    }
    return s;
  }
  function strip(gumY, lineY, base, tip, shift) {
    var ink = '" stroke="' + INK + '" stroke-width="' + sw + '" stroke-linejoin="round"/>';
    return '<svg viewBox="0 0 ' + W + ' ' + row + '" preserveAspectRatio="none">' +
      '<rect y="' + gumY + '" width="' + W + '" height="' + gum + '" fill="' + PINK + '"/>' +
      '<path d="M0 ' + lineY + 'H' + W + ink +
      '<path d="' + teeth(base, tip, shift) + '" fill="#fff' + ink + '</svg>';
  }

  // Знак студии в пасти: буквы цветов логотипа с тёмным контуром, как наклейка. На узком экране
  // в две строки. Шрифт сайта (Unbounded) к этому моменту обычно уже предзагружен; если нет —
  // буквы встанут системным жирным, а знак проявляется за 0,2 с, и подмена не бросается в глаза.
  var COLORS = ['#E02C83', '#19BFDE', '#F0C913', '#C2CB1B', '#EF8911', '#1F7DD2', '#FF72B6', '#19BFDE'];
  var tall = H > W * 1.1;
  var fs = Math.round(tall ? Math.min(W * 0.2, wide * 0.42) : Math.min(W * 0.1, wide * 0.62));
  function word(text, from) {
    var s = '';
    for (var i = 0; i < text.length; i++) {
      s += '<span style="color:' + COLORS[(from + i) % COLORS.length] + '">' + text.charAt(i) + '</span>';
    }
    return s;
  }
  var sign = '<div class="jaw-w"><div>' + word('MURA', 0) + (tall ? '</div><div>' : '<span>&nbsp;</span>') +
             word('SHOW', 4) + '</div><small>студия праздника</small></div>';

  // брызги: вылетают из линии укуса вверх и вниз и падают
  var WATER = ['#19BFDE', '#8FE3F2', '#fff'], drops = '', i, DROPS = 34;
  for (i = 0; i < DROPS; i++) {
    var size = Math.max(10, Math.round(Math.min(W, H) * (0.02 + Math.random() * 0.05)));
    drops += '<b style="left:' + (3 + 94 * Math.random()) + '%;width:' + size + 'px;height:' + size +
             'px;margin:' + -size / 2 + 'px;background:radial-gradient(circle at 34% 30%,#fff 0 15%,transparent 16%),' +
             WATER[i % 3] + '"></b>';
  }

  var css = d.createElement('style');
  css.textContent =
    '.jaw{position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483646;overflow:hidden;' +
    'cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    '.jaw>i{position:absolute;left:0;width:100%;will-change:transform}' +
    '.jaw-t,.jaw-b{height:calc(50% + ' + th / 2 + 'px)}' +
    '.jaw-t{top:0}.jaw-b{bottom:0}' +
    '.jaw u{position:absolute;left:0;right:0}' +                       // кожа
    '.jaw-t u{top:0;bottom:' + row + 'px;background:' + BLUE + ';box-shadow:inset 0 -' + Math.round(th * 0.22) + 'px ' + LIP + '}' +
    '.jaw-b u{bottom:0;top:' + row + 'px;background:' + CREAM + '}' +
    '.jaw svg{position:absolute;left:0;width:100%;height:' + row + 'px}' +
    '.jaw-t svg{bottom:0}.jaw-b svg{top:0}' +
    '.jaw em{position:absolute;top:40%;width:' + eye + 'px;height:' + eye + 'px;margin:' + -eye / 2 + 'px;' +
    'border-radius:50%;border:' + sw + 'px solid ' + INK + ';' +
    'background:radial-gradient(circle at 40% 52%,#fff 0 8%,transparent 9%),' +
    'radial-gradient(circle at 50% 64%,' + INK + ' 0 30%,#fff 31%)}' +
    '.jaw s{position:absolute;bottom:calc(' + row + 'px + 12%);left:50%;width:' + sw * 3 + 'px;height:' + sw * 5 + 'px;' +
    'border-radius:50%;background:' + INK + '}' +
    '.jaw-in{top:0;height:100%;background:radial-gradient(120% 90% at 50% 55%,#4A0A22 0,#8E1238 38%,#C91F52 78%,#DB2F63 100%)}' +
    '.jaw-in:after{content:"";position:absolute;left:50%;bottom:-20%;width:min(72%,760px);height:52%;' +
    'transform:translateX(-50%);border-radius:50%;background:radial-gradient(60% 70% at 50% 30%,#FF9BCB 0,' + PINK + ' 70%)}' +
    '.jaw-w{position:absolute;left:0;right:0;top:50%;z-index:1;margin-top:' + -(tall ? fs * 1.35 : fs * 0.85) + 'px;' +
    'text-align:center;white-space:nowrap;opacity:0;font:800 ' + fs + 'px/1.05 Unbounded,"Arial Black",Impact,sans-serif;' +
    'letter-spacing:-.02em;-webkit-text-stroke:' + Math.max(3, Math.round(fs * 0.09)) + 'px ' + INK + ';paint-order:stroke fill;' +
    'text-shadow:0 ' + Math.round(fs * 0.07) + 'px 0 ' + INK + '}' +
    '.jaw-w small{display:block;margin-top:' + Math.round(fs * 0.22) + 'px;font:600 ' + Math.max(15, Math.round(fs * 0.24)) +
    'px/1 Onest,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#fff;-webkit-text-stroke:0;text-shadow:none}' +
    '.jaw b{position:absolute;top:50%;border-radius:50%;opacity:0;border:' + Math.max(2, sw - 2) + 'px solid ' + INK + '}';

  var jaw = d.createElement('div');
  jaw.className = 'jaw';
  jaw.setAttribute('aria-hidden', 'true');
  jaw.innerHTML = '<i class="jaw-in">' + sign + '</i>' +
    '<i class="jaw-b" style="transform:translateY(' + wide + 'px)"><u></u>' +
      strip(th, row, th, 0, 0.5) + '</i>' +
    '<i class="jaw-t" style="transform:translateY(' + -wide + 'px)"><u></u>' +
      '<em style="left:28%"></em><em style="left:72%"></em>' +
      '<s style="margin-left:' + -p * 0.3 + 'px"></s><s style="margin-left:' + p * 0.3 + 'px"></s>' +
      strip(0, 0, gum, row, 0) + '</i>' + drops;

  var gone = false, held = false;
  function kill() {
    if (gone || held) { return; }
    gone = true;
    if (jaw.parentNode) { jaw.parentNode.removeChild(jaw); }
    if (css.parentNode) { css.parentNode.removeChild(css); }
    window.removeEventListener('pointerdown', skip, true);
    window.removeEventListener('keydown', skip, true);
  }
  function skip() {             // касание или любая клавиша — заставка уходит сразу
    if (gone || held) { return; }
    jaw.animate([{ opacity: 1 }, { opacity: 0 }],
                { duration: 140, easing: 'ease-out', fill: 'forwards' }).onfinish = kill;
  }

  // Раскадровка, мс: знак в открытой пасти 0–760 → замах 760–1040 → укус 1040–1220 →
  // акула держит и моргает 1220–1960 → отпускает 1960–2700.
  var T = 2700, WIND = 760, BITE_AT = 1040, SHUT = 1220, OPEN = 1960;
  function at(ms) { return ms / T; }
  function ty(v) { return 'translateY(' + v + ')'; }
  var OUT = 'cubic-bezier(.23,1,.32,1)';           // резкий старт, мягкий хвост
  var SOFT = 'cubic-bezier(.45,0,.55,1)';          // дыхание пасти
  var BITE = 'cubic-bezier(.6,0,.9,.4)';           // укус разгоняется и упирается

  function halfFrames(dir) {                       // dir: -1 верхняя челюсть, +1 нижняя
    var w = dir * wide, over = dir * (wide + th * 0.5);
    return [
      { transform: ty(w + 'px'), easing: SOFT },                                       // пасть открыта
      { transform: ty(w * 0.9 + 'px'), offset: at(WIND * 0.5), easing: SOFT },         // «дышит»
      { transform: ty(w + 'px'), offset: at(WIND), easing: OUT },
      { transform: ty(over + 'px'), offset: at(BITE_AT), easing: BITE },               // замах
      { transform: ty(dir * -6 + 'px'), offset: at(SHUT - 40), easing: 'ease-out' },   // щёлк, зубы вдавились
      { transform: ty('0px'), offset: at(SHUT), easing: 'linear' },
      { transform: ty('0px'), offset: at(OPEN), easing: OUT },                         // держит укус
      { transform: ty(dir * 108 + '%'), offset: 1 }                                    // отпустила — под ней сайт
    ];
  }

  function play() {
    if (gone) { return; }
    var opt = { duration: T, fill: 'forwards' };
    var parts = jaw.children;                      // глотка со знаком, низ, верх, дальше капли
    parts[1].animate(halfFrames(1), opt);
    var last = parts[2].animate(halfFrames(-1), opt);
    // глотка видна, пока пасть открыта; за сомкнутыми зубами её уже нет — дальше под ними сайт
    parts[0].animate([{ opacity: 1 }, { opacity: 1, offset: at(SHUT - 30) }, { opacity: 0, offset: at(SHUT - 29) }, { opacity: 0 }], opt);
    // знак проявляется, стоит, а на замахе сжимается: его «проглатывают»
    parts[0].firstChild.animate([
      { opacity: 0, transform: 'scale(.92)', easing: OUT },
      { opacity: 1, transform: 'scale(1)', offset: at(220), easing: 'linear' },
      { opacity: 1, transform: 'scale(1)', offset: at(WIND), easing: 'ease-in' },
      { opacity: 1, transform: 'scale(.82)', offset: at(BITE_AT), easing: 'ease-in' },
      { opacity: 0, transform: 'scale(.5)', offset: at(SHUT - 60) },
      { opacity: 0, transform: 'scale(.5)' }
    ], opt);
    // акула моргает, пока держит укус
    var eyes = parts[2].querySelectorAll('em');
    for (var e = 0; e < eyes.length; e++) {
      eyes[e].animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(.08)' }, { transform: 'scaleY(1)' }],
                      { duration: 170, delay: SHUT + 330, easing: 'ease-in-out' });
    }
    if (!calm) {
      jaw.animate([{ transform: ty('0px') }, { transform: ty('8px') }, { transform: ty('-5px') }, { transform: ty('0px') }],
                  { duration: 180, delay: SHUT - 40, easing: 'ease-out' });            // экран вздрогнул от укуса
    }
    for (var k = 3; k < parts.length; k++) {
      var up = k % 3 ? -1 : 1;                     // две капли из трёх летят вверх
      var dx = (Math.random() - 0.5) * W * 0.24;
      var dy = up * H * (0.1 + Math.random() * 0.26);
      parts[k].animate([
        { opacity: 0, transform: 'translate(0,0) scale(.4)' },
        { opacity: 1, transform: 'translate(' + dx * 0.2 + 'px,' + dy * 0.3 + 'px) scale(1)', offset: 0.1 },
        { opacity: 1, transform: 'translate(' + dx * 0.75 + 'px,' + dy + 'px) scale(1)', offset: 0.5 },
        { opacity: 0, transform: 'translate(' + dx + 'px,' + (dy + H * 0.18) + 'px) scale(.7)' }
      ], { duration: 760 + Math.random() * 240, delay: SHUT - 45 + Math.random() * 70,
           easing: 'cubic-bezier(.2,.6,.35,1)', fill: 'both' });
    }
    if (freeze) {                                  // стоп-кадр: всё замирает на заданной миллисекунде
      held = true;
      var all = jaw.querySelectorAll('*');
      [jaw].concat(Array.prototype.slice.call(all)).forEach(function (el) {
        el.getAnimations().forEach(function (a) { a.pause(); a.currentTime = freeze; });
      });
      return;
    }
    last.onfinish = kill;
    setTimeout(kill, T + 500);                     // страховка, если onfinish не пришёл
  }

  try {
    d.head.appendChild(css);
    root.appendChild(jaw);                         // <body> ещё не разобран — вешаем на <html>
    window.addEventListener('pointerdown', skip, true);
    window.addEventListener('keydown', skip, true);
    // отсчёт идёт от первого нарисованного кадра, а не от разбора <head>
    requestAnimationFrame(function () { requestAnimationFrame(play); });
    setTimeout(kill, 8000);                        // вкладка в фоне или кадр так и не пришёл
  } catch (e) { kill(); }
})();
