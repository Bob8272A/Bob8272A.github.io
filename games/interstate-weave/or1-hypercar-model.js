// OR-1 hypercar: an original mid-engine hypercar model for Interstate Weave.
// Pure geometry, no textures. Built to the game's conventions:
//   - units are metres, y is up, the car faces -z, it sits on y = 0
//   - geometry is grouped by the game's material keys (paint, glass, trim, chrome, head, tail, plate, sigL, sigR, accent, led)
//   - each group is a non-indexed BufferGeometry with position + normal, like the game's merge() output
// buildHypercar(THREE) -> { spec, parts, head, tail }   buildHypercarWheel(THREE, spec) -> { rubber, rim, chrome, caliper, trim }
(function (root) {
  'use strict';

  // ---------- small maths helpers ----------
  // Smooth curve through [s, value] keys (s descending or ascending), Catmull-Rom with non-uniform spacing.
  function curve(keys) {
    const K = keys.slice().sort((a, b) => a[0] - b[0]);
    return (s) => {
      if (s <= K[0][0]) return K[0][1];
      if (s >= K[K.length - 1][0]) return K[K.length - 1][1];
      let i = 0; while (s > K[i + 1][0]) i++;
      const p0 = K[Math.max(0, i - 1)], p1 = K[i], p2 = K[i + 1], p3 = K[Math.min(K.length - 1, i + 2)];
      const h = p2[0] - p1[0], t = (s - p1[0]) / h;
      const m1 = i > 0 ? (p2[1] - p0[1]) / (p2[0] - p0[0]) : (p2[1] - p1[1]) / h;
      const m2 = i + 2 < K.length ? (p3[1] - p1[1]) / (p3[0] - p1[0]) : (p2[1] - p1[1]) / h;
      const t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * h * m1 + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * h * m2;
    };
  }
  // Catmull-Rom through 2D control points, param u in 0..1 over the whole polyline; ends mirrored across x = 0.
  function splinePt(C, u) {
    const n = C.length - 1, f = Math.min(n - 1e-9, Math.max(0, u * n)), i = Math.floor(f), t = f - i;
    const g = (k) => (k < 0 ? [-C[1][0], C[1][1]] : k > n ? [-C[n - 1][0], C[n - 1][1]] : C[k]);
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2), t2 = t * t, t3 = t2 * t, out = [0, 0];
    for (let a = 0; a < 2; a++) out[a] = 0.5 * (2 * p1[a] + (-p0[a] + p2[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3);
    return out;
  }

  // ---------- triangle soup helpers (coordinates are x, y, s with s = forward) ----------
  const tri = (T, a, b, c) => { T.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); };
  const quad = (T, a, b, c, d) => { tri(T, a, b, c); tri(T, a, c, d); };
  // Flip triangles so their normals point away from centre(x, y, s).
  function orient(T, centre) {
    for (let i = 0; i < T.length; i += 9) {
      const ux = T[i + 3] - T[i], uy = T[i + 4] - T[i + 1], uz = T[i + 5] - T[i + 2], vx = T[i + 6] - T[i], vy = T[i + 7] - T[i + 1], vz = T[i + 8] - T[i + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const cx = (T[i] + T[i + 3] + T[i + 6]) / 3, cy = (T[i + 1] + T[i + 4] + T[i + 7]) / 3, cz = (T[i + 2] + T[i + 5] + T[i + 8]) / 3, o = centre(cx, cy, cz);
      if (nx * (cx - o[0]) + ny * (cy - o[1]) + nz * (cz - o[2]) < 0) for (let k = 0; k < 3; k++) { const t = T[i + 3 + k]; T[i + 3 + k] = T[i + 6 + k]; T[i + 6 + k] = t; }
    }
    return T;
  }
  const mirrorX = (T) => { const M = new Array(T.length); for (let i = 0; i < T.length; i += 9) { for (let k = 0; k < 3; k++) { const a = i + k * 3, b = i + (2 - k) * 3; M[b] = -T[a]; M[b + 1] = T[a + 1]; M[b + 2] = T[a + 2]; } } return M; };
  const both = (T) => T.concat(mirrorX(T));
  const doubleSided = (T) => { const D = T.slice(); for (let i = 0; i < T.length; i += 9) D.push(T[i], T[i + 1], T[i + 2], T[i + 6], T[i + 7], T[i + 8], T[i + 3], T[i + 4], T[i + 5]); return D; };
  // Remove the part of each triangle where f(x, y, s) < 0. Returns kept triangles and the cut edges.
  function clip(T, f) {
    const keep = [], edges = [];
    for (let i = 0; i < T.length; i += 9) {
      const P = [[T[i], T[i + 1], T[i + 2]], [T[i + 3], T[i + 4], T[i + 5]], [T[i + 6], T[i + 7], T[i + 8]]], F = P.map((p) => f(p[0], p[1], p[2]));
      const inside = F.filter((v) => v < 0).length;
      if (!inside) { keep.push(...P[0], ...P[1], ...P[2]); continue; }
      if (inside === 3) continue;
      const poly = [], cut = [];
      for (let k = 0; k < 3; k++) {
        const a = P[k], b = P[(k + 1) % 3], fa = F[k], fb = F[(k + 1) % 3];
        if (fa >= 0) poly.push(a);
        if ((fa < 0) !== (fb < 0)) { const t = fa / (fa - fb), m = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; poly.push(m); cut.push(m); }
      }
      for (let k = 1; k + 1 < poly.length; k++) tri(keep, poly[0], poly[k], poly[k + 1]);
      if (cut.length === 2) edges.push(cut);
    }
    return { keep, edges };
  }
  // Wall made by pushing each cut edge along dir(p) -> offset vector.
  function lip(edges, dir) { const T = []; for (const [p, q] of edges) { const a = dir(p), b = dir(q); if (!a || !b) continue; quad(T, p, q, [q[0] + b[0], q[1] + b[1], q[2] + b[2]], [p[0] + a[0], p[1] + a[1], p[2] + a[2]]); } return doubleSided(T); }
  function box(w, h, l, x, y, s) {
    const T = [], X = [x - w / 2, x + w / 2], Y = [y - h / 2, y + h / 2], S = [s - l / 2, s + l / 2], v = (i, j, k) => [X[i], Y[j], S[k]];
    quad(T, v(0, 0, 0), v(1, 0, 0), v(1, 1, 0), v(0, 1, 0)); quad(T, v(0, 0, 1), v(1, 0, 1), v(1, 1, 1), v(0, 1, 1));
    quad(T, v(0, 0, 0), v(0, 0, 1), v(0, 1, 1), v(0, 1, 0)); quad(T, v(1, 0, 0), v(1, 0, 1), v(1, 1, 1), v(1, 1, 0));
    quad(T, v(0, 0, 0), v(1, 0, 0), v(1, 0, 1), v(0, 0, 1)); quad(T, v(0, 1, 0), v(1, 1, 0), v(1, 1, 1), v(0, 1, 1));
    return orient(T, () => [x, y, s]);
  }
  // Extrude a convex-ish polygon given in (s, y) across x0..x1.
  function extrudeX(poly, x0, x1) {
    const T = [], n = poly.length; let cs = 0, cy = 0; for (const p of poly) { cs += p[0] / n; cy += p[1] / n; }
    for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; quad(T, [x0, a[1], a[0]], [x0, b[1], b[0]], [x1, b[1], b[0]], [x1, a[1], a[0]]); }
    for (let i = 1; i + 1 < n; i++) { tri(T, [x0, poly[0][1], poly[0][0]], [x0, poly[i][1], poly[i][0]], [x0, poly[i + 1][1], poly[i + 1][0]]); tri(T, [x1, poly[0][1], poly[0][0]], [x1, poly[i][1], poly[i][0]], [x1, poly[i + 1][1], poly[i + 1][0]]); }
    return orient(T, () => [(x0 + x1) / 2, cy, cs]);
  }
  // Extrude a polygon given in (x, s) across y0..y1 (flat plates such as the splitter).
  function extrudeY(poly, y0, y1) {
    const T = [], n = poly.length; let cx = 0, cs = 0; for (const p of poly) { cx += p[0] / n; cs += p[1] / n; }
    for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; quad(T, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]); }
    for (let i = 1; i + 1 < n; i++) { tri(T, [poly[0][0], y0, poly[0][1]], [poly[i][0], y0, poly[i][1]], [poly[i + 1][0], y0, poly[i + 1][1]]); tri(T, [poly[0][0], y1, poly[0][1]], [poly[i][0], y1, poly[i][1]], [poly[i + 1][0], y1, poly[i + 1][1]]); }
    return orient(T, () => [cx, (y0 + y1) / 2, cs]);
  }
  // Tube along s (exhaust tips): n sides, outer radius r, wall t.
  function tubeS(r, t, len, x, y, s, n) {
    const T = [], ring = (rad, ss) => { const R = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + Math.PI / n; R.push([x + Math.cos(a) * rad, y + Math.sin(a) * rad * 0.82, ss]); } return R; };
    const o0 = ring(r, s), o1 = ring(r, s - len), i0 = ring(r - t, s), i1 = ring(r - t, s - len);
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; quad(T, o0[i], o0[j], o1[j], o1[i]); quad(T, i0[i], i0[j], i1[j], i1[i]); quad(T, o1[i], o1[j], i1[j], i1[i]); }
    return doubleSided(T);
  }
  // Flat bar from a to b: w wide (along s), h thick.
  function strut(a, b, w, h) { const T = [], c = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], A = c.map((q) => [a[0], a[1] + q[1], a[2] + q[0]]), B = c.map((q) => [b[0], b[1] + q[1], b[2] + q[0]]); for (let k = 0; k < 4; k++) quad(T, A[k], A[(k + 1) % 4], B[(k + 1) % 4], B[k]); quad(T, A[0], A[1], A[2], A[3]); quad(T, B[0], B[1], B[2], B[3]); return orient(T, () => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]); }
  const rbox = (px, py, hx, hy, r) => { const qx = Math.abs(px) - hx + r, qy = Math.abs(py) - hy + r; return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r; };

  // Position + smooth normals (creased at sharp edges), converted to game space (z = -s).
  function toGeometry(THREE, T, creaseDeg) {
    const n = T.length / 3, pos = new Float32Array(T.length), nor = new Float32Array(T.length), fn = new Float32Array(T.length / 3), cosC = Math.cos(((creaseDeg || 38) * Math.PI) / 180);
    for (let i = 0; i < n; i++) { pos[i * 3] = T[i * 3]; pos[i * 3 + 1] = T[i * 3 + 1]; pos[i * 3 + 2] = -T[i * 3 + 2]; }
    for (let i = 0; i < n; i += 3) { const a = i * 3, b = a + 3, c = a + 6, t = pos[b]; for (let k = 0; k < 3; k++) { const q = pos[b + k]; pos[b + k] = pos[c + k]; pos[c + k] = q; } void t; } // z flip reverses winding
    const map = new Map();
    for (let f = 0; f < n / 3; f++) {
      const i = f * 9, ux = pos[i + 3] - pos[i], uy = pos[i + 4] - pos[i + 1], uz = pos[i + 5] - pos[i + 2], vx = pos[i + 6] - pos[i], vy = pos[i + 7] - pos[i + 1], vz = pos[i + 8] - pos[i + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const area = Math.hypot(nx, ny, nz) || 1e-12;
      fn[f * 3] = nx / area; fn[f * 3 + 1] = ny / area; fn[f * 3 + 2] = nz / area;
      for (let k = 0; k < 3; k++) { const key = Math.round(pos[i + k * 3] * 5000) + ',' + Math.round(pos[i + k * 3 + 1] * 5000) + ',' + Math.round(pos[i + k * 3 + 2] * 5000); let l = map.get(key); if (!l) map.set(key, (l = [])); l.push(f, area); }
    }
    for (let f = 0; f < n / 3; f++) for (let k = 0; k < 3; k++) {
      const i = f * 9 + k * 3, key = Math.round(pos[i] * 5000) + ',' + Math.round(pos[i + 1] * 5000) + ',' + Math.round(pos[i + 2] * 5000), l = map.get(key);
      let x = 0, y = 0, z = 0; const ax = fn[f * 3], ay = fn[f * 3 + 1], az = fn[f * 3 + 2];
      for (let q = 0; q < l.length; q += 2) { const g = l[q] * 3; if (fn[g] * ax + fn[g + 1] * ay + fn[g + 2] * az >= cosC) { x += fn[g] * l[q + 1]; y += fn[g + 1] * l[q + 1]; z += fn[g + 2] * l[q + 1]; } }
      const m = Math.hypot(x, y, z) || 1; nor[i] = x / m; nor[i + 1] = y / m; nor[i + 2] = z / m;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.computeBoundingSphere();
    return geo;
  }

  // ---------- the car ----------
  const SPEC = { L: 4.66, W: 2.04, wr: 0.36, wheels: [1.36, -1.44], clear: 0.11, tireW: 0.31, H: 1.17 };
  const NOSE = 2.33, TAIL = -2.3, XIN = 0.64;
  const ARCH = [{ s: SPEC.wheels[0], y: 0.355, r: 0.405 }, { s: SPEC.wheels[1], y: 0.36, r: 0.415 }];
  // Body stations, s from nose to tail: half-width, floor, widest-point height, fender-crown height, crown position, centreline height.
  const KEY = [
    [2.33, 0.74, 0.130, 0.215, 0.300, 0.74, 0.290], [2.26, 0.85, 0.118, 0.235, 0.355, 0.76, 0.325], [2.10, 0.925, 0.112, 0.270, 0.450, 0.79, 0.380], [1.85, 0.985, 0.110, 0.335, 0.610, 0.80, 0.455],
    [1.36, 1.015, 0.110, 0.430, 0.780, 0.80, 0.575], [0.92, 1.010, 0.110, 0.450, 0.760, 0.80, 0.660], [0.45, 0.990, 0.110, 0.455, 0.705, 0.81, 0.715], [-0.30, 0.985, 0.110, 0.465, 0.700, 0.82, 0.750],
    [-0.90, 1.005, 0.110, 0.495, 0.790, 0.82, 0.815], [-1.44, 1.020, 0.120, 0.530, 0.905, 0.80, 0.850], [-1.95, 0.995, 0.180, 0.565, 0.895, 0.80, 0.845], [-2.20, 0.955, 0.255, 0.590, 0.855, 0.80, 0.822], [-2.30, 0.925, 0.300, 0.600, 0.822, 0.80, 0.800],
  ];
  const fTuck = curve([[0.95, 0], [0.55, 0.035], [0.0, 0.085], [-0.5, 0.115], [-0.82, 0.07], [-1.02, 0]]);   // door scallop feeding the side intake

  const col = (k) => curve(KEY.map((r) => [r[0], r[k]]));
  const fHW = col(1), fYB = col(2), fYM = col(3), fYF = col(4), fKX = col(5), fYC = col(6);
  function section(s) {
    const hw = fHW(s), yb = fYB(s), ym = Math.max(yb + 0.02, fYM(s)), yf = Math.max(ym + 0.01, fYF(s)), kx = fKX(s), yc = fYC(s), rk = Math.min(0.11, (ym - yb) * 0.8);
    return [[0, yb], [hw * 0.55, yb], [hw * 0.9, yb + rk * 0.12], [hw * 0.995, yb + rk], [hw * (1 - fTuck(s)), ym], [hw * (kx + (1 - kx) * (0.6 + fTuck(s) * 2.2)), ym + (yf - ym) * 0.7], [hw * kx, yf], [hw * kx * 0.8, yf - (yf - yc) * 0.07], [hw * kx * 0.5, yc + (yf - yc) * 0.3], [0, yc]];
  }
  const NU = 48;
  const bodyPt = (s, u) => { const C = section(s), p = splinePt(C, u); return [Math.max(0, Math.min(fHW(s), p[0])), p[1], s]; };
  const bodyAxis = (x, y, s) => [0, (fYB(s) + fYC(s)) / 2, s];

  // Canopy: a teardrop glasshouse lofted separately and sunk into the body.
  const CAN = [[1.02, 0.46, 0.56], [0.80, 0.585, 0.745], [0.50, 0.675, 0.925], [0.15, 0.725, 1.085], [-0.25, 0.735, 1.165], [-0.70, 0.705, 1.150], [-1.10, 0.620, 1.060], [-1.50, 0.500, 0.955], [-1.90, 0.360, 0.850]];
  const cW = curve(CAN.map((r) => [r[0], r[1]])), cH = curve(CAN.map((r) => [r[0], r[2]])), CBASE = 0.5;
  const canPt = (s, t) => { const w = cW(s), h = cH(s) - CBASE, c = Math.cos(t), si = Math.sin(t); return [w * Math.pow(c, 0.62), CBASE + h * Math.pow(si, 0.74), s]; };

  function buildHypercar(THREE) {
    const P = { paint: [], glass: [], trim: [], rubber: [], chrome: [], head: [], tail: [], plate: [], sigL: [], sigR: [], accent: [], led: [] };
    const add = (k, T) => { for (let i = 0; i < T.length; i++) P[k].push(T[i]); };

    // --- body shell (right half), then openings ---
    const S = []; for (let s = NOSE; s > TAIL + 1e-6; s -= 0.025) S.push(s); S.push(TAIL);
    let body = [];
    for (let i = 0; i + 1 < S.length; i++) for (let j = 0; j < NU; j++) quad(body, bodyPt(S[i], j / NU), bodyPt(S[i + 1], j / NU), bodyPt(S[i + 1], (j + 1) / NU), bodyPt(S[i], (j + 1) / NU));
    const mouth = []; { const q = (j, f, d) => { const p = bodyPt(NOSE, j / NU); return [p[0] * (0.955 + 0.045 * f), 0.215 + (p[1] - 0.215) * (0.8 + 0.2 * f), NOSE - d]; };
      for (let j = 0; j < NU; j++) { quad(body, q(j, 1, 0), q(j + 1, 1, 0), q(j + 1, 0, 0), q(j, 0, 0)); quad(mouth, q(j, 0, 0), q(j + 1, 0, 0), q(j + 1, 0, 0.09), q(j, 0, 0.09)); tri(mouth, [0, 0.215, NOSE - 0.09], q(j, 0, 0.09), q(j + 1, 0, 0.09)); } }
    orient(body, bodyAxis);
    const cutOut = (f, dir) => { const r = clip(body, f); body = r.keep; add('rubber', both(lip(r.edges, dir))); };
    // wheel arches
    for (const a of ARCH) cutOut((x, y, s) => Math.max(Math.hypot(s - a.s, y - a.y) - a.r, XIN + Math.min(1, Math.max(0, (y - a.y - 0.2) / 0.1)) * 0.17 - x), (p) => (Math.abs(Math.hypot(p[2] - a.s, p[1] - a.y) - a.r) < 0.004 ? [XIN - p[0], 0, 0] : null));
    // bonnet outlets, side intake behind the door, rear fender outlet, engine-bay outlets on the deck
    cutOut((x, y, s) => Math.max(rbox(x - 0.33, s - 1.31, 0.15, 0.2, 0.07), 0.42 - y), () => [0, -0.1, 0]);
    cutOut((x, y, s) => { const k = -(s + 0.56) / 0.3; return Math.max(rbox(s + 0.56, y - 0.47 - k * 0.03, 0.3, 0.105 + k * 0.045, 0.06), 0.7 - x); }, () => [-0.16, 0, -0.06]);
    cutOut((x, y, s) => Math.max(rbox(x - 0.60, s + 2.03, 0.17, 0.1, 0.05), 0.7 - y), () => [0, -0.1, 0]);
    add('paint', both(body));
    // dark surfaces seen through the openings
    const dark = (T) => add('rubber', T);   // matt black: the game's darkest material
    dark(both(doubleSided(mouth))); for (const sx of [-1, 1]) { dark(box(0.36, 0.012, 0.5, sx * 0.33, 0.515, 1.31)); dark(box(0.012, 0.42, 0.74, sx * 0.72, 0.48, -0.56)); dark(box(0.4, 0.012, 0.26, sx * 0.6, 0.775, -2.03)); }
    for (let k = 0; k < 3; k++) add('accent', box(1.16 + k * 0.08, 0.007, 0.05, 0, 0.176 + k * 0.034, NOSE - 0.05)); for (const x of [-0.3, 0.3]) add('accent', box(0.02, 0.12, 0.06, x, 0.215, NOSE - 0.05));                       // nose grille bars
    for (const sx of [-1, 1]) { for (let k = 0; k < 5; k++) add('accent', box(0.3, 0.01, 0.022, sx * 0.33, 0.565, 1.15 + k * 0.08)); for (let k = 0; k < 3; k++) add('accent', box(0.014, 0.012, 0.5, sx * 0.80, 0.41 + k * 0.065, -0.58)); for (let k = 0; k < 3; k++) add('accent', box(0.34, 0.01, 0.02, sx * 0.6, 0.83, -1.97 - k * 0.06)); }
    for (const a of ARCH) for (const sx of [-1, 1]) { const D = []; const N = 28; for (let i = 0; i < N; i++) { const t0 = (i / N) * Math.PI * 2, t1 = ((i + 1) / N) * Math.PI * 2, y0 = Math.max(0.1, a.y + Math.sin(t0) * a.r), y1 = Math.max(0.1, a.y + Math.sin(t1) * a.r); tri(D, [sx * XIN, Math.max(0.1, a.y), a.s], [sx * XIN, y0, a.s + Math.cos(t0) * a.r], [sx * XIN, y1, a.s + Math.cos(t1) * a.r]); } dark(doubleSided(D)); }

    // --- conformal details that sit just proud of the body skin ---
    const skin = (s0, s1, u0, u1, off, ns, nu) => {
      const T = [], pt = (s, uo) => { const u = uo <= 0.75 ? (uo * 8) / 9 : 2 / 3 + ((uo - 0.75) / 0.25) / 3, p = bodyPt(s, u),   // u is given on the 8-span scale: 0.5 widest point, 0.75 fender crown, 1 centreline
        a = bodyPt(s, u + 0.004), b = bodyPt(s - 0.004, u), ux = a[0] - p[0], uy = a[1] - p[1], uz = a[2] - p[2], vx = b[0] - p[0], vy = b[1] - p[1], vz = b[2] - p[2]; let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const m = Math.hypot(nx, ny, nz) || 1, o = bodyAxis(p[0], p[1], p[2]), sg = (nx * (p[0] - o[0]) + ny * (p[1] - o[1]) + nz * (p[2] - o[2]) < 0 ? -1 : 1) * off / m; return [p[0] + nx * sg, p[1] + ny * sg, p[2] + nz * sg]; };
      for (let i = 0; i < ns; i++) for (let j = 0; j < nu; j++) { const sa = s0 + ((s1 - s0) * i) / ns, sb = s0 + ((s1 - s0) * (i + 1)) / ns, ua = u0 + ((u1 - u0) * j) / nu, ub = u0 + ((u1 - u0) * (j + 1)) / nu; quad(T, pt(sa, ua), pt(sb, ua), pt(sb, ub), pt(sa, ub)); }
      return orient(T, bodyAxis);
    };
    const R = (k, T) => add(k, T), L = (k, T) => add(k, mirrorX(T)), LR = (k, T) => add(k, both(T));
    LR('accent', skin(2.14, 1.66, 0.685, 0.80, 0.004, 16, 6));                 // headlamp housing
    LR('head', skin(2.10, 1.86, 0.705, 0.745, 0.007, 8, 2));                   // main beam
    LR('head', skin(2.11, 1.70, 0.772, 0.786, 0.007, 12, 1));                  // running-light blade
    LR('chrome', skin(1.83, 1.74, 0.705, 0.745, 0.007, 3, 2));                 // second projector
    R('sigR', skin(1.72, 1.685, 0.70, 0.775, 0.008, 1, 4)); L('sigL', skin(1.72, 1.685, 0.70, 0.775, 0.008, 1, 4));
    LR('trim', skin(0.74, 0.732, 0.30, 0.74, 0.002, 1, 22)); LR('trim', skin(-0.13, -0.138, 0.30, 0.72, 0.002, 1, 22));           // door shut lines
    LR('trim', skin(0.74, -0.138, 0.298, 0.303, 0.002, 30, 1)); LR('trim', skin(1.02, 1.012, 0.76, 1.0, 0.002, 1, 12));           // sill line, bonnet line
    LR('trim', skin(-0.93, -0.938, 0.52, 0.80, 0.002, 1, 14));                                                                    // rear clamshell line
    LR('accent', skin(0.93, -1.0, 0.20, 0.285, 0.004, 40, 3));                                                                    // carbon sill

    // --- canopy ---
    const CS = []; for (let s = 1.02; s > -1.9 + 1e-6; s -= 0.03) CS.push(s); CS.push(-1.9);
    const NT = 26, zone = (s, t) => {
      if (s > -0.06) return t > 0.94 && t < 1.02 ? 'accent' : 'glass';                                // windscreen, A-pillar, front side glass
      if (s > -0.92) return t > 1.02 ? 'paint' : t > 0.94 ? 'accent' : s < -0.80 ? 'paint' : 'glass';  // roof, cant rail, side glass, B-pillar
      if (s > -1.72) return t > 1.12 ? 'glass' : 'paint';                                           // engine cover glass between the buttresses
      return 'paint';
    };
    const can = { paint: [], glass: [], accent: [] };
    for (let i = 0; i + 1 < CS.length; i++) for (let j = 0; j < NT; j++) { const t0 = (j / NT) * Math.PI / 2, t1 = ((j + 1) / NT) * Math.PI / 2; quad(can[zone((CS[i] + CS[i + 1]) / 2, (t0 + t1) / 2)], canPt(CS[i], t0), canPt(CS[i + 1], t0), canPt(CS[i + 1], t1), canPt(CS[i], t1)); }
    for (const k in can) add(k, both(orient(can[k], (x, y, s) => [0, 0.55, s])));
    for (let k = 0; k < 5; k++) add('accent', box(0.34 - k * 0.035, 0.012, 0.03, 0, cH(-1.16 - k * 0.11) + 0.004, -1.16 - k * 0.11));    // engine cover louvres
    // roof intake
    const scoop = []; for (let i = 0; i < 12; i++) for (let j = 0; j < 8; j++) { const sp = (i, j) => { const a = 0.55 + (i / 12) * (Math.PI - 0.55), b = (j / 8) * Math.PI / 2, s = -0.42 - (Math.cos(0.55) - Math.cos(a)) * 0.24; return [Math.cos(b) * 0.115 * Math.sin(a) ** 0.6, cH(s) - 0.012 + Math.sin(b) * 0.07 * Math.sin(a) ** 0.5, s]; }; quad(scoop, sp(i, j), sp(i + 1, j), sp(i + 1, j + 1), sp(i, j + 1)); }
    add('paint', both(orient(scoop, (x, y, s) => [0, 1.1, s]))); add('trim', box(0.17, 0.05, 0.012, 0, cH(-0.44) + 0.022, -0.435));

    // --- aero and trim ---
    add('accent', extrudeY([[-0.98, 1.86], [-0.9, 2.3], [-0.6, 2.41], [0.6, 2.41], [0.9, 2.3], [0.98, 1.86]], 0.07, 0.09));                 // front splitter
    for (const sx of [-1, 1]) {
      add('accent', extrudeX([[1.84, 0.09], [2.3, 0.09], [2.3, 0.17], [1.84, 0.21]], sx * 0.955, sx * 0.975));                              // splitter end plates
      add('accent', extrudeY([[sx * 0.83, 2.2], [sx * 1.0, 1.98], [sx * 1.0, 1.9], [sx * 0.86, 2.08]], 0.325, 0.337));                       // canard
      add('accent', box(0.05, 0.02, 1.96, sx * 1.0, 0.1, -0.03));                                                                              // side skirt blade
      add('paint', extrudeX([[0.47, 0.835], [0.40, 0.872], [0.30, 0.880], [0.255, 0.852], [0.29, 0.818], [0.42, 0.812]], sx * 0.955, sx * 1.075)); // mirror pod
      add('accent', strut([sx * 0.80, 0.735, 0.47], [sx * 0.975, 0.835, 0.37], 0.05, 0.022));                                              // mirror arm
      add('chrome', box(0.1, 0.05, 0.006, sx * 1.015, 0.848, 0.262));
      add('accent', extrudeX([[-1.72, 0.84], [-2.02, 0.83], [-2.2, 1.05], [-2.06, 1.07]], sx * 0.31, sx * 0.335));                           // wing pylon
      add('accent', extrudeX([[-1.86, 0.98], [-2.34, 0.98], [-2.36, 1.17], [-1.9, 1.13]], sx * 0.89, sx * 0.905));                           // wing end plate
    }
    const foil = [[-1.92, 1.065], [-2.0, 1.092], [-2.12, 1.105], [-2.24, 1.1], [-2.33, 1.085], [-2.24, 1.068], [-2.1, 1.058], [-1.98, 1.056]];
    add('accent', extrudeX(foil, -0.89, 0.89)); add('led', box(0.5, 0.012, 0.008, 0, 1.082, -2.334));                                        // rear wing, high brake light
    // rear fascia
    const cap = []; for (let j = 0; j < NU; j++) tri(cap, [0, 0.56, TAIL], bodyPt(TAIL, j / NU), bodyPt(TAIL, (j + 1) / NU)); add('trim', both(orient(cap, () => [0, 0.56, 0])));
    for (let k = 0; k < 6; k++) add('accent', box(1.5, 0.007, 0.012, 0, 0.45 + k * 0.036, TAIL - 0.006));                         // mesh bars
    add('tail', box(1.56, 0.022, 0.02, 0, 0.715, TAIL - 0.008));                                                                             // light bar
    for (const sx of [-1, 1]) { add('tail', box(0.022, 0.13, 0.02, sx * 0.79, 0.66, TAIL - 0.008)); add('tail', box(0.16, 0.022, 0.02, sx * 0.71, 0.6, TAIL - 0.008)); add(sx < 0 ? 'sigL' : 'sigR', box(0.1, 0.02, 0.02, sx * 0.71, 0.675, TAIL - 0.008)); add('chrome', tubeS(0.078, 0.009, 0.17, sx * 0.105, 0.535, TAIL + 0.1, 6)); add('rubber', box(0.12, 0.1, 0.01, sx * 0.105, 0.535, TAIL + 0.02)); }
    add('plate', box(0.31, 0.155, 0.012, 0, 0.375, TAIL - 0.012)); add('trim', box(0.34, 0.185, 0.01, 0, 0.375, TAIL - 0.004));
    // diffuser
    add('accent', extrudeX([[-1.7, 0.105], [-2.36, 0.285], [-2.36, 0.305], [-1.7, 0.125]], -0.9, 0.9));
    for (const x of [-0.72, -0.48, -0.24, 0, 0.24, 0.48, 0.72]) add('accent', extrudeX([[-1.76, 0.075], [-2.37, 0.215], [-2.37, 0.288], [-1.76, 0.112]], x - 0.007, x + 0.007));
    for (let k = -18; k <= 18; k++) add('accent', box(0.007, 0.2, 0.012, k * 0.04, 0.54, TAIL - 0.005));                                         // mesh uprights
    { const a = canPt(0.84, 1.36), b = canPt(0.60, 0.80); add('accent', strut([a[0] - 0.05, a[1] + 0.02, a[2]], [b[0], b[1] + 0.016, b[2]], 0.022, 0.012)); }  // wiper

    const parts = {}; for (const k in P) if (P[k].length) parts[k] = toGeometry(THREE, P[k], k === 'paint' || k === 'glass' ? 40 : 30);
    return { spec: SPEC, parts,
      head: [[-0.78, 0.5, -2.02], [0.78, 0.5, -2.02]], tail: [[-0.72, 0.68, 2.33], [0.72, 0.68, 2.33]] };
  }

  // One wheel, centred on its hub, axle along x, outer face towards +x.
  function buildHypercarWheel(THREE, spec) {
    const wr = (spec || SPEC).wr, tw = (spec || SPEC).tireW, rr = wr * 0.71, P = { rubber: [], rim: [], chrome: [], caliper: [], trim: [] };
    const lathe = (k, prof, n) => { const T = []; for (let i = 0; i < n; i++) { const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2; for (let j = 0; j + 1 < prof.length; j++) { const p = prof[j], q = prof[j + 1], v = (pt, a) => [pt[0], Math.sin(a) * pt[1], Math.cos(a) * pt[1]]; quad(T, v(p, a0), v(q, a0), v(q, a1), v(p, a1)); } } for (const v of doubleSided(T)) P[k].push(v); };
    const h = tw / 2;
    lathe('rubber', [[-h, rr], [-h, wr - 0.05], [-h + 0.03, wr - 0.012], [-h + 0.07, wr], [h - 0.07, wr], [h - 0.03, wr - 0.012], [h, wr - 0.05], [h, rr]], 48);
    for (const g of [-0.07, 0, 0.07]) lathe('trim', [[g - 0.006, wr + 0.001], [g + 0.006, wr + 0.001]], 48);                       // tread grooves
    lathe('rim', [[-h, rr], [-h + 0.02, rr - 0.012], [h - 0.05, rr - 0.03], [h - 0.012, rr - 0.004], [h, rr + 0.004]], 48);         // barrel and outer lip
    lathe('chrome', [[h - 0.16, 0.02], [h - 0.16, rr * 0.80], [h - 0.175, rr * 0.80], [h - 0.175, 0.02]], 40);                      // brake disc
    for (let i = 0; i < 5; i++) for (const d of [-0.2, 0.2]) {                                                                       // five twin spokes
      const a = (i / 5) * Math.PI * 2, b = a + d, T = [], r0 = 0.055, r1 = rr - 0.005, x0 = h - 0.035, x1 = h - 0.012, wd = 0.014;
      const at = (r, ang, x, side) => [x, Math.sin(ang) * r + Math.cos(ang) * side * wd, Math.cos(ang) * r - Math.sin(ang) * side * wd];
      const A = [at(r0, a, x0, -1), at(r0, a, x0, 1), at(r1, b, x1, 1), at(r1, b, x1, -1)], B = A.map((p) => [p[0] - 0.03, p[1], p[2]]);
      quad(T, A[0], A[1], A[2], A[3]); quad(T, B[0], B[1], B[2], B[3]); for (let k = 0; k < 4; k++) quad(T, A[k], A[(k + 1) % 4], B[(k + 1) % 4], B[k]);
      for (const v of doubleSided(T)) P.rim.push(v);
    }
    lathe('rim', [[h - 0.06, 0.0], [h - 0.03, 0.07], [h - 0.012, 0.062], [h - 0.004, 0.03], [h - 0.004, 0]], 20);                   // hub
    lathe('chrome', [[h - 0.004, 0.028], [h + 0.006, 0.022], [h + 0.006, 0]], 6);                                                    // centre-lock nut
    const cal = []; for (let i = 0; i < 6; i++) { const a0 = 0.5 + (i / 6) * 1.0, a1 = 0.5 + ((i + 1) / 6) * 1.0, v = (x, r, a) => [x, Math.sin(a) * r, -Math.cos(a) * r], ro = rr * 0.86, ri = rr * 0.52, xa = h - 0.2, xb = h - 0.12; quad(cal, v(xb, ri, a0), v(xb, ro, a0), v(xb, ro, a1), v(xb, ri, a1)); quad(cal, v(xa, ro, a0), v(xb, ro, a0), v(xb, ro, a1), v(xa, ro, a1)); }
    for (const v of doubleSided(cal)) P.caliper.push(v);
    const out = {}; for (const k in P) { const T = []; for (let i = 0; i < P[k].length; i += 3) T.push(P[k][i], P[k][i + 1], -P[k][i + 2]); out[k] = toGeometry(THREE, T, k === 'rubber' ? 50 : 35); }
    return out;
  }

  root.buildHypercar = buildHypercar; root.buildHypercarWheel = buildHypercarWheel;
})(typeof window !== 'undefined' ? window : globalThis);
