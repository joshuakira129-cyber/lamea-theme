/**
 * LAMEA — Cart drawer + AJAX cart API.
 * Exposes window.LAMEA.cart for other scripts (product-form.js) to use.
 * Falls back gracefully: every form that uses this still works with a
 * full page reload if JavaScript fails, because forms post to native
 * Shopify cart routes.
 */
(function () {
  "use strict";

  window.LAMEA = window.LAMEA || {};

  var SECTION_ID = "cart-drawer";

  function fetchCartSections() {
    return fetch("/?sections=" + SECTION_ID)
      .then(function (res) { return res.json(); })
      .catch(function () { return null; });
  }

  function renderDrawer(html) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(html, "text/html");
    var newDrawer = doc.querySelector("cart-drawer");
    var currentDrawer = document.querySelector("cart-drawer");
    if (newDrawer && currentDrawer) {
      var wasOpen = currentDrawer.getAttribute("data-open");
      currentDrawer.innerHTML = newDrawer.innerHTML;
      currentDrawer.setAttribute("data-open", wasOpen);
    }
  }

  function updateCartCount(count) {
    document.querySelectorAll("[data-cart-count]").forEach(function (el) {
      el.textContent = count;
      el.classList.toggle("hidden", count === 0);
    });
  }

  function announce(message) {
    var live = document.getElementById("lamea-a11y-refresh");
    if (live) live.textContent = message;
  }

  function refreshCartUI() {
    return fetchCartSections().then(function (data) {
      if (!data) return;
      if (data[SECTION_ID]) renderDrawer(data[SECTION_ID]);
      return fetch("/cart.js")
        .then(function (r) { return r.json(); })
        .then(function (cart) {
          updateCartCount(cart.item_count);
          return cart;
        });
    });
  }

  function addItem(formData) {
    return fetch("/cart/add.js", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: formData,
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) {
            var error = new Error(data.description || "Cart error");
            error.data = data;
            throw error;
          }
          return data;
        });
      })
      .then(function (item) {
        return refreshCartUI().then(function () {
          announce("Ajouté au panier : " + item.product_title);
          openDrawer();
          return item;
        });
      });
  }

  function changeItem(line, quantity) {
    return fetch("/cart/change.js", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ line: line, quantity: quantity }),
    })
      .then(function (res) { return res.json(); })
      .then(function () { return refreshCartUI(); });
  }

  function openDrawer() {
    var drawer = document.querySelector("cart-drawer");
    if (!drawer || drawer.getAttribute("data-cart-type") === "page") return;
    drawer.setAttribute("data-open", "true");
    document.body.classList.add("no-scroll");
  }

  function closeDrawer() {
    var drawer = document.querySelector("cart-drawer");
    if (!drawer) return;
    drawer.setAttribute("data-open", "false");
    document.body.classList.remove("no-scroll");
  }

  window.LAMEA.cart = {
    addItem: addItem,
    changeItem: changeItem,
    refresh: refreshCartUI,
    open: openDrawer,
    close: closeDrawer,
  };

  if (!customElements.get("cart-drawer")) {
    customElements.define(
      "cart-drawer",
      class CartDrawer extends HTMLElement {
        connectedCallback() {
          this.addEventListener("click", (e) => {
            if (e.target.closest("[data-cart-drawer-close]")) {
              closeDrawer();
            }
            if (e.target.closest("[data-cart-remove]")) {
              e.preventDefault();
              var btn = e.target.closest("[data-cart-remove]");
              this.setLoading(true);
              changeItem(btn.getAttribute("data-line"), 0).then(() => this.setLoading(false));
            }
            if (e.target.closest("[data-cart-upsell-add]")) {
              var upsellBtn = e.target.closest("[data-cart-upsell-add]");
              var fd = new FormData();
              fd.append("id", upsellBtn.getAttribute("data-variant-id"));
              fd.append("quantity", 1);
              this.setLoading(true);
              addItem(fd).then(() => this.setLoading(false));
            }
          });

          this.addEventListener("change", (e) => {
            if (e.target.matches("[data-cart-quantity-input]")) {
              var input = e.target;
              var value = parseInt(input.value, 10);
              if (isNaN(value) || value < 0) value = 0;
              this.setLoading(true);
              changeItem(input.getAttribute("data-line"), value).then(() => this.setLoading(false));
            }
          });

          document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && this.getAttribute("data-open") === "true") closeDrawer();
          });
        }

        setLoading(isLoading) {
          var body = this.querySelector("[data-cart-drawer-body]");
          if (body) body.classList.toggle("is-loading", isLoading);
        }
      }
    );
  }

  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-cart-icon-bubble]");
    if (opener && document.querySelector("cart-drawer[data-cart-type='drawer']")) {
      e.preventDefault();
      openDrawer();
    }
  });
})();
