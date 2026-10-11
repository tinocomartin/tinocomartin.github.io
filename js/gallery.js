// ============================================================
// Visor de imágenes (lightbox) con relatos
// ------------------------------------------------------------
// - Funciona con cualquier galería que use el layout "gallery".
// - Los textos (título, lugar, fecha, relato) se gestionan de forma
//   visual desde /admin/ y llegan ya listos en cada miniatura
//   (atributos data-titulo, data-lugar, data-fecha, data-relato).
// - No hace falta tocar este archivo al añadir fotos o relatos.
// ============================================================
document.addEventListener("DOMContentLoaded", function () {
  var grid = document.getElementById("gallery-grid");
  var lightbox = document.getElementById("lightbox");
  if (!grid || !lightbox) return;

  var items = Array.prototype.slice.call(grid.querySelectorAll(".gallery-item"));
  if (items.length === 0) return;

  var el = {
    img: lightbox.querySelector(".lb-img"),
    caption: lightbox.querySelector(".lb-caption"),
    counter: lightbox.querySelector(".lb-counter"),
    close: lightbox.querySelector(".lb-close"),
    prev: lightbox.querySelector(".lb-prev"),
    next: lightbox.querySelector(".lb-next"),
    toggle: lightbox.querySelector(".lb-toggle"),
    stage: lightbox.querySelector(".lb-stage"),
    story: lightbox.querySelector(".lb-story"),
    meta: lightbox.querySelector(".lb-meta"),
    title: lightbox.querySelector(".lb-title"),
    text: lightbox.querySelector(".lb-text")
  };

  var currentIndex = 0;
  var lastFocused = null;
  var storyHidden = readPref();

  // ---------- Utilidades ----------

  function slug(file) {
    return (file || "")
      .toString()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/\.(jpe?g|png|webp|gif|tiff?)$/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function readPref() {
    try { return localStorage.getItem("lb-story-hidden") === "1"; } catch (e) { return false; }
  }
  function savePref(v) {
    try { localStorage.setItem("lb-story-hidden", v ? "1" : "0"); } catch (e) {}
  }

  // ---------- Pintado del visor ----------

  function dataFor(item) {
    return {
      file: item.getAttribute("data-file"),
      titulo: item.getAttribute("data-titulo") || "",
      lugar: item.getAttribute("data-lugar") || "",
      fecha: item.getAttribute("data-fecha") || "",
      relato: item.getAttribute("data-relato") || ""
    };
  }

  function fillText(container, text) {
    container.textContent = "";
    text.split(/\n\s*\n/).forEach(function (para) {
      if (!para.trim()) return;
      var p = document.createElement("p");
      para.split("\n").forEach(function (line, i) {
        if (i) p.appendChild(document.createElement("br"));
        p.appendChild(document.createTextNode(line));
      });
      container.appendChild(p);
    });
  }

  function render(index) {
    var item = items[index];
    var d = dataFor(item);
    var hasStory = !!d.relato;

    lightbox.classList.add("is-loading");
    var src = item.getAttribute("data-full");
    el.img.onload = function () { lightbox.classList.remove("is-loading"); };
    if (el.img.getAttribute("src") !== src) el.img.src = src;
    else lightbox.classList.remove("is-loading");
    el.img.alt = d.titulo;

    el.counter.textContent = (index + 1) + " / " + items.length;
    el.caption.textContent = d.titulo;

    var meta = [d.lugar, d.fecha].filter(Boolean).join(" · ");
    el.meta.textContent = meta;
    el.meta.hidden = !meta;
    el.title.textContent = d.titulo;
    fillText(el.text, d.relato);
    el.story.scrollTop = 0;

    lightbox.classList.toggle("has-story", hasStory);
    lightbox.classList.toggle("story-hidden", hasStory && storyHidden);
    el.toggle.hidden = !hasStory;
    el.toggle.textContent = storyHidden ? "Leer relato" : "Ocultar relato";
    el.toggle.setAttribute("aria-pressed", storyHidden ? "false" : "true");

    [index - 1, index + 1].forEach(function (i) {
      var it = items[(i + items.length) % items.length];
      var pre = new Image();
      pre.src = it.getAttribute("data-full");
    });
  }

  function show(index) {
    currentIndex = (index + items.length) % items.length;
    render(currentIndex);
    setHash(slug(items[currentIndex].getAttribute("data-file")));
  }

  function setHash(h) {
    if (!window.history || !history.replaceState) return;
    var url = location.pathname + location.search + (h ? "#" + h : "");
    history.replaceState(null, "", url);
  }

  function open(index) {
    lastFocused = document.activeElement;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    show(index);
    el.close.focus();
  }

  function close() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
    setHash("");
    if (lastFocused) lastFocused.focus();
  }

  // ---------- Eventos ----------

  items.forEach(function (item, index) {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      open(index);
    });
  });

  el.close.addEventListener("click", close);
  el.prev.addEventListener("click", function () { show(currentIndex - 1); });
  el.next.addEventListener("click", function () { show(currentIndex + 1); });

  el.toggle.addEventListener("click", function () {
    storyHidden = !storyHidden;
    savePref(storyHidden);
    render(currentIndex);
  });

  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox || e.target === el.stage || e.target.classList.contains("lb-photo")) close();
  });

  document.addEventListener("keydown", function (e) {
    if (lightbox.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(currentIndex - 1);
    if (e.key === "ArrowRight") show(currentIndex + 1);
  });

  var tx = null, ty = null;
  lightbox.addEventListener("touchstart", function (e) {
    tx = e.changedTouches[0].clientX;
    ty = e.changedTouches[0].clientY;
  }, { passive: true });
  lightbox.addEventListener("touchend", function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx;
    var dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      show(currentIndex + (dx < 0 ? 1 : -1));
    }
    tx = ty = null;
  }, { passive: true });

  // ---------- Miniaturas: aparición suave y proporción real ----------
  grid.classList.add("js-fade");
  items.forEach(function (item) {
    var im = item.querySelector("img");
    if (!im) return;
    function ready() {
      im.classList.add("is-loaded");
      if (im.naturalWidth && im.naturalHeight) {
        item.style.setProperty("--ar", (im.naturalWidth / im.naturalHeight).toFixed(3));
      }
    }
    if (im.complete && im.naturalWidth) ready();
    else im.addEventListener("load", ready);
    im.addEventListener("error", function () { im.classList.add("is-loaded"); });
  });

  // ---------- Arranque ----------

  if (location.hash.length > 1) {
    var wanted = decodeURIComponent(location.hash.slice(1));
    for (var i = 0; i < items.length; i++) {
      if (slug(items[i].getAttribute("data-file")) === wanted) { open(i); break; }
    }
  }
});
