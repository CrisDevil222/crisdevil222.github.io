(function () {
  "use strict";
  var win = window, doc = document, M = Math, G = "01ABCDEF#<>/_", cfg = "rich", pref = null, lvl = "rich";
  var rafs = [], pRaf = null, sRaf = null, cObs = null, dObs = null, nObs = null, onChg = null;
  var CARDS = ".project-card, .writeup-card, .speciality-card, .timeline-item", HEADS = "#hero-name, h2.section-title";
  var rmq = win.matchMedia ? win.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var hov = win.matchMedia && win.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var cssScr = typeof CSS !== "undefined" && CSS.supports && CSS.supports("animation-timeline: scroll()");

  try { var s = localStorage.getItem("phs_effects"); if (s === "off" || s === "on") pref = s; } catch (e) {}

  function isRed() { return Boolean(rmq && rmq.matches); }
  function getLvl() {
    if (isRed() || pref === "off") return "off";
    return pref === "on" ? (cfg === "off" ? "rich" : cfg) : (cfg || "rich");
  }
  function stopRafs() {
    while (rafs.length) cancelAnimationFrame(rafs.pop());
    if (pRaf) { cancelAnimationFrame(pRaf); pRaf = null; }
    if (sRaf) { cancelAnimationFrame(sRaf); sRaf = null; }
  }

  function syncBar() {
    sRaf = null;
    var bar = doc.getElementById("scroll-progress"), d = doc.documentElement, m = d.scrollHeight - d.clientHeight;
    if (bar && lvl !== "off") bar.style.transform = "scaleX(" + (m > 0 ? M.min(1, M.max(0, win.scrollY / m)) : 0).toFixed(4) + ")";
  }
  function onScr() { if (lvl !== "off" && !cssScr && !sRaf) sRaf = requestAnimationFrame(syncBar); }

  var lx = -9999, ly = -9999;
  function syncSpot() {
    pRaf = null;
    if (lvl !== "rich" || !hov) return;
    var hero = doc.getElementById("home");
    if (hero) {
      var hr = hero.getBoundingClientRect();
      if (hr.bottom > 0 && hr.top < win.innerHeight) {
        hero.style.setProperty("--mx", M.round(lx - hr.left) + "px");
        hero.style.setProperty("--my", M.round(ly - hr.top) + "px");
      }
    }
    var list = doc.querySelectorAll(CARDS);
    for (var i = 0; i < list.length; i++) {
      var r = list[i].getBoundingClientRect();
      if (lx >= r.left - 140 && lx <= r.right + 140 && ly >= r.top - 140 && ly <= r.bottom + 140) {
        list[i].style.setProperty("--mx", M.round(lx - r.left) + "px");
        list[i].style.setProperty("--my", M.round(ly - r.top) + "px");
      }
    }
  }
  function onMove(e) {
    if (lvl !== "rich" || !hov) return;
    lx = e.clientX; ly = e.clientY;
    if (!pRaf) pRaf = requestAnimationFrame(syncSpot);
  }

  function getNodes(n, out) {
    for (var c = n.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3 && c.nodeValue && c.nodeValue.trim() !== "") out.push({ n: c, t: c.nodeValue });
      else if (c.nodeType === 1) getNodes(c, out);
    }
  }

  function decode(el) {
    if (lvl !== "rich" || el.getAttribute("data-decoded") === "1") return;
    el.setAttribute("data-decoded", "1");
    var full = (el.textContent || "").trim();
    if (!full) return;
    if (!el.getAttribute("aria-label")) el.setAttribute("aria-label", full);
    var parts = [], tot = 0, t0 = performance.now();
    getNodes(el, parts);
    for (var i = 0; i < parts.length; i++) tot += parts[i].t.length;
    if (!tot) return;

    function step(now) {
      if (lvl !== "rich") { for (var r = 0; r < parts.length; r++) parts[r].n.nodeValue = parts[r].t; return; }
      var p = M.min(1, (now - t0) / 600), keep = M.floor(p * tot), idx = 0;
      for (var j = 0; j < parts.length; j++) {
        var src = parts[j].t, out = "";
        for (var k = 0; k < src.length; k++) {
          var ch = src.charAt(k);
          out += ch === " " || ch === "\n" || idx < keep ? ch : G.charAt((idx + M.floor(now / 35)) % G.length);
          idx++;
        }
        parts[j].n.nodeValue = p >= 1 ? src : out;
      }
      if (p < 1) rafs.push(requestAnimationFrame(step));
    }
    rafs.push(requestAnimationFrame(step));
  }

  function obsCards() {
    var list = doc.querySelectorAll(CARDS);
    if (lvl === "off" || !("IntersectionObserver" in win)) {
      for (var i = 0; i < list.length; i++) { list[i].classList.remove("stagger-init"); list[i].classList.add("is-staggered"); }
      return;
    }
    if (!cObs) cObs = new IntersectionObserver(function (e, o) {
      var b = 0;
      for (var j = 0; j < e.length; j++) if (e[j].isIntersecting) {
        var el = e[j].target; el.style.transitionDelay = M.min(b++, 5) * 60 + "ms"; el.classList.add("is-staggered"); o.unobserve(el);
      }
    }, { threshold: 0.08 });
    for (var k = 0; k < list.length; k++) if (!list[k].classList.contains("is-staggered")) { list[k].classList.add("stagger-init"); cObs.observe(list[k]); }
  }

  function countUp(el) {
    var end = parseInt(el.getAttribute("data-count"), 10), pre = el.getAttribute("data-count-prefix") || "", suf = el.getAttribute("data-count-suffix") || "";
    if (isNaN(end)) return;
    if (lvl !== "rich" || el.getAttribute("data-counted") === "1") { el.textContent = pre + end + suf; return; }
    el.setAttribute("data-counted", "1");
    var t0 = performance.now();
    function tick(now) {
      if (lvl !== "rich") { el.textContent = pre + end + suf; return; }
      var t = M.min(1, (now - t0) / 650);
      el.textContent = pre + M.round(end * (1 - M.pow(1 - t, 3))) + suf;
      if (t < 1) rafs.push(requestAnimationFrame(tick));
    }
    rafs.push(requestAnimationFrame(tick));
  }

  function obsText() {
    var heads = doc.querySelectorAll(HEADS), nums = doc.querySelectorAll("[data-count]");
    if (lvl !== "rich" || !("IntersectionObserver" in win)) {
      for (var c = 0; c < nums.length; c++) {
        var v = nums[c].getAttribute("data-count");
        if (v !== null) nums[c].textContent = (nums[c].getAttribute("data-count-prefix") || "") + v + (nums[c].getAttribute("data-count-suffix") || "");
      }
      return;
    }
    if (!dObs) dObs = new IntersectionObserver(function (e, o) { for (var i = 0; i < e.length; i++) if (e[i].isIntersecting) { decode(e[i].target); o.unobserve(e[i].target); } }, { threshold: 0.2 });
    for (var h = 0; h < heads.length; h++) if (heads[h].getAttribute("data-decoded") !== "1") dObs.observe(heads[h]);
    if (!nObs) nObs = new IntersectionObserver(function (e, o) { for (var j = 0; j < e.length; j++) if (e[j].isIntersecting) { countUp(e[j].target); o.unobserve(e[j].target); } }, { threshold: 0.2 });
    for (var m = 0; m < nums.length; m++) if (nums[m].getAttribute("data-counted") !== "1") nObs.observe(nums[m]);
  }

  function apply() {
    lvl = getLvl();
    doc.documentElement.setAttribute("data-effects", lvl);
    var btn = doc.getElementById("effects-toggle");
    if (btn) { btn.hidden = isRed(); btn.setAttribute("aria-pressed", String(lvl !== "off")); }
    if (lvl === "off") stopRafs(); else if (!cssScr) syncBar();
    obsCards(); obsText();
    if (typeof onChg === "function") onChg(lvl);
  }

  if (hov) win.addEventListener("pointermove", onMove, { passive: true });
  if (!cssScr) win.addEventListener("scroll", onScr, { passive: true });
  if (rmq && rmq.addEventListener) rmq.addEventListener("change", apply);

  win.PHS_EFFECTS = {
    getLevel: function () { return lvl; },
    configure: function (c, cb) { if (c && c.level) cfg = c.level; if (typeof cb === "function") onChg = cb; apply(); },
    refresh: function (rst) {
      if (rst) { var h = doc.querySelectorAll(HEADS); for (var i = 0; i < h.length; i++) h[i].removeAttribute("aria-label"); }
      obsCards(); obsText();
    },
    toggle: function () {
      if (isRed()) return lvl;
      pref = lvl === "off" ? "on" : "off";
      try { localStorage.setItem("phs_effects", pref); } catch (e) {}
      apply(); return lvl;
    }
  };
  apply();
})();
