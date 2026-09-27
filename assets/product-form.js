/**
 * LAMEA — Product page behaviors: variant selection, AJAX add-to-cart,
 * gallery sync, sticky mobile bar. Everything degrades to a normal
 * Shopify form submission if JavaScript fails.
 */
(function () {
  "use strict";

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = precision >= 0 ? precision : 2;
    thousands = thousands === undefined ? "," : thousands;
    decimal = decimal === undefined ? "." : decimal;

    if (isNaN(number) || number == null) return "0";

    number = (number / 100.0).toFixed(precision);
    var parts = number.split(".");
    var dollars = parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1" + thousands);
    var cents = parts[1] ? decimal + parts[1] : "";
    return dollars + cents;
  }

  function money(cents) {
    var format = window.themeMoneyFormat || "{{amount}}";
    var placeholder = /\{\{\s*(\w+)\s*\}\}/;
    var match = format.match(placeholder);
    if (!match) return formatWithDelimiters(cents);

    var value;
    switch (match[1]) {
      case "amount":
        value = formatWithDelimiters(cents, 2);
        break;
      case "amount_no_decimals":
        value = formatWithDelimiters(cents, 0);
        break;
      case "amount_with_comma_separator":
        value = formatWithDelimiters(cents, 2, ".", ",");
        break;
      case "amount_no_decimals_with_comma_separator":
        value = formatWithDelimiters(cents, 0, ".", ",");
        break;
      default:
        value = formatWithDelimiters(cents, 2);
    }
    return format.replace(placeholder, value);
  }

  /* ------------------------------------------------------------------
   * Gallery
   * ---------------------------------------------------------------- */
  function initGallery(root) {
    var gallery = root.querySelector("[data-product-gallery]");
    if (!gallery) return null;

    var main = gallery.querySelector("[data-gallery-main]");
    var slides = Array.prototype.slice.call(gallery.querySelectorAll("[data-gallery-slide]"));
    var thumbs = Array.prototype.slice.call(gallery.querySelectorAll("[data-gallery-thumb]"));
    var dots = Array.prototype.slice.call(gallery.querySelectorAll("[data-gallery-dot]"));
    var prevBtn = gallery.querySelector("[data-gallery-prev]");
    var nextBtn = gallery.querySelector("[data-gallery-next]");

    function setActive(mediaId) {
      thumbs.forEach(function (t) {
        t.classList.toggle("is-active", t.getAttribute("data-media-id") === String(mediaId));
        t.setAttribute("aria-selected", t.getAttribute("data-media-id") === String(mediaId) ? "true" : "false");
      });
      dots.forEach(function (d) {
        d.classList.toggle("is-active", d.getAttribute("data-media-id") === String(mediaId));
      });
    }

    function goTo(mediaId) {
      var target = slides.filter(function (s) { return s.getAttribute("data-media-id") === String(mediaId); })[0];
      if (target && main) {
        main.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
      }
      setActive(mediaId);
    }

    thumbs.forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        goTo(thumb.getAttribute("data-media-id"));
      });
    });

    if (prevBtn && nextBtn && main) {
      prevBtn.addEventListener("click", function () {
        main.scrollBy({ left: -main.clientWidth, behavior: "smooth" });
      });
      nextBtn.addEventListener("click", function () {
        main.scrollBy({ left: main.clientWidth, behavior: "smooth" });
      });
    }

    if (main && "IntersectionObserver" in window && slides.length > 1) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
              setActive(entry.target.getAttribute("data-media-id"));
            }
          });
        },
        { root: main, threshold: 0.6 }
      );
      slides.forEach(function (s) { observer.observe(s); });
    }

    return { goTo: goTo };
  }

  /* ------------------------------------------------------------------
   * Variant picker
   * ---------------------------------------------------------------- */
  function initVariantPicker(root, gallery) {
    var picker = root.querySelector("[data-variant-picker]");
    if (!picker) return;

    var jsonEl = picker.querySelector("[data-product-json]");
    var variants = [];
    try {
      variants = JSON.parse(jsonEl.textContent);
    } catch (e) {
      variants = [];
    }

    var nativeSelect = picker.querySelector("[data-native-variant-select]");
    var pills = Array.prototype.slice.call(picker.querySelectorAll("[data-variant-pill]"));
    var optionFieldsets = Array.prototype.slice.call(picker.querySelectorAll("[data-option-index]"));

    var submitButton = root.querySelector("[data-add-to-cart]");
    var priceEl = root.querySelector("[data-current-price]");
    var compareEl = root.querySelector("[data-compare-price]");
    var stickyPrice = root.querySelector("[data-sticky-cart-price]");
    var stickySubmit = root.querySelector("[data-sticky-cart-submit]");

    function currentSelection() {
      return optionFieldsets.map(function (fieldset) {
        var selected = fieldset.querySelector(".variant-pill.is-selected");
        return selected ? selected.getAttribute("data-value") : null;
      });
    }

    function findVariant(selection) {
      return variants.filter(function (variant) {
        return variant.options.every(function (opt, i) { return opt === selection[i]; });
      })[0];
    }

    function updateAvailability(selection) {
      pills.forEach(function (pill) {
        var optionIndex = parseInt(pill.getAttribute("data-option-index"), 10);
        var testSelection = selection.slice();
        testSelection[optionIndex] = pill.getAttribute("data-value");
        var possible = variants.some(function (variant) {
          return variant.options.every(function (opt, i) {
            return testSelection[i] === null || opt === testSelection[i];
          });
        });
        pill.disabled = !possible;
      });
    }

    function selectVariant(variant) {
      if (!variant) return;
      if (nativeSelect) nativeSelect.value = variant.id;

      if (priceEl) priceEl.textContent = money(variant.price);
      if (variant.compare_at_price && variant.compare_at_price > variant.price) {
        if (compareEl) compareEl.textContent = money(variant.compare_at_price);
      }
      if (stickyPrice) stickyPrice.textContent = money(variant.price);

      [submitButton, stickySubmit].forEach(function (btn) {
        if (!btn) return;
        btn.disabled = !variant.available;
        var label = btn.querySelector(".product-form__submit-label") || btn;
        if (!variant.available) {
          label.textContent = window.themeStrings ? window.themeStrings.soldOut : "Épuisé";
        }
      });

      if (variant.featured_media && gallery) {
        gallery.goTo(variant.featured_media.id);
      }

      root.querySelectorAll(".variant-option__value").forEach(function (el, i) {
        var fieldset = optionFieldsets[i];
        if (!fieldset) return;
        var selected = fieldset.querySelector(".variant-pill.is-selected");
        if (selected) el.textContent = selected.getAttribute("data-value");
      });
    }

    pills.forEach(function (pill) {
      pill.addEventListener("click", function () {
        if (pill.disabled) return;
        var fieldset = pill.closest("[data-option-index]");
        fieldset.querySelectorAll(".variant-pill").forEach(function (p) {
          p.classList.remove("is-selected");
        });
        pill.classList.add("is-selected");

        var selection = currentSelection();
        updateAvailability(selection);
        var variant = findVariant(selection);
        if (variant) selectVariant(variant);
      });
    });

    if (nativeSelect) {
      nativeSelect.addEventListener("change", function () {
        var variant = variants.filter(function (v) { return String(v.id) === nativeSelect.value; })[0];
        selectVariant(variant);
      });
    }

    if (pills.length) {
      updateAvailability(currentSelection());
    }
  }

  /* ------------------------------------------------------------------
   * Add to cart (AJAX)
   * ---------------------------------------------------------------- */
  function initAddToCart(root) {
    var form = root.querySelector("form[data-product-form], form[data-type='add-to-cart-form']");
    if (!form) return;

    var submitButton = form.querySelector("[data-add-to-cart]");
    var errorEl = root.querySelector("[data-upload-error]");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (submitButton) submitButton.classList.add("is-loading");
      if (errorEl) {
        errorEl.hidden = true;
        errorEl.textContent = "";
      }

      var formData = new FormData(form);

      if (window.LAMEA && window.LAMEA.cart) {
        window.LAMEA.cart
          .addItem(formData)
          .catch(function (error) {
            if (errorEl) {
              errorEl.hidden = false;
              errorEl.textContent =
                (error && error.data && error.data.description) ||
                "Une erreur est survenue. Merci de réessayer.";
            }
          })
          .then(function () {
            if (submitButton) submitButton.classList.remove("is-loading");
          });
      } else {
        form.submit();
      }
    });

    var stickySubmit = root.querySelector("[data-sticky-cart-submit]");
    if (stickySubmit) {
      stickySubmit.addEventListener("click", function () {
        if (form.requestSubmit) {
          form.requestSubmit();
        } else {
          form.dispatchEvent(new Event("submit", { cancelable: true }));
        }
      });
    }
  }

  /* ------------------------------------------------------------------
   * Sticky mobile add-to-cart bar
   * ---------------------------------------------------------------- */
  function initStickyBar(root) {
    var bar = document.querySelector("[data-sticky-cart]");
    var trigger = root.querySelector("[data-add-to-cart]");
    if (!bar || !trigger || !("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          bar.classList.toggle("is-visible", !entry.isIntersecting && entry.boundingClientRect.top < 0);
        });
      },
      { threshold: 0 }
    );
    observer.observe(trigger);
  }

  /* ------------------------------------------------------------------
   * Quantity sync (product form -> hidden quantity input for form submit)
   * ---------------------------------------------------------------- */
  function initQuantitySync(root) {
    var qtyInput = root.querySelector("[data-quantity-input]");
    var hiddenQty = root.querySelector("[data-quantity-value]");
    if (!qtyInput || !hiddenQty) return;
    qtyInput.setAttribute("name", "quantity");
    hiddenQty.remove();
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-product-section]").forEach(function (root) {
      var gallery = initGallery(root);
      initVariantPicker(root, gallery);
      initQuantitySync(root);
      initAddToCart(root);
      initStickyBar(root);
    });
  });
})();
