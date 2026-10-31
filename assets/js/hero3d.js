import {
  Scene, PerspectiveCamera, WebGLRenderer, Group, IcosahedronGeometry,
  EdgesGeometry, LineSegments, LineBasicMaterial, Points, PointsMaterial,
  BufferGeometry, Float32BufferAttribute, Mesh, MeshBasicMaterial,
  AdditiveBlending, BackSide
} from "../vendor/three/three.module.min.js";

export function initHero3D(stage, fb, lvl) {
  if (!stage || lvl === "off") return null;
  var win = window, doc = document, M = Math, isRich = lvl !== "subtle";
  var tc = doc.createElement("canvas"), gl = null;
  try { gl = tc.getContext("webgl2") || tc.getContext("webgl") || tc.getContext("experimental-webgl"); } catch (e) {}
  var rmq = win.matchMedia ? win.matchMedia("(prefers-reduced-motion: reduce)") : null;
  if (!gl || (rmq && rmq.matches)) return null;

  var w = stage.clientWidth || 320, h = stage.clientHeight || 320, ren = null;
  try { ren = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" }); } catch (e) { return null; }
  ren.setPixelRatio(M.min(win.devicePixelRatio || 1, 2));
  ren.setSize(w, h, false);

  var cv = ren.domElement;
  cv.className = "hero-3d-canvas";
  cv.setAttribute("aria-hidden", "true");
  stage.appendChild(cv);

  var scene = new Scene(), cam = new PerspectiveCamera(42, w / h, 0.1, 20);
  cam.position.z = 4.6;
  var root = new Group(), outer = new Group(), inner = new Group();
  root.add(outer, inner);
  scene.add(root);

  var oGeo = new IcosahedronGeometry(1.38, 1), oEdg = new EdgesGeometry(oGeo);
  var oLM = new LineBasicMaterial({ color: 0x3d4dff, transparent: true, opacity: 0 });
  var oPM = new PointsMaterial({ color: 0x6a74ff, size: 0.068, sizeAttenuation: true, transparent: true, opacity: 0 });
  outer.add(new LineSegments(oEdg, oLM), new Points(oGeo, oPM));

  var iGeo = new IcosahedronGeometry(0.74, 0), iEdg = new EdgesGeometry(iGeo);
  var iLM = new LineBasicMaterial({ color: 0x7c5cff, transparent: true, opacity: 0 });
  var iPM = new PointsMaterial({ color: 0xe6e8f0, size: 0.052, sizeAttenuation: true, transparent: true, opacity: 0 });
  inner.add(new LineSegments(iEdg, iLM), new Points(iGeo, iPM));

  var gGeo = null, gMat = null, pGeo = null, pMat = null, pPts = null;
  if (isRich) {
    gGeo = new IcosahedronGeometry(1.56, 2);
    gMat = new MeshBasicMaterial({ color: 0x3d4dff, transparent: true, opacity: 0, blending: AdditiveBlending, side: BackSide, depthWrite: false });
    outer.add(new Mesh(gGeo, gMat));

    var n = win.innerWidth < 768 ? 120 : 300, pos = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var th = M.random() * 6.283, ph = M.acos(2 * M.random() - 1), r = 1.55 + M.random() * 0.95;
      pos[i * 3] = r * M.sin(ph) * M.cos(th);
      pos[i * 3 + 1] = r * M.sin(ph) * M.sin(th);
      pos[i * 3 + 2] = r * M.cos(ph);
    }
    pGeo = new BufferGeometry();
    pGeo.setAttribute("position", new Float32BufferAttribute(pos, 3));
    pMat = new PointsMaterial({ color: 0x6a74ff, size: 0.032, sizeAttenuation: true, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false });
    pPts = new Points(pGeo, pMat);
    root.add(pPts);
  }

  outer.rotation.set(0.35, 0.5, 0);
  inner.rotation.set(-0.25, -0.4, 0);
  root.scale.setScalar(0.85);

  var raf = null, inV = true, vis = !doc.hidden, dead = false, tLast = 0, t0 = performance.now();
  var tx = 0, ty = 0, cx = 0, cy = 0, tPrx = 0, cPrx = 0, sPrg = 0;
  var hov = win.matchMedia && win.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function onMove(e) {
    var r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var dx = (e.clientX - (r.left + r.width * 0.5)) / (r.width * 0.5), dy = (e.clientY - (r.top + r.height * 0.5)) / (r.height * 0.5);
    ty = M.max(-0.35, M.min(0.35, dx * 0.28)); tx = M.max(-0.35, M.min(0.35, dy * 0.28));
    tPrx = isRich ? M.max(0, M.min(1, 1.35 - M.sqrt(dx * dx + dy * dy) * 0.75)) : 0;
  }
  function onLeave() { tx = 0; ty = 0; tPrx = 0; }
  function onScr() { sPrg = M.max(0, M.min(1, win.scrollY / ((stage.clientHeight || 340) * 1.65))); }

  if (hov) { win.addEventListener("pointermove", onMove, { passive: true }); win.addEventListener("pointerleave", onLeave, { passive: true }); }
  if (isRich) { win.addEventListener("scroll", onScr, { passive: true }); onScr(); }

  ren.render(scene, cam);
  requestAnimationFrame(function () { cv.classList.add("is-ready"); if (fb) fb.classList.add("is-hidden"); });

  function tick(now) {
    if (dead || !inV || !vis) { raf = null; return; }
    raf = requestAnimationFrame(tick);
    var dt = now - tLast;
    if (dt < (win.innerWidth < 768 ? 33.3 : 14)) return;
    var st = M.min(dt / 16.67, 2.5); tLast = now;

    var ease = 1 - M.pow(1 - M.min(1, M.max(0, (now - t0) / 900)), 3);
    var a = ease * (isRich ? M.max(0.15, 1 - sPrg * 0.78) : 1);
    root.scale.setScalar(0.85 + 0.15 * ease); root.position.y = isRich ? sPrg * 0.36 : 0;

    cPrx += (tPrx - cPrx) * 0.08;
    oLM.opacity = (0.76 + cPrx * 0.16) * a; oPM.opacity = (0.85 + cPrx * 0.15) * a; oPM.size = 0.068 + cPrx * 0.024;
    iLM.opacity = 0.72 * a; iPM.opacity = (0.82 + cPrx * 0.18) * a;
    if (gMat) gMat.opacity = (0.065 + cPrx * 0.035) * a;
    if (pMat) pMat.opacity = 0.42 * a;

    outer.rotation.y += 0.0028 * st; outer.rotation.x += 0.0012 * st;
    inner.rotation.y -= 0.0042 * st; inner.rotation.z -= 0.002 * st;
    if (pPts) { pPts.rotation.y += 0.0009 * st; pPts.rotation.x -= 0.0004 * st; }
    if (hov) { cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06; }
    var sr = isRich ? sPrg * 0.55 : 0;
    root.rotation.x = cx + sr * 0.4; root.rotation.y = cy + sr;
    ren.render(scene, cam);
  }

  function sync() {
    if (dead) return;
    if (inV && vis) { if (!raf) { tLast = performance.now(); raf = requestAnimationFrame(tick); } }
    else if (raf) { cancelAnimationFrame(raf); raf = null; }
  }

  var vObs = "IntersectionObserver" in win ? new IntersectionObserver(function (e) { for (var j = 0; j < e.length; j++) inV = e[j].isIntersecting; sync(); }, { threshold: 0.05 }) : null;
  if (vObs) vObs.observe(stage);

  function onVis() { vis = !doc.hidden; sync(); }
  doc.addEventListener("visibilitychange", onVis);

  var rT = null, rObs = "ResizeObserver" in win ? new ResizeObserver(function () {
    if (rT) clearTimeout(rT);
    rT = setTimeout(function () {
      if (dead || !ren) return;
      var nw = stage.clientWidth || 320, nh = stage.clientHeight || 320;
      cam.aspect = nw / nh; cam.updateProjectionMatrix();
      ren.setPixelRatio(M.min(win.devicePixelRatio || 1, 2));
      ren.setSize(nw, nh, false); ren.render(scene, cam);
    }, 120);
  }) : null;
  if (rObs) rObs.observe(stage);

  function dispose() {
    if (dead) return;
    dead = true;
    if (raf) cancelAnimationFrame(raf);
    if (rT) clearTimeout(rT);
    if (vObs) vObs.disconnect();
    if (rObs) rObs.disconnect();
    doc.removeEventListener("visibilitychange", onVis);
    win.removeEventListener("scroll", onScr);
    if (hov) { win.removeEventListener("pointermove", onMove); win.removeEventListener("pointerleave", onLeave); }
    var res = [oGeo, oEdg, oLM, oPM, iGeo, iEdg, iLM, iPM, gGeo, gMat, pGeo, pMat, ren];
    for (var k = 0; k < res.length; k++) if (res[k]) res[k].dispose();
    if (cv && cv.parentNode) cv.parentNode.removeChild(cv);
    if (fb) fb.classList.remove("is-hidden");
  }

  cv.addEventListener("webglcontextlost", function (ev) { ev.preventDefault(); dispose(); }, false);
  if (rmq && rmq.addEventListener) rmq.addEventListener("change", function (e) { if (e.matches) dispose(); });
  sync();
  return dispose;
}
