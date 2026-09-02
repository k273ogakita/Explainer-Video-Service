/**
 * CTA文言の横幅溢れ時のみ縮小（data-fit-text）
 * 対象要素が横幅で溢れているとき、font-size を二分探索で下げてフィットさせる。
 * 高さ方向（行数）では縮小しない。テキストは自然に折り返し、はみ出しは overflow: visible で表示する。
 * 切り詰めは行わずフォントサイズのみで調整する（ellipsis 表示禁止）。拡大はしない。下限 12px、上限 16px 固定（縮小のみ行う）。
 * 2つのCTAのフォントサイズを揃えるため、全要素のうち最小のフォントサイズを全要素に適用する。
 */
(function () {
  var MIN_FONT_SIZE_PX = 12;
  var MAX_FONT_SIZE_PX = 16;

  function isOverflowing(el) {
    return el.scrollWidth > el.clientWidth;
  }

  function fitOne(el) {
    var computed = window.getComputedStyle(el);
    var currentPx = parseFloat(computed.fontSize) || MAX_FONT_SIZE_PX;
    if (currentPx > MAX_FONT_SIZE_PX) currentPx = MAX_FONT_SIZE_PX;
    if (!isOverflowing(el)) return currentPx;
    var low = MIN_FONT_SIZE_PX;
    var high = Math.min(currentPx, MAX_FONT_SIZE_PX);
    var best = high;
    while (low <= high) {
      var mid = Math.floor((low + high) / 2);
      el.style.fontSize = mid + "px";
      if (isOverflowing(el)) {
        high = mid - 1;
      } else {
        best = mid;
        low = mid + 1;
      }
    }
    el.style.fontSize = best + "px";
    return best;
  }

  function run() {
    var elements = document.querySelectorAll("[data-fit-text]");
    if (!elements.length) return;
    elements.forEach(function (el) {
      el.style.fontSize = "";
    });
    elements.forEach(function (el) {
      if (isOverflowing(el)) fitOne(el);
    });
    /* 2つのCTAのフォントサイズを揃えるため、全要素のうち最小のフォントサイズを全要素に適用する。 */
    var sizes = Array.prototype.map.call(elements, function (el) {
      var computed = window.getComputedStyle(el);
      return parseFloat(el.style.fontSize || computed.fontSize) || MAX_FONT_SIZE_PX;
    });
    var minSize = Math.min.apply(Math, sizes);
    elements.forEach(function (el) {
      el.style.fontSize = minSize + "px";
    });
  }

  var resizeScheduled = false;
  function onResize() {
    if (resizeScheduled) return;
    resizeScheduled = true;
    requestAnimationFrame(function () {
      resizeScheduled = false;
      run();
    });
  }

  var runScheduled = false;
  function scheduleRun() {
    if (runScheduled) return;
    runScheduled = true;
    requestAnimationFrame(function () {
      runScheduled = false;
      run();
    });
  }

  function observeFitTextElements() {
    var elements = document.querySelectorAll("[data-fit-text]");
    if (!elements.length) return;
    var observer = new MutationObserver(function () {
      scheduleRun();
    });
    for (var i = 0; i < elements.length; i++) {
      observer.observe(elements[i], {
        childList: true,
        subtree: true,
        characterData: true,
        characterDataOldValue: false
      });
    }
  }

  function onReady() {
    run();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        run();
        observeFitTextElements();
      });
    } else {
      observeFitTextElements();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }
  window.addEventListener("resize", onResize);
})();
