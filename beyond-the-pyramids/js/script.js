/* ================================================================
   BEYOND THE PYRAMIDS — SCRIPT
   You do not need to edit this file to update text, photos, or
   videos. It only controls animations and interactions.
   ================================================================ */
document.addEventListener("DOMContentLoaded", function () {

  /* ---------------- LOADER ---------------- */
  var loader = document.getElementById("loader");
  var hero = document.getElementById("home");
  var heroRevealed = false;
  function revealHero() {
    if (heroRevealed || !hero) return;
    heroRevealed = true;
    hero.classList.add("is-ready");
  }
  function hideLoader() {
    if (loader) loader.classList.add("is-hidden");
    revealHero();
  }
  window.addEventListener("load", function () {
    setTimeout(hideLoader, 700);
  });
  // Fallback in case 'load' already fired
  setTimeout(hideLoader, 2500);

  /* ---------------- HEADER SCROLL STATE ---------------- */
  var header = document.getElementById("siteHeader");
  function updateHeader() {
    if (window.scrollY > 60) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  }
  updateHeader();
  window.addEventListener("scroll", updateHeader);

  /* ---------------- HERO GEOMETRY PARALLAX (desktop only) ---------------- */
  var heroSection = document.getElementById("home");
  var heroPlanes = heroSection ? heroSection.querySelectorAll(".hero-geo-plane") : [];
  var canParallax =
    heroPlanes.length &&
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (canParallax) {
    heroSection.addEventListener("mousemove", function (e) {
      var rect = heroSection.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      heroPlanes.forEach(function (plane) {
        var depth = parseFloat(plane.getAttribute("data-parallax")) || 6;
        plane.style.transform =
          "translate(" + (x * depth).toFixed(1) + "px, " + (y * (depth * 0.75)).toFixed(1) + "px)";
      });
    });
    heroSection.addEventListener("mouseleave", function () {
      heroPlanes.forEach(function (plane) {
        plane.style.transform = "translate(0, 0)";
      });
    });
  }

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

  /* ---------------- POLICY BRIEF — reasoning opens beneath the card's row ---------------- */
  var policyGrid = document.querySelector("#policy .policy-grid");
  var policyPanel = document.getElementById("policyDetail");
  if (policyGrid && policyPanel) {
    var policyCards = Array.prototype.slice.call(policyGrid.querySelectorAll(".policy-card"));
    var policyText = policyPanel.querySelector(".policy-detail-text");
    var openPolicyCard = null;

    function policyColumnCount() {
      var cols = window.getComputedStyle(policyGrid).gridTemplateColumns;
      if (!cols || cols === "none") return 1;
      return cols.split(" ").filter(function (c) { return c; }).length;
    }

    function placePolicyPanel(index) {
      var cols = policyColumnCount();
      var lastInRow = Math.min(
        Math.floor(index / cols) * cols + cols - 1,
        policyCards.length - 1
      );
      var anchor = policyCards[lastInRow];
      if (anchor.nextElementSibling !== policyPanel) {
        anchor.parentNode.insertBefore(policyPanel, anchor.nextElementSibling);
      }
    }

    var policyHideTimer = null;

    function closePolicyPanel() {
      if (!openPolicyCard) return;
      openPolicyCard.classList.remove("is-open");
      openPolicyCard.setAttribute("aria-expanded", "false");
      openPolicyCard = null;
      policyPanel.classList.remove("is-open");
      policyPanel.style.maxHeight = "0px";
      // take the collapsed panel out of the grid so it leaves no gap
      policyHideTimer = setTimeout(function () {
        if (!openPolicyCard) policyPanel.hidden = true;
      }, 470);
    }

    policyCards.forEach(function (card, index) {
      card.addEventListener("click", function () {
        if (card === openPolicyCard) {
          closePolicyPanel();
          return;
        }
        closePolicyPanel();
        clearTimeout(policyHideTimer);
        placePolicyPanel(index);

        var reasoning = card.querySelector(".policy-reasoning");
        policyText.textContent = reasoning ? reasoning.textContent.trim() : "";

        card.classList.add("is-open");
        card.setAttribute("aria-expanded", "true");
        openPolicyCard = card;

        policyPanel.hidden = false;
        void policyPanel.offsetHeight; // reflow so the height transition runs
        policyPanel.style.maxHeight = policyPanel.scrollHeight + "px";
        policyPanel.classList.add("is-open");
      });
    });

    window.addEventListener("resize", function () {
      if (!openPolicyCard) return;
      placePolicyPanel(policyCards.indexOf(openPolicyCard));
      policyPanel.style.maxHeight = policyPanel.scrollHeight + "px";
    });
  }

  /* ---------------- VOICES — expandable written perspectives ---------------- */
  document.querySelectorAll("#voices [data-voice]").forEach(function (button) {
    var block = button.closest(".voice-block");
    var panel = block ? block.querySelector(".voice-more") : null;
    var inner = panel ? panel.querySelector(".voice-more-inner") : null;
    if (!block || !panel || !inner) return;

    button.addEventListener("click", function () {
      var opening = !block.classList.contains("is-open");

      document.querySelectorAll("#voices .voice-block.is-open").forEach(function (open) {
        open.classList.remove("is-open");
        var openPanel = open.querySelector(".voice-more");
        var openButton = open.querySelector("[data-voice]");
        if (openPanel) openPanel.style.maxHeight = "0px";
        if (openButton) openButton.setAttribute("aria-expanded", "false");
      });

      if (opening) {
        block.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
        panel.style.maxHeight = inner.offsetHeight + "px";
      }
    });

    window.addEventListener("resize", function () {
      if (block.classList.contains("is-open")) panel.style.maxHeight = inner.offsetHeight + "px";
    });
  });

  /* ---------------- EXPANDABLE CARDS (trade-offs) ---------------- */
  document.querySelectorAll("[data-expand]").forEach(function (card) {
    card.addEventListener("click", function () {
      var target = card;

      // Trade-offs: accordion — only one open at a time
      if (target && target.closest("#trade-offs") && target.classList.contains("tradeoff-card")) {
        var opening = !target.classList.contains("is-open");
        document.querySelectorAll("#trade-offs .tradeoff-card.is-open").forEach(function (openCard) {
          openCard.classList.remove("is-open");
          openCard.setAttribute("aria-expanded", "false");
        });
        if (opening) {
          target.classList.add("is-open");
          target.setAttribute("aria-expanded", "true");
        }
        return;
      }

      target.classList.toggle("is-open");
    });
  });

});
