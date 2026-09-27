/**
 * LAMEA — Generic horizontal slider controls.
 * Works on any [data-slider-wrap] containing one [data-slider] scrollable
 * track plus optional [data-slider-prev] / [data-slider-next] buttons.
 * The track itself is a native scroll-snap element, so it stays fully
 * usable (swipe / trackpad / keyboard) even if this script never runs.
 */
(function () {
  "use strict";

  function initSlider(wrap) {
    var track = wrap.querySelector("[data-slider]");
    var prevBtn = wrap.querySelector("[data-slider-prev]");
    var nextBtn = wrap.querySelector("[data-slider-next]");
    if (!track) return;

    function slideStep() {
      var firstItem = track.children[0];
      if (!firstItem) return track.clientWidth;
      var styles = window.getComputedStyle(track);
      var gap = parseFloat(styles.columnGap || styles.gap || 0);
      return firstItem.getBoundingClientRect().width + gap;
    }

    function updateControls() {
      if (!prevBtn || !nextBtn) return;
      var maxScroll = track.scrollWidth - track.clientWidth - 2;
      prevBtn.toggleAttribute("disabled", track.scrollLeft <= 0);
      nextBtn.toggleAttribute("disabled", track.scrollLeft >= maxScroll);
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        track.scrollBy({ left: -slideStep(), behavior: "smooth" });
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        track.scrollBy({ left: slideStep(), behavior: "smooth" });
      });
    }

    track.addEventListener("scroll", updateControls, { passive: true });
    updateControls();
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-slider-wrap]").forEach(initSlider);
  });
})();
