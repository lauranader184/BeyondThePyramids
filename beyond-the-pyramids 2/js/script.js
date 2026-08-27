/* ================================================================
   BEYOND THE PYRAMIDS — SCRIPT
   You do not need to edit this file to update text, photos, or
   videos. It only controls animations and interactions.
   ================================================================ */
document.addEventListener("DOMContentLoaded", function () {

  /* ---------------- LOADER ---------------- */
  var loader = document.getElementById("loader");
  window.addEventListener("load", function () {
    setTimeout(function () {
      if (loader) loader.classList.add("is-hidden");
    }, 700);
  });
  // Fallback in case 'load' already fired
  setTimeout(function () { if (loader) loader.classList.add("is-hidden"); }, 2500);

  /* ---------------- HEADER SCROLL STATE ---------------- */
  var header = document.getElementById("siteHeader");
  function updateHeader() {
    if (window.scrollY > 60) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  }
  updateHeader();
  window.addEventListener("scroll", updateHeader);

  /* ---------------- MOBILE NAV TOGGLE ---------------- */
  var navToggle = document.getElementById("navToggle");
  var mainNav = document.getElementById("mainNav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      mainNav.classList.toggle("is-open");
    });
    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { mainNav.classList.remove("is-open"); });
    });
  }

  /* ---------------- EXCAVATION GAUGE ---------------- */
  var digFill = document.getElementById("digGaugeFill");
  var investigation = document.getElementById("investigation");
  var about = document.getElementById("about");
  function updateGauge() {
    if (!digFill || !investigation || !about) return;
    var start = investigation.offsetTop;
    var end = about.offsetTop + about.offsetHeight;
    var progress = (window.scrollY - start) / (end - start);
    progress = Math.max(0, Math.min(1, progress));
    digFill.style.height = (progress * 100) + "%";
  }
  window.addEventListener("scroll", updateGauge);
  updateGauge();

  /* ---------------- SCROLL REVEAL ---------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------------- BEFORE / AFTER SLIDERS ---------------- */
  document.querySelectorAll(".ba-slider").forEach(function (slider) {
    var range = slider.querySelector(".ba-slider-range");
    var after = slider.querySelector(".ba-slider-after");
    var handle = slider.querySelector(".ba-slider-handle");
    if (!range) return;
    function update() {
      var v = range.value;
      after.style.clipPath = "inset(0 0 0 " + v + "%)";
      handle.style.left = v + "%";
    }
    range.addEventListener("input", update);
    update();
  });

  /* ---------------- ANIMATED STATISTICS ---------------- */
  var statNumbers = document.querySelectorAll(".stat-number");
  function animateStat(el) {
    var target = parseFloat(el.getAttribute("data-target")) || 0;
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = 1600;
    var start = null;
    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(eased * target);
      el.textContent = prefix + current + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window && statNumbers.length) {
    var statIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateStat(entry.target);
          statIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    statNumbers.forEach(function (el) { statIO.observe(el); });
  }

  /* ---------------- EXPANDABLE CARDS (trade-offs, policy, interviews) ---------------- */
  document.querySelectorAll("[data-expand]").forEach(function (card) {
    card.addEventListener("click", function (e) {
      // Interview toggle button lives inside an .interview-card
      var target = card.classList.contains("interview-toggle") ? card.closest(".interview-card") : card;
      target.classList.toggle("is-open");
      if (card.classList.contains("interview-toggle")) {
        card.textContent = target.classList.contains("is-open") ? "Hide Interview" : "Watch Interview";
      }
    });
  });

});
