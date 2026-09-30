/**
 * LAMEA — Premium micro-interactions (desktop only, motion-safe).
 * 3D tilt on cards, magnetic buttons, product image magnifier.
 * Pure CSS transforms, no dependency. Skipped entirely on touch
 * devices and when the visitor/theme setting requests reduced motion.
 */
(function () {
  "use strict";

  function reducedMotion() {
    return (
      document.documentElement.getAttribute("data-animations") === "off" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function finePointer() {
    return window.matchMedia("(pointer: fine)").matches;
  }

  function initTilt() {
    document.querySelectorAll("[data-tilt]").forEach(function (el) {
      var maxTilt = parseFloat(el.getAttribute("data-tilt-max")) || 6;

      el.addEventListener("mousemove", function (e) {
        var rect = el.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        var rotateY = (x * maxTilt * 2).toFixed(2);
        var rotateX = (y * maxTilt * -2).toFixed(2);
        el.style.transform =
          "perspective(900px) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg) translateZ(0)";
      });

      el.addEventListener("mouseleave", function () {
        el.style.transform = "";
      });
    });
  }

  function initMagnetic() {
    document.querySelectorAll("[data-magnetic]").forEach(function (btn) {
      var strength = parseFloat(btn.getAttribute("data-magnetic-strength")) || 0.3;

      btn.addEventListener("mousemove", function (e) {
        var rect = btn.getBoundingClientRect();
        var x = (e.clientX - rect.left - rect.width / 2) * strength;
        var y = (e.clientY - rect.top - rect.height / 2) * strength;
        btn.style.transform = "translate(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px)";
      });

      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "";
      });
    });
  }

  function initMagnify() {
    document.querySelectorAll("[data-magnify]").forEach(function (wrap) {
      var img = wrap.querySelector("img");
      if (!img) return;

      wrap.addEventListener("mousemove", function (e) {
        var rect = wrap.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * 100;
        var y = ((e.clientY - rect.top) / rect.height) * 100;
        img.style.transformOrigin = x + "% " + y + "%";
        img.style.transform = "scale(1.55)";
      });

      wrap.addEventListener("mouseleave", function () {
        img.style.transform = "";
        img.style.transformOrigin = "";
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (reducedMotion() || !finePointer()) return;
    initTilt();
    initMagnetic();
    initMagnify();
  });
})();
