/**
 * LAMEA — Standalone /cart page enhancements.
 * Mirrors the cart drawer's AJAX behavior (quantity change, remove) using
 * the Section Rendering API, so the customer never leaves the page.
 * The <form action="/cart"> fallback still works natively without JS.
 */
(function () {
  "use strict";

  function initCartPage(section) {
    var sectionId = section.getAttribute("data-section-id");

    function refresh() {
      section.classList.add("is-loading");
      return fetch(window.location.pathname + "?sections=" + sectionId)
        .then(function (res) { return res.json(); })
        .then(function (data) {
          var html = data[sectionId];
          if (!html) return;
          var parser = new DOMParser();
          var doc = parser.parseFromString(html, "text/html");
          var newSection = doc.querySelector("[data-cart-page-section]");
          if (newSection) {
            section.innerHTML = newSection.innerHTML;
          }
          if (window.LAMEA && window.LAMEA.cart) {
            window.LAMEA.cart.refresh();
          }
        })
        .finally(function () {
          section.classList.remove("is-loading");
        });
    }

    section.addEventListener("click", function (e) {
      var removeBtn = e.target.closest("[data-cart-remove]");
      if (removeBtn && window.LAMEA && window.LAMEA.cart) {
        e.preventDefault();
        window.LAMEA.cart.changeItem(removeBtn.getAttribute("data-line"), 0).then(refresh);
      }
    });

    section.addEventListener("change", function (e) {
      if (e.target.matches("[data-cart-quantity-input]") && window.LAMEA && window.LAMEA.cart) {
        var value = parseInt(e.target.value, 10);
        if (isNaN(value) || value < 0) value = 0;
        window.LAMEA.cart.changeItem(e.target.getAttribute("data-line"), value).then(refresh);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var section = document.querySelector("[data-cart-page-section]");
    if (section) initCartPage(section);
  });
})();
