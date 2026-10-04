// MURA SHOW — заставка: акула раскрывает пасть и кусает экран, из-под зубов летят брызги.
// Один раз за сессию браузера. Подключается синхронно в <head>: первый же кадр — уже пасть,
// страница под ней не мигает. Сети не трогает: зубы, глаза и брызги рисуются здесь же.
(function () {
  'use strict';
  var d = document, root = d.documentElement, KEY = 'mura-intro';

  // ?jaw в адресе — показать ещё раз и с полным движением (для показа заказчику),
  // ?jaw=540 — стоп-кадр на 540-й миллисекунде (для приёмки снимками)
  var demo = /[?&]jaw(?:=(\d+))?(?:&|$)/.exec(location.search);
  if (!demo) {
    try {
      if (sessionStorage.getItem(KEY)) { return; }
      sessionStorage.setItem(KEY, '1');
    } catch (e) { return; }     // хранилище закрыто: лучше без заставки, чем заставка на каждой странице
  }

  var W = window.innerWidth, H = window.innerHeight;
  if (!root.animate || !W || !H || (!demo && d.visibilityState === 'hidden')) { return; }
  // у кого в системе выключена анимация, тот видит неподвижный укус, который растворяется:
  // движения нет, а акула на входе есть
  var calm = !demo && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  // брызги: вылетают из линии укуса вверх и вниз и падают
  var WATER = ['#19BFDE', '#8FE3F2', '#fff'], drops = '', i;
  for (i = 0; i < 22; i++) {
    var size = Math.max(10, Math.round(Math.min(W, H) * (0.022 + Math.random() * 0.04)));
    drops += '<b style="left:' + (4 + 92 * Math.random()) + '%;width:' + size + 'px;height:' + size +
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
    '.jaw b{position:absolute;top:50%;border-radius:50%;opacity:0;border:' + Math.max(2, sw - 2) + 'px solid ' + INK + '}';

  var from = calm ? 0 : wide * 0.45;               // тихий вариант стоит сомкнутым с первого кадра
  var jaw = d.createElement('div');
  jaw.className = 'jaw';
  jaw.setAttribute('aria-hidden', 'true');
  jaw.innerHTML = (calm ? '' : '<i class="jaw-in"></i>') +
    '<i class="jaw-b" style="transform:translateY(' + from + 'px)"><u></u>' +
      strip(th, row, th, 0, 0.5) + '</i>' +
    '<i class="jaw-t" style="transform:translateY(' + -from + 'px)"><u></u>' +
      '<em style="left:28%"></em><em style="left:72%"></em>' +
      '<s style="margin-left:' + -p * 0.3 + 'px"></s><s style="margin-left:' + p * 0.3 + 'px"></s>' +
      strip(0, 0, gum, row, 0) + '</i>' +
    (calm ? '' : drops);

  var gone = false, held = false;
  function kill() {
    if (gone || held) { return; }
    gone = true;
    if (jaw.parentNode) { jaw.parentNode.removeChild(jaw); }
    if (css.parentNode) { css.parentNode.removeChild(css); }
    window.removeEventListener('pointerdown', skip, true);
    window.removeEventListener('keydown', skip, true);
  }
  function skip() {             // касание или клавиша — заставка уходит сразу
    if (gone || held) { return; }
    jaw.animate([{ opacity: 1 }, { opacity: 0 }],
                { duration: 140, easing: 'ease-out', fill: 'forwards' }).onfinish = kill;
  }

  var T = 1380;                                    // вся заставка, мс
  function at(ms) { return ms / T; }
  function ty(v) { return 'translateY(' + v + ')'; }
  var OUT = 'cubic-bezier(.23,1,.32,1)';           // раскрытие: резкий старт, мягкий хвост
  var BITE = 'cubic-bezier(.6,0,.9,.4)';           // укус разгоняется и упирается

  function halfFrames(dir) {                       // dir: -1 верхняя челюсть, +1 нижняя
    return [
      { transform: ty(dir * wide * 0.45 + 'px'), easing: OUT },                        // приоткрыта
      { transform: ty(dir * (wide + th * 0.4) + 'px'), offset: at(260), easing: 'linear' },   // распахнулась
      { transform: ty(dir * (wide + th * 0.4) + 'px'), offset: at(330), easing: BITE },
      { transform: ty(dir * -6 + 'px'), offset: at(540), easing: 'ease-out' },         // щёлк, зубы вдавились
      { transform: ty('0px'), offset: at(600), easing: 'linear' },
      { transform: ty('0px'), offset: at(760), easing: OUT },                          // держит укус
      { transform: ty(dir * 108 + '%'), offset: 1 }                                    // отпустила — под ней сайт
    ];
  }

  function play() {
    if (gone) { return; }
    if (calm) {
      jaw.animate([{ opacity: 1 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }],
                  { duration: 640, easing: 'ease-out', fill: 'forwards' }).onfinish = kill;
      return;
    }
    var opt = { duration: T, fill: 'forwards' };
    var parts = jaw.children;                      // глотка, низ, верх, дальше капли
    parts[1].animate(halfFrames(1), opt);
    parts[2].animate(halfFrames(-1), opt).onfinish = kill;
    // глотка видна, пока пасть открыта; за сомкнутыми зубами её уже нет — дальше под ними сайт
    parts[0].animate([{ opacity: 1 }, { opacity: 1, offset: at(560) }, { opacity: 0, offset: at(561) }, { opacity: 0 }], opt);
    jaw.animate([{ transform: ty('0px') }, { transform: ty('7px') }, { transform: ty('-4px') }, { transform: ty('0px') }],
                { duration: 170, delay: 540, easing: 'ease-out' });               // экран вздрогнул от укуса
    for (var k = 3; k < parts.length; k++) {
      var up = k % 3 ? -1 : 1;                     // две капли из трёх летят вверх
      var dx = (Math.random() - 0.5) * W * 0.22;
      var dy = up * H * (0.1 + Math.random() * 0.22);
      parts[k].animate([
        { opacity: 0, transform: 'translate(0,0) scale(.4)' },
        { opacity: 1, transform: 'translate(' + dx * 0.2 + 'px,' + dy * 0.3 + 'px) scale(1)', offset: 0.1 },
        { opacity: 1, transform: 'translate(' + dx * 0.75 + 'px,' + dy + 'px) scale(1)', offset: 0.5 },
        { opacity: 0, transform: 'translate(' + dx + 'px,' + (dy + H * 0.16) + 'px) scale(.7)' }
      ], { duration: 640 + Math.random() * 160, delay: 535 + Math.random() * 50,
           easing: 'cubic-bezier(.2,.6,.35,1)', fill: 'both' });
    }
    if (demo && demo[1]) {                         // стоп-кадр: всё замирает на заданной миллисекунде
      held = true;
      [jaw].concat(Array.prototype.slice.call(parts)).forEach(function (el) {
        el.getAnimations().forEach(function (a) { a.pause(); a.currentTime = +demo[1]; });
      });
      return;
    }
    setTimeout(kill, T + 500);                     // страховка, если onfinish не пришёл
  }

  try {
    d.head.appendChild(css);
    root.appendChild(jaw);                         // <body> ещё не разобран — вешаем на <html>
    window.addEventListener('pointerdown', skip, true);
    window.addEventListener('keydown', skip, true);
    // отсчёт идёт от первого нарисованного кадра, а не от разбора <head>
    requestAnimationFrame(function () { requestAnimationFrame(play); });
    setTimeout(kill, 6000);                        // вкладка в фоне или кадр так и не пришёл
  } catch (e) { kill(); }
})();
