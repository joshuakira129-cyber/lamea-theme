/**
 * LAMEA — Sticky storytelling scroll effect (desktop only).
 * As the visitor scrolls past each "moment" block, the sticky frame swaps
 * its visible media and the corresponding text gains focus (is-active).
 * On mobile the layout stacks normally (see CSS) so this script simply
 * does nothing below the desktop breakpoint.
 */
(function () {
  "use strict";

  function initStorySection(section) {
    var triggers = section.querySelectorAll("[data-story-trigger]");
    var mediaItems = section.querySelectorAll("[data-story-media]");
    if (!triggers.length || !("IntersectionObserver" in window)) return;

    function setActive(index) {
      mediaItems.forEach(function (media) {
        media.classList.toggle("is-active", media.getAttribute("data-story-index") === String(index));
      });
      triggers.forEach(function (trigger) {
        trigger.classList.toggle("is-active", trigger.getAttribute("data-story-index") === String(index));
      });

      var activeVideo = section.querySelector('[data-story-index="' + index + '"] video');
      section.querySelectorAll("video").forEach(function (video) {
        if (video !== activeVideo) video.pause();
      });
      if (activeVideo) {
        var playPromise = activeVideo.play();
        if (playPromise && playPromise.catch) playPromise.catch(function () {});
      }
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActive(entry.target.getAttribute("data-story-index"));
          }
        });
      },
      { threshold: 0.55, rootMargin: "-15% 0px -15% 0px" }
    );

    triggers.forEach(function (trigger) {
      observer.observe(trigger);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-story-section]").forEach(initStorySection);
  });
})();
