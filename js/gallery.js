// ============================================================
// Visor de imágenes (lightbox) con relatos
// ------------------------------------------------------------
// - Funciona con cualquier galería que use el layout "gallery".
// - Los relatos se leen de una hoja de cálculo (CSV): una fila por foto.
//   Columnas: galeria, archivo, titulo, lugar, fecha, relato
//   Solo "archivo" es obligatoria; el resto puede quedar vacío.
// - No hace falta tocar este archivo al añadir fotos o relatos.
// ============================================================
document.addEventListener("DOMContentLoaded", function () {
  var grid = document.getElementById("gallery-grid");
  var lightbox = document.getElementById("lightbox");
  if (!grid || !lightbox) return;

  var items = Array.prototype.slice.call(grid.querySelectorAll(".gallery-item"));
  if (items.length === 0) return;

  var galleryName = norm(grid.getAttribute("data-gallery"));
  var relatosUrl = grid.getAttribute("data-relatos");

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

  var relatos = {};          // archivo normalizado -> { titulo, lugar, fecha, relato }
  var currentIndex = 0;
  var lastFocused = null;
  var storyHidden = readPref();

  // ---------- Utilidades ----------

  // Normaliza para comparar nombres: minúsculas, sin tildes, sin extensión, sin espacios sobrantes
  function norm(s) {
    return (s || "")
      .toString()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\.(jpe?g|png|webp|gif|tiff?)$/i, "")
      .replace(/[\s_-]+/g, " ")
      .trim();
  }

  // Título legible a partir del nombre de archivo (si no hay título en la hoja)
  function titleFromFile(file) {
    return (file || "")
      .replace(/\.[^.]+$/, "")
      .replace(/\bcopia\b/gi, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Identificador para el enlace directo (#el-molino)
  function slug(file) {
    return norm(file).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function readPref() {
    try { return localStorage.getItem("lb-story-hidden") === "1"; } catch (e) { return false; }
  }
  function savePref(v) {
    try { localStorage.setItem("lb-story-hidden", v ? "1" : "0"); } catch (e) {}
  }

  // Lector CSV (admite comillas, comas y saltos de línea dentro del relato)
  function parseCSV(text) {
    var rows = [], row = [], field = "", inQuotes = false, i, c;
    text = text.replace(/^\uFEFF/, "");
    // Excel en español guarda los CSV con ";" en lugar de ","
    var firstLine = text.split("\n")[0];
    var sep = firstLine.indexOf(";") > -1 && firstLine.indexOf(",") === -1 ? ";" : ",";
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else { inQuotes = false; }
        } else { field += c; }
      } else if (c === '"') { inQuotes = true; }
      else if (c === sep) { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* ignorar */ }
      else { field += c; }
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function loadRelatos() {
    if (!relatosUrl || !window.fetch) return;
    fetch(relatosUrl, { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.text() : ""; })
      .then(function (text) {
        if (!text) return;
        var rows = parseCSV(text);
        if (rows.length < 2) return;
        var head = rows[0].map(norm);
        var col = function (name) { return head.indexOf(name); };
        var cG = col("galeria"), cA = col("archivo"), cT = col("titulo"),
            cL = col("lugar"), cF = col("fecha"), cR = col("relato");
        if (cA < 0) return;

        rows.slice(1).forEach(function (r) {
          var file = norm(r[cA]);
          if (!file) return;
          if (cG >= 0 && r[cG] && norm(r[cG]) !== galleryName) return; // es de otra galería
          relatos[file] = {
            titulo: cT >= 0 ? (r[cT] || "").trim() : "",
            lugar: cL >= 0 ? (r[cL] || "").trim() : "",
            fecha: cF >= 0 ? (r[cF] || "").trim() : "",
            relato: cR >= 0 ? (r[cR] || "").trim() : ""
          };
        });

        // Marca en la cuadrícula las fotos que tienen relato
        items.forEach(function (item) {
          var d = relatos[norm(item.getAttribute("data-file"))];
          if (d && d.relato) item.classList.add("has-story");
          if (d && d.titulo) {
            var im = item.querySelector("img");
            if (im) im.alt = d.titulo;
          }
        });

        if (!lightbox.hidden) render(currentIndex);
      })
      .catch(function () { /* sin relatos: el visor funciona igual */ });
  }

  // ---------- Pintado del visor ----------

  function dataFor(item) {
    var file = item.getAttribute("data-file");
    var d = relatos[norm(file)] || {};
    return {
      file: file,
      titulo: d.titulo || titleFromFile(file),
      lugar: d.lugar || "",
      fecha: d.fecha || "",
      relato: d.relato || ""
    };
  }

  function fillText(container, text) {
    container.textContent = "";
    text.split(/\n\s*\n/).forEach(function (para) {
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

    // Imagen con fundido suave
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

    // Precarga de la anterior y la siguiente
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

  // Cerrar al hacer clic en el fondo oscuro
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox || e.target === el.stage || e.target.classList.contains("lb-photo")) close();
  });

  // Teclado
  document.addEventListener("keydown", function (e) {
    if (lightbox.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(currentIndex - 1);
    if (e.key === "ArrowRight") show(currentIndex + 1);
  });

  // Deslizar con el dedo (solo gestos claramente horizontales, para no molestar al leer)
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

  // ---------- Arranque ----------

  loadRelatos();

  // Enlace directo a una foto: /nocturna/#el-molino
  if (location.hash.length > 1) {
    var wanted = decodeURIComponent(location.hash.slice(1));
    for (var i = 0; i < items.length; i++) {
      if (slug(items[i].getAttribute("data-file")) === wanted) { open(i); break; }
    }
  }
});
