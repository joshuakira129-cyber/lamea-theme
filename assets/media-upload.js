/**
 * LAMEA — Memories upload widget (photos & videos).
 *
 * Storage strategy is provider-driven (see snippets/product-upload.liquid
 * and README.md "Upload de médias"):
 *
 *  - provider "none" (default): files are attached directly to the
 *    hidden native `<input type="file" name="properties[Souvenir N]">`
 *    slots rendered by Liquid, using a DataTransfer object. These are
 *    real Shopify line-item file properties — no external service
 *    required, nothing fake.
 *
 *  - any other provider value: each file is uploaded via fetch() to
 *    settings.upload_endpoint_url. The endpoint must return JSON
 *    `{ "url": "https://..." }`. That URL is stored as a plain text
 *    line-item property instead of the raw file. If the request fails,
 *    the widget automatically falls back to the native file slots so
 *    the customer never loses their memory.
 *
 * Without JavaScript, none of this runs: the native file slots
 * (snippets/product-upload.liquid `[data-upload-slots]`) are shown
 * directly and work through a normal form submission.
 */
(function () {
  "use strict";

  var ACCEPTED_TYPE = /^image\/|^video\//;

  function initUploadWidget(widget) {
    var provider = widget.getAttribute("data-provider") || "none";

    if ((provider === "none" || provider === "") && typeof DataTransfer === "undefined") {
      widget.classList.add("product-upload--no-datatransfer");
      return;
    }

    var dropzone = widget.querySelector("[data-upload-dropzone]");
    var fileInput = widget.querySelector("[data-upload-input]");
    var list = widget.querySelector("[data-upload-list]");
    var errorEl = widget.querySelector("[data-upload-error]");
    var slots = Array.prototype.slice.call(widget.querySelectorAll("[data-upload-slot]"));
    var endpoint = widget.getAttribute("data-endpoint");
    var maxFiles = parseInt(widget.getAttribute("data-max-files"), 10) || slots.length || 10;

    var externalCount = 0;
    var itemCount = 0;

    function showError(message) {
      if (!errorEl) return;
      errorEl.hidden = false;
      errorEl.textContent = message;
    }

    function clearError() {
      if (!errorEl) return;
      errorEl.hidden = true;
      errorEl.textContent = "";
    }

    function nextEmptySlot() {
      return slots.filter(function (slot) { return !slot.files || slot.files.length === 0; })[0];
    }

    function assignToNativeSlot(file) {
      var slot = nextEmptySlot();
      if (!slot) return null;
      var dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      slot.files = dataTransfer.files;
      return slot;
    }

    function createHiddenTextInput(url) {
      externalCount += 1;
      var input = document.createElement("input");
      input.type = "hidden";
      input.name = "properties[Souvenir " + externalCount + "]";
      input.value = url;
      input.setAttribute("data-upload-hidden-input", "");
      widget.appendChild(input);
      return input;
    }

    function uploadToExternal(file) {
      var body = new FormData();
      body.append("file", file);
      return fetch(endpoint, { method: "POST", body: body })
        .then(function (res) {
          if (!res.ok) throw new Error("Upload failed");
          return res.json();
        })
        .then(function (data) {
          if (!data || !data.url) throw new Error("Missing url in response");
          return data.url;
        });
    }

    function buildPreviewItem(file) {
      itemCount += 1;
      var li = document.createElement("li");
      li.className = "upload-item";
      li.setAttribute("data-upload-item", "");

      var isVideo = file.type.indexOf("video/") === 0;
      var objectUrl = URL.createObjectURL(file);

      if (isVideo) {
        var video = document.createElement("video");
        video.src = objectUrl;
        video.muted = true;
        video.playsInline = true;
        li.appendChild(video);
      } else {
        var img = document.createElement("img");
        img.src = objectUrl;
        img.alt = file.name;
        li.appendChild(img);
      }

      var status = document.createElement("span");
      status.className = "upload-item__status";
      li.appendChild(status);

      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "upload-item__remove";
      removeBtn.setAttribute("aria-label", widget.getAttribute("data-remove-label") || "Supprimer");
      removeBtn.innerHTML =
        '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/></svg>';
      li.appendChild(removeBtn);

      list.appendChild(li);
      return { element: li, status: status, removeBtn: removeBtn, objectUrl: objectUrl };
    }

    function handleFiles(fileList) {
      clearError();
      var files = Array.prototype.slice.call(fileList);
      var currentCount = list.children.length;

      if (currentCount >= maxFiles) {
        showError(widget.getAttribute("data-error-too-many") || "Nombre maximum de fichiers atteint.");
        return;
      }

      var accepted = files.filter(function (file) {
        if (!ACCEPTED_TYPE.test(file.type)) {
          showError(widget.getAttribute("data-error-type") || "Format non pris en charge.");
          return false;
        }
        return true;
      });

      var room = maxFiles - currentCount;
      if (accepted.length > room) {
        accepted = accepted.slice(0, room);
        showError(widget.getAttribute("data-error-too-many") || "Nombre maximum de fichiers atteint.");
      }

      accepted.forEach(function (file) {
        var preview = buildPreviewItem(file);
        var nativeSlot = null;

        if (provider === "none" || provider === "" ) {
          nativeSlot = assignToNativeSlot(file);
          preview.status.textContent = "";
          preview.removeBtn.addEventListener("click", function () {
            if (nativeSlot) nativeSlot.value = "";
            URL.revokeObjectURL(preview.objectUrl);
            preview.element.remove();
          });
        } else {
          preview.status.textContent = "…";
          uploadToExternal(file)
            .then(function (url) {
              var hiddenInput = createHiddenTextInput(url);
              preview.status.textContent = "";
              preview.removeBtn.addEventListener("click", function () {
                hiddenInput.remove();
                URL.revokeObjectURL(preview.objectUrl);
                preview.element.remove();
              });
            })
            .catch(function () {
              var slot = assignToNativeSlot(file);
              preview.status.textContent = "";
              preview.element.classList.toggle("has-error", !slot);
              preview.removeBtn.addEventListener("click", function () {
                if (slot) slot.value = "";
                URL.revokeObjectURL(preview.objectUrl);
                preview.element.remove();
              });
            });
        }
      });
    }

    if (dropzone && fileInput) {
      dropzone.addEventListener("click", function () {
        fileInput.click();
      });

      fileInput.addEventListener("change", function () {
        handleFiles(fileInput.files);
        fileInput.value = "";
      });

      ["dragenter", "dragover"].forEach(function (evt) {
        dropzone.addEventListener(evt, function (e) {
          e.preventDefault();
          dropzone.classList.add("is-dragover");
        });
      });

      ["dragleave", "drop"].forEach(function (evt) {
        dropzone.addEventListener(evt, function (e) {
          e.preventDefault();
          dropzone.classList.remove("is-dragover");
        });
      });

      dropzone.addEventListener("drop", function (e) {
        if (e.dataTransfer && e.dataTransfer.files) {
          handleFiles(e.dataTransfer.files);
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-product-upload]").forEach(initUploadWidget);
  });
})();
