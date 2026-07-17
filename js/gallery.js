// Visor de imágenes (lightbox) para las galerías
// Funciona con cualquier galería que use el layout "gallery":
// no hace falta tocar este archivo al añadir fotos nuevas.
document.addEventListener("DOMContentLoaded", function () {
  var grid = document.getElementById("gallery-grid");
  var lightbox = document.getElementById("lightbox");
  if (!grid || !lightbox) return;

  var items = Array.prototype.slice.call(grid.querySelectorAll(".gallery-item"));
  if (items.length === 0) return;

  var img = lightbox.querySelector(".lightbox-img");
  var counter = lightbox.querySelector(".lightbox-counter");
  var closeBtn = lightbox.querySelector(".lightbox-close");
  var prevBtn = lightbox.querySelector(".lightbox-prev");
  var nextBtn = lightbox.querySelector(".lightbox-next");

  var currentIndex = 0;
  var lastFocused = null;

  function show(index) {
    currentIndex = (index + items.length) % items.length;
    var item = items[currentIndex];
    img.src = item.getAttribute("data-full");
    img.alt = item.getAttribute("data-caption") || "";
    counter.textContent = (currentIndex + 1) + " / " + items.length;
  }

  function open(index) {
    lastFocused = document.activeElement;
    show(index);
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  items.forEach(function (item, index) {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      open(index);
    });
  });

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", function () { show(currentIndex - 1); });
  nextBtn.addEventListener("click", function () { show(currentIndex + 1); });

  // Cerrar al hacer clic fuera de la imagen
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) close();
  });

  // Navegación con teclado
  document.addEventListener("keydown", function (e) {
    if (lightbox.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(currentIndex - 1);
    if (e.key === "ArrowRight") show(currentIndex + 1);
  });

  // Deslizar con el dedo en móvil
  var touchStartX = null;
  lightbox.addEventListener("touchstart", function (e) {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener("touchend", function (e) {
    if (touchStartX === null) return;
    var delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 40) {
      show(currentIndex + (delta < 0 ? 1 : -1));
    }
    touchStartX = null;
  }, { passive: true });
});
