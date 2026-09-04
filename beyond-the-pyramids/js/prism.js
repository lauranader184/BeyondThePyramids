/* ================================================================
   HERO PRISM BACKGROUND
   Port of the React Bits "Prism" component (Prism-JS-CSS) for this
   plain HTML/CSS/JS site. The raymarching shader is the registry
   original; the only change is the colour output, which is remapped
   from the default rainbow to the project's muted gold / champagne.
   Renders only inside #heroPrism, i.e. the front-page hero.
   ================================================================ */
(function () {
  "use strict";

  var container = document.getElementById("heroPrism");
  if (!container) return;

  /* ---------------- configuration (the component's props) ---------------- */
  var HEIGHT = 3.5;
  var BASE_WIDTH = 5.5;
  var SCALE = 3.6;
  var GLOW = 1;
  var BLOOM = 1;
  var NOISE = 0.5;
  var HUE_SHIFT = 0;
  var COLOR_FREQUENCY = 1;
  var TIME_SCALE = 0.2;
  var OFFSET_X = 0;
  var OFFSET_Y = 0;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TS = reduceMotion ? 0 : TIME_SCALE; // 0 renders one still frame
  var STILL = TS < 1e-6;
  var BASE_HALF = BASE_WIDTH * 0.5;

  /* ---------------- WebGL context ---------------- */
  var canvas = document.createElement("canvas");
  var attributes = {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: "low-power",
    // a single still frame would otherwise be cleared after compositing
    preserveDrawingBuffer: STILL
  };
  var gl = canvas.getContext("webgl", attributes) ||
           canvas.getContext("experimental-webgl", attributes);
  if (!gl) return; // no WebGL: the hero keeps its CSS/SVG geometry alone

  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.disable(gl.BLEND);

  canvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;display:block;";
  container.appendChild(canvas);

  var vertexSrc = [
    "attribute vec2 position;",
    "void main(){ gl_Position = vec4(position, 0.0, 1.0); }"
  ].join("\n");

  var fragmentSrc = [
    "precision highp float;",
    "",
    "uniform vec2 iResolution;",
    "uniform float iTime;",
    "uniform mat3 uRot;",
    "uniform int uUseBaseWobble;",
    "uniform float uGlow;",
    "uniform vec2 uOffsetPx;",
    "uniform float uNoise;",
    "uniform float uHueShift;",
    "uniform float uColorFreq;",
    "uniform float uBloom;",
    "uniform float uCenterShift;",
    "uniform float uInvBaseHalf;",
    "uniform float uInvHeight;",
    "uniform float uMinAxis;",
    "uniform float uPxScale;",
    "uniform float uTimeScale;",
    "",
    "vec4 tanh4(vec4 x){",
    "  vec4 e2x = exp(2.0 * x);",
    "  return (e2x - 1.0) / (e2x + 1.0);",
    "}",
    "",
    "float rand(vec2 co){",
    "  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453123);",
    "}",
    "",
    "float sdOctaAnisoInv(vec3 p){",
    "  vec3 q = vec3(abs(p.x) * uInvBaseHalf, abs(p.y) * uInvHeight, abs(p.z) * uInvBaseHalf);",
    "  float m = q.x + q.y + q.z - 1.0;",
    "  return m * uMinAxis * 0.5773502691896258;",
    "}",
    "",
    "float sdPyramidUpInv(vec3 p){",
    "  float oct = sdOctaAnisoInv(p);",
    "  float halfSpace = -p.y;",
    "  return max(oct, halfSpace);",
    "}",
    "",
    "mat3 hueRotation(float a){",
    "  float c = cos(a), s = sin(a);",
    "  mat3 W = mat3(0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114);",
    "  mat3 U = mat3(0.701, -0.587, -0.114, -0.299, 0.413, -0.114, -0.300, -0.588, 0.886);",
    "  mat3 V = mat3(0.168, -0.331, 0.500, 0.328, 0.035, -0.500, -0.497, 0.296, 0.201);",
    "  return W + U * c + V * s;",
    "}",
    "",
    "void main(){",
    "  vec2 f = (gl_FragCoord.xy - 0.5 * iResolution.xy - uOffsetPx) * uPxScale;",
    "",
    "  float z = 5.0;",
    "  float d = 0.0;",
    "  vec3 p;",
    "  vec4 o = vec4(0.0);",
    "",
    "  float centerShift = uCenterShift;",
    "  float cf = uColorFreq;",
    "",
    "  mat2 wob = mat2(1.0);",
    "  if (uUseBaseWobble == 1) {",
    "    float t = iTime * uTimeScale;",
    "    float c0 = cos(t + 0.0);",
    "    float c1 = cos(t + 33.0);",
    "    float c2 = cos(t + 11.0);",
    "    wob = mat2(c0, c1, c2, c0);",
    "  }",
    "",
    "  const int STEPS = 100;",
    "  for (int i = 0; i < STEPS; i++) {",
    "    p = vec3(f, z);",
    "    p.xz = p.xz * wob;",
    "    p = uRot * p;",
    "    vec3 q = p;",
    "    q.y += centerShift;",
    "    d = 0.1 + 0.2 * abs(sdPyramidUpInv(q));",
    "    z -= d;",
    "    o += (sin((p.y + z) * cf + vec4(0.0, 1.0, 2.0, 3.0)) + 1.0) / d;",
    "  }",
    "",
    "  o = tanh4(o * o * (uGlow * uBloom) / 1e5);",
    "",
    /* ---- gold recolour: replaces the component's rainbow rgb output ----
       The raymarched light field is collapsed to a single intensity and
       then remapped along one warm ramp, so no other hue can appear. */
    "  float inten = clamp(dot(o.rgb, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);",
    "  float n = rand(gl_FragCoord.xy + vec2(iTime));",
    "  inten = clamp(inten + (n - 0.5) * uNoise * 0.12, 0.0, 1.0);",
    "  inten = pow(inten, 1.7);", /* keeps the light in the edges, not the mass */
    "",
    "  vec3 ember     = vec3(0.400, 0.294, 0.110);", /* deep warm shadow */
    "  vec3 gold      = vec3(0.784, 0.635, 0.290);", /* #C8A24A */
    "  vec3 champagne = vec3(0.882, 0.784, 0.565);", /* soft highlight */
    "",
    "  vec3 col = mix(ember, gold, smoothstep(0.0, 0.55, inten));",
    "  col = mix(col, champagne, smoothstep(0.86, 1.0, inten));",
    "  col.b *= 0.78;", /* the navy underneath adds blue back through the blend */
    "",
    "  if (abs(uHueShift) > 0.0001) {",
    "    col = clamp(hueRotation(uHueShift) * col, 0.0, 1.0);",
    "  }",
    "",
    /* alpha follows the light, so unlit areas stay pure navy */
    "  float alpha = clamp(pow(inten, 1.25) * 0.95, 0.0, 1.0);",
    "  gl_FragColor = vec4(col, alpha);",
    "}"
  ].join("\n");

  function compile(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Prism shader failed: " + gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  var vs = compile(gl.VERTEX_SHADER, vertexSrc);
  var fs = compile(gl.FRAGMENT_SHADER, fragmentSrc);
  if (!vs || !fs) return;

  var program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Prism program failed: " + gl.getProgramInfoLog(program));
    return;
  }
  gl.useProgram(program);

  // fullscreen triangle, same geometry the component's ogl Triangle uses
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var positionLoc = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

  var u = {};
  ["iResolution", "iTime", "uRot", "uUseBaseWobble", "uGlow", "uOffsetPx", "uNoise",
   "uHueShift", "uColorFreq", "uBloom", "uCenterShift", "uInvBaseHalf", "uInvHeight",
   "uMinAxis", "uPxScale", "uTimeScale"].forEach(function (name) {
    u[name] = gl.getUniformLocation(program, name);
  });

  gl.uniform1i(u.uUseBaseWobble, 0); // 0 for the "3drotate" animation type
  gl.uniform1f(u.uGlow, GLOW);
  gl.uniform1f(u.uNoise, NOISE);
  gl.uniform1f(u.uHueShift, HUE_SHIFT);
  gl.uniform1f(u.uColorFreq, COLOR_FREQUENCY);
  gl.uniform1f(u.uBloom, BLOOM);
  gl.uniform1f(u.uCenterShift, HEIGHT * 0.25);
  gl.uniform1f(u.uInvBaseHalf, 1 / BASE_HALF);
  gl.uniform1f(u.uInvHeight, 1 / HEIGHT);
  gl.uniform1f(u.uMinAxis, Math.min(BASE_HALF, HEIGHT));
  gl.uniform1f(u.uTimeScale, TS);

  /* ---------------- sizing ---------------- */
  // a lighter pixel ratio on small screens keeps phones smooth
  var dpr = Math.min(window.innerWidth < 800 ? 1.25 : 2, window.devicePixelRatio || 1);

  function resize() {
    var w = Math.max(1, container.clientWidth);
    var h = Math.max(1, container.clientHeight);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u.iResolution, canvas.width, canvas.height);
    gl.uniform2f(u.uOffsetPx, OFFSET_X * dpr, OFFSET_Y * dpr);
    gl.uniform1f(u.uPxScale, 1 / ((canvas.height || 1) * 0.1 * SCALE));
  }

  function onResize() {
    resize();
    if (STILL) requestRepaint(); // the frozen frame has to be drawn again
  }

  if ("ResizeObserver" in window) {
    new ResizeObserver(onResize).observe(container);
  } else {
    window.addEventListener("resize", onResize);
  }
  resize();

  /* ---------------- rotation + render loop ---------------- */
  var rot = new Float32Array(9);
  function setMat3FromEuler(yawY, pitchX, rollZ, out) {
    var cy = Math.cos(yawY), sy = Math.sin(yawY);
    var cx = Math.cos(pitchX), sx = Math.sin(pitchX);
    var cz = Math.cos(rollZ), sz = Math.sin(rollZ);
    out[0] = cy * cz + sy * sx * sz;
    out[1] = cx * sz;
    out[2] = -sy * cz + cy * sx * sz;
    out[3] = -cy * sz + sy * sx * cz;
    out[4] = cx * cz;
    out[5] = sy * sz + cy * sx * cz;
    out[6] = sy * cx;
    out[7] = -sx;
    out[8] = cy * cx;
    return out;
  }

  var wX = (0.3 + Math.random() * 0.6);
  var wY = (0.2 + Math.random() * 0.7);
  var wZ = (0.1 + Math.random() * 0.5);
  var phX = Math.random() * Math.PI * 2;
  var phZ = Math.random() * Math.PI * 2;

  var raf = 0;
  var stillFrames = 0;
  var t0 = performance.now();

  function render(t) {
    var time = (t - t0) * 0.001;
    gl.uniform1f(u.iTime, time);

    var yaw, pitch, roll;
    if (STILL) {
      // reduced motion: one composed frame instead of the rotation
      yaw = 0.55;
      pitch = 0.32;
      roll = -0.18;
    } else {
      var scaled = time * TS;
      yaw = scaled * wY;
      pitch = Math.sin(scaled * wX + phX) * 0.6;
      roll = Math.sin(scaled * wZ + phZ) * 0.5;
    }
    gl.uniformMatrix3fv(u.uRot, false, setMat3FromEuler(yaw, pitch, roll, rot));

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (STILL) {
      // a single preserved frame can be dropped by the compositor, so hold
      // the frozen pose for a moment and then stop
      stillFrames += 1;
      raf = stillFrames < 30 ? requestAnimationFrame(render) : 0;
    } else {
      raf = requestAnimationFrame(render);
    }
  }

  function start() { if (!raf) raf = requestAnimationFrame(render); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  function requestRepaint() { stillFrames = 0; start(); }

  // stop drawing once the hero is scrolled away
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) requestRepaint();
      else stop();
    }).observe(container);
  }
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) requestRepaint();
  });
  start();
})();
