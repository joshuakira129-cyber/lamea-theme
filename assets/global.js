/**
 * LAMEA — Global theme behaviors.
 * Vanilla JS, no build step. Progressive enhancement: all content is
 * usable if this script fails to load.
 */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
   * Scroll reveal (IntersectionObserver)
   * ---------------------------------------------------------------- */
  function initScrollReveal() {
    var html = document.documentElement;
    if (html.getAttribute("data-animations") === "off") return;

    var targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    targets.forEach(function (el, index) {
      var group = el.closest("[data-reveal-group]");
      if (group && !el.style.getPropertyValue("--reveal-delay")) {
        var siblingIndex = Array.prototype.indexOf.call(
          group.querySelectorAll("[data-reveal]"),
          el
        );
        el.style.setProperty("--reveal-delay", Math.min(siblingIndex * 90, 450) + "ms");
      }
      observer.observe(el);
    });
  }

  /* ------------------------------------------------------------------
   * Light parallax on hero / media (desktop only, transform-based)
   * ---------------------------------------------------------------- */
  function initParallax() {
    var html = document.documentElement;
    if (html.getAttribute("data-parallax") === "off") return;
    if (window.matchMedia("(max-width: 989px)").matches) return;

    var layers = document.querySelectorAll("[data-parallax-speed]");
    if (!layers.length) return;

    var ticking = false;

    function update() {
      var viewportH = window.innerHeight;
      layers.forEach(function (layer) {
        var rect = layer.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > viewportH) return;
        var speed = parseFloat(layer.getAttribute("data-parallax-speed")) || 0.15;
        var offset = (rect.top - viewportH / 2) * speed;
        layer.style.transform = "translate3d(0, " + offset.toFixed(1) + "px, 0)";
      });
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    update();
  }

  /* ------------------------------------------------------------------
   * Header: transparent-to-solid on scroll + mobile nav
   * ---------------------------------------------------------------- */
  function initHeader() {
    var header = document.querySelector("[data-site-header]");
    if (!header) return;

    function toggleScrolled() {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    }
    toggleScrolled();
    window.addEventListener("scroll", toggleScrolled, { passive: true });

    var toggle = header.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-nav]");
    var overlay = document.querySelector("[data-mobile-nav-overlay]");

    function closeMenu() {
      if (!panel) return;
      panel.setAttribute("data-open", "false");
      if (overlay) overlay.setAttribute("data-open", "false");
      toggle && toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("no-scroll");
    }

    function openMenu() {
      if (!panel) return;
      panel.setAttribute("data-open", "true");
      if (overlay) overlay.setAttribute("data-open", "true");
      toggle && toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("no-scroll");
    }

    if (toggle && panel) {
      toggle.addEventListener("click", function () {
        var isOpen = panel.getAttribute("data-open") === "true";
        isOpen ? closeMenu() : openMenu();
      });
    }

    if (overlay) {
      overlay.addEventListener("click", closeMenu);
    }

    document.querySelectorAll("[data-mobile-nav-close]").forEach(function (btn) {
      btn.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });

    document.querySelectorAll("[data-submenu-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var submenu = btn.nextElementSibling;
        var expanded = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!expanded));
        if (submenu) submenu.style.maxHeight = expanded ? null : submenu.scrollHeight + "px";
      });
    });
  }

  /* ------------------------------------------------------------------
   * Accordion (FAQ, product info) — simple, dependency-free
   * ---------------------------------------------------------------- */
  function initAccordions() {
    document.querySelectorAll("[data-accordion]").forEach(function (accordion) {
      var allowMultiple = accordion.getAttribute("data-accordion-multiple") === "true";
      var items = accordion.querySelectorAll("[data-accordion-item]");

      items.forEach(function (item) {
        var trigger = item.querySelector("[data-accordion-trigger]");
        var panel = item.querySelector("[data-accordion-panel]");
        if (!trigger || !panel) return;

        trigger.addEventListener("click", function () {
          var isOpen = item.getAttribute("data-open") === "true";

          if (!allowMultiple) {
            items.forEach(function (other) {
              if (other !== item) {
                other.setAttribute("data-open", "false");
                var otherTrigger = other.querySelector("[data-accordion-trigger]");
                var otherPanel = other.querySelector("[data-accordion-panel]");
                if (otherTrigger) otherTrigger.setAttribute("aria-expanded", "false");
                if (otherPanel) otherPanel.style.maxHeight = null;
              }
            });
          }

          item.setAttribute("data-open", String(!isOpen));
          trigger.setAttribute("aria-expanded", String(!isOpen));
          panel.style.maxHeight = isOpen ? null : panel.scrollHeight + "px";
        });
      });
    });
  }

  /* ------------------------------------------------------------------
   * Quantity input custom element
   * ---------------------------------------------------------------- */
  if (!customElements.get("quantity-input")) {
    customElements.define(
      "quantity-input",
      class QuantityInput extends HTMLElement {
        constructor() {
          super();
          this.input = this.querySelector("input");
          this.querySelectorAll("button").forEach((btn) =>
            btn.addEventListener("click", this.onButtonClick.bind(this))
          );
        }

        onButtonClick(event) {
          event.preventDefault();
          var previousValue = this.input.value;
          if (event.currentTarget.name === "plus") {
            this.input.stepUp();
          } else {
            this.input.stepDown();
          }
          if (previousValue !== this.input.value) {
            this.input.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }
      }
    );
  }

  /* ------------------------------------------------------------------
   * Announcement bar — simple auto-rotate if multiple messages
   * ---------------------------------------------------------------- */
  function initAnnouncementBar() {
    var bar = document.querySelector("[data-announcement-bar]");
    if (!bar) return;
    var items = bar.querySelectorAll("[data-announcement-item]");
    if (items.length < 2) return;

    var current = 0;
    items.forEach(function (item, i) {
      item.style.display = i === 0 ? "" : "none";
    });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setInterval(function () {
      items[current].style.display = "none";
      current = (current + 1) % items.length;
      items[current].style.display = "";
    }, 4200);
  }

  /* ------------------------------------------------------------------
   * Newsletter form — basic UX feedback (Shopify handles submission)
   * ---------------------------------------------------------------- */
  function initNewsletterForms() {
    document.querySelectorAll("[data-newsletter-form]").forEach(function (form) {
      form.addEventListener("submit", function () {
        var button = form.querySelector("button[type='submit']");
        if (button) button.classList.add("is-loading");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initScrollReveal();
    initParallax();
    initHeader();
    initAccordions();
    initAnnouncementBar();
    initNewsletterForms();
  });
})();
