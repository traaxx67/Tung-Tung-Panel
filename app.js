/* tung tung tung panel.exe — 100% fake, 0% packets */
(() => {
  "use strict";

  const ATTACK_URL = "https://greenyoshi.byethost16.com/Screenshot_by_Lightshot_files/index.html?i=1";
  const STORAGE_KEY = "tung-panel-v1";

  const $ = (sel, root = document) => root.querySelector(sel);

  const panel = $("#panel");
  const form = $("#form");
  const target = $("#target");
  const port = $("#port");
  const duration = $("#duration");
  const method = $("#method");
  const token = $("#token");
  const targetError = $("#targetError");
  const startBtn = $("#startBtn");
  const mascot = $("#mascot");
  const quote = $("#quote");
  const statStatus = $("#statStatus");
  const statTungs = $("#statTungs");
  const tungCount = $("#tungCount");
  const statusText = $("#statusText");
  const consoleOut = $("#consoleOut");
  const progressFill = $("#progressFill");
  const toast = $("#toast");
  const fallback = $("#fallback");
  const fallbackLink = $("#fallbackLink");
  const soundBtn = $("#soundBtn");
  const clearBtn = $("#clearBtn");

  const state = {
    tungs: 0,
    sound: true,
    running: false,
    audio: null,
  };

  const quotes = [
    '"tung tung tung"',
    '"sahur"',
    '"the bat is loading"',
    '"i am inside your firewall"',
    '"wooden pipe deployed"',
    '"this is not a real panel lol"',
    '"press it again. i dare you."',
    '"tung. tung. tung."',
  ];

  /* ---------- persistence ---------- */

  function load() {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
    } catch {
      saved = {};
    }

    if (saved.target) target.value = saved.target;
    if (saved.port) port.value = saved.port;
    if (saved.duration) duration.value = saved.duration;
    if (saved.method) method.value = saved.method;
    if (saved.token) token.value = saved.token;
    if (typeof saved.tungs === "number" && saved.tungs >= 0) state.tungs = saved.tungs;
    if (typeof saved.sound === "boolean") state.sound = saved.sound;

    if (!token.value) token.value = makeToken();
    updateSoundButton();
    renderTungs();
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        target: target.value,
        port: port.value,
        duration: duration.value,
        method: method.value,
        token: token.value,
        tungs: state.tungs,
        sound: state.sound,
      }));
    } catch {
      /* private mode, whatever */
    }
  }

  function makeToken() {
    const bytes = new Uint8Array(16);
    if (window.crypto?.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    }
    return "tng_" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  /* ---------- console ---------- */

  function stamp() {
    const d = new Date();
    return d.toTimeString().slice(0, 8);
  }

  function log(text, tone = "") {
    const line = document.createElement("p");
    line.className = "line" + (tone ? " line--" + tone : "");
    line.textContent = text.startsWith(">") ? text : "> " + text;
    consoleOut.appendChild(line);

    while (consoleOut.children.length > 120) {
      consoleOut.removeChild(consoleOut.firstElementChild);
    }
    consoleOut.scrollTop = consoleOut.scrollHeight;
  }

  function setProgress(value) {
    progressFill.style.width = Math.max(0, Math.min(100, value)) + "%";
  }

  function resetProgress() {
    progressFill.style.transition = "none";
    progressFill.style.width = "0%";
    // force reflow so the next width change animates again
    void progressFill.offsetWidth;
    progressFill.style.transition = "";
  }

  function renderTungs() {
    tungCount.textContent = String(state.tungs);
    statTungs.textContent = String(state.tungs);
  }

  function addTungs(amount) {
    state.tungs += amount;
    renderTungs();
    save();
  }

  let toastTimer = 0;
  function showToast(message, ms = 2600) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), ms);
  }

  function shake() {
    panel.classList.remove("is-shaking");
    void panel.offsetWidth;
    panel.classList.add("is-shaking");
    setTimeout(() => panel.classList.remove("is-shaking"), 450);
  }

  /* ---------- sound ---------- */

  function ensureAudio() {
    if (!state.sound) return null;
    if (!state.audio) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      state.audio = new Ctx();
    }
    if (state.audio.state === "suspended") state.audio.resume().catch(() => {});
    return state.audio;
  }

  function knock(ctx, at, pitch = 1) {
    const dur = 0.16;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(190 * pitch, at);
    osc.frequency.exponentialRampToValueAtTime(72 * pitch, at + dur);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.38, at + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + dur + 0.02);

    // short wooden click on top
    const length = Math.floor(ctx.sampleRate * 0.05);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1200;
    filter.Q.value = 1.2;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.16;
    src.connect(filter).connect(noiseGain).connect(ctx.destination);
    src.start(at);
  }

  function playTungs(count = 3) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime + 0.02;
    for (let i = 0; i < count; i += 1) {
      knock(ctx, now + i * 0.19, 1 + i * 0.06);
    }
  }

  function updateSoundButton() {
    soundBtn.textContent = "sound: " + (state.sound ? "on" : "off");
    soundBtn.setAttribute("aria-pressed", String(state.sound));
  }

  /* ---------- validation ---------- */

  function setError(node, message) {
    if (message) {
      node.textContent = message;
      node.hidden = false;
    } else {
      node.hidden = true;
    }
  }

  function validate() {
    const value = target.value.trim();
    let ok = true;
    let firstBad = null;

    if (!value) {
      setError(targetError, "bro. you need a target.");
      target.setAttribute("aria-invalid", "true");
      ok = false;
      firstBad = target;
    } else if (/\s/.test(value)) {
      setError(targetError, "no spaces. this is a target, not a poem.");
      target.setAttribute("aria-invalid", "true");
      ok = false;
      firstBad = target;
    } else {
      setError(targetError, "");
      target.removeAttribute("aria-invalid");
    }

    const p = Number(port.value);
    if (!Number.isFinite(p) || p < 1 || p > 65535 || p % 1 !== 0) {
      port.value = "80";
    }

    const d = Number(duration.value);
    if (!Number.isFinite(d) || d < 1 || d > 3600 || d % 1 !== 0) {
      duration.value = "60";
    }

    if (!token.value.trim()) token.value = makeToken();

    if (firstBad) firstBad.focus();
    return ok;
  }

  /* ---------- the bit that opens your link ---------- */

  function openPayload() {
    let win = null;
    try {
      win = window.open(ATTACK_URL, "_blank");
    } catch {
      win = null;
    }

    if (win) {
      try { win.opener = null; } catch { /* cross-origin, fine */ }
      return true;
    }

    fallback.hidden = false;
    return false;
  }

  /* ---------- fake attack ---------- */

  const timers = [];

  function later(fn, ms) {
    timers.push(setTimeout(fn, ms));
  }

  function clearTimers() {
    while (timers.length) clearTimeout(timers.pop());
  }

  function methodLabel(value) {
    return {
      tung: "tung tung tung",
      sahur: "sahur flood",
      wood: "wooden pipe",
      bat: "bat swing",
    }[value] || value;
  }

  function resetConsole() {
    consoleOut.textContent = "";
    log("tungnet shell ready.", "dim");
    log("waiting for target...", "dim");
  }

  function run(targetValue) {
    if (state.running) {
      showToast("already tungging. calm down.");
      return;
    }

    state.running = true;
    startBtn.disabled = true;
    startBtn.classList.add("is-running");
    startBtn.querySelector(".start__text").textContent = "tunging…";
    startBtn.querySelector(".start__arrow").textContent = "🪵";
    statStatus.textContent = "running";
    statusText.textContent = "attack in progress (not really)";
    mascot.classList.remove("is-swinging");
    void mascot.offsetWidth;
    mascot.classList.add("is-swinging");
    resetProgress();
    resetConsole();

    const host = targetValue;
    const p = port.value;
    const secs = duration.value;
    const key = token.value;
    const attack = methodLabel(method.value);

    playTungs(3);
    log("");
    log(`target      : ${host}:${p}`, "hot");
    log(`method      : ${attack}`);
    log(`duration    : ${secs}s (allegedly)`);
    log(`token       : ${key.slice(0, 10)}…${key.slice(-4)}`);
    log("handshake   : done", "dim");
    addTungs(1);

    later(() => {
      log("resolving target…", "dim");
      log(`port ${p} is open. probably.`, "dim");
      setProgress(14);
    }, 180);

    later(() => {
      log("loading bat…", "");
      log("tung 1/3", "warn");
      addTungs(1);
      setProgress(32);
    }, 420);

    later(() => {
      log("bypassing firewall with a wooden pipe…", "dim");
      log("tung 2/3", "warn");
      addTungs(1);
      setProgress(55);
    }, 700);

    later(() => {
      log("sending the tungs…", "");
      log("tung 3/3", "warn");
      addTungs(3);
      setProgress(78);
    }, 980);

    later(() => {
      log("deploying payload for real…", "hot");
      setProgress(92);
      const opened = openPayload();
      if (opened) {
        log("payload tab opened. do not blink.", "hot");
      } else {
        log("popup blocked. open it manually, coward.", "bad");
        showToast("popup blocked — use the box at the bottom.", 4200);
      }
    }, 1450);

    later(() => {
      setProgress(100);
      log("done. 0 packets sent. 100% tung.", "hot");
      log("thanks for using tungnet. no logs, no crime.", "dim");
      statStatus.textContent = "finished";
      statusText.textContent = "attack complete (it did nothing)";
      quote.textContent = quotes[Math.floor(Math.random() * quotes.length)];
      startBtn.disabled = false;
      startBtn.classList.remove("is-running");
      startBtn.querySelector(".start__text").textContent = "start ddos";
      startBtn.querySelector(".start__arrow").textContent = "▶";
      state.running = false;
      mascot.classList.remove("is-swinging");
      save();
    }, 2400);
  }

  /* ---------- events ---------- */

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (state.running) {
      showToast("it is already tungging. wait.");
      return;
    }
    if (!validate()) {
      shake();
      showToast("fill in the target first, genius.");
      return;
    }
    save();
    run(target.value.trim());
  });

  target.addEventListener("input", () => {
    setError(targetError, "");
    target.removeAttribute("aria-invalid");
    save();
  });

  [port, duration, method, token].forEach((node) => {
    node.addEventListener("input", save);
    node.addEventListener("change", save);
  });

  $("#tokenBtn").addEventListener("click", () => {
    token.value = makeToken();
    save();
    showToast("fresh token. smells like wood.");
  });

  $("#clearBtn").addEventListener("click", () => {
    resetConsole();
    setProgress(0);
  });

  soundBtn.addEventListener("click", () => {
    state.sound = !state.sound;
    updateSoundButton();
    save();
    if (state.sound) playTungs(1);
  });

  fallbackLink.href = ATTACK_URL;

  $("#fallbackClose").addEventListener("click", () => {
    fallback.hidden = true;
  });

  /* window chrome */

  const minimizeBtn = $("#minimizeBtn");
  const maximizeBtn = $("#maximizeBtn");
  const closeBtn = $("#closeBtn");
  const titlebar = $("#titlebar");

  minimizeBtn.addEventListener("click", () => {
    panel.classList.toggle("is-min");
    const minimized = panel.classList.contains("is-min");
    minimizeBtn.textContent = minimized ? "▢" : "–";
    minimizeBtn.setAttribute("aria-label", minimized ? "Restore panel" : "Minimize panel");
    statusText.textContent = minimized ? "minimized (click the bar)" : "ready";
  });

  maximizeBtn.addEventListener("click", () => {
    panel.classList.toggle("is-max");
    const maxed = panel.classList.contains("is-max");
    maximizeBtn.textContent = maxed ? "❐" : "□";
    maximizeBtn.setAttribute("aria-label", maxed ? "Restore size" : "Maximize panel");
  });

  closeBtn.addEventListener("click", () => {
    shake();
    showToast("nice try. the tung never closes.");
  });

  titlebar.addEventListener("click", (event) => {
    if (event.target.closest("button")) return;
    if (panel.classList.contains("is-min")) {
      panel.classList.remove("is-min");
      minimizeBtn.textContent = "–";
      minimizeBtn.setAttribute("aria-label", "Minimize panel");
      statusText.textContent = "ready";
    }
  });

  /* drag the window (title bar) */

  let drag = null;

  titlebar.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    if (event.button !== 0) return;
    const rect = panel.getBoundingClientRect();
    const base = dragBase();
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: base.x,
      baseY: base.y,
      minX: base.x + (80 - rect.width - rect.left),
      maxX: base.x + (window.innerWidth - 80 - rect.left),
      minY: base.y + (12 - rect.top),
      maxY: base.y + (window.innerHeight - 80 - rect.top),
    };
    titlebar.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  titlebar.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const x = clamp(drag.baseX + event.clientX - drag.startX, drag.minX, drag.maxX);
    const y = clamp(drag.baseY + event.clientY - drag.startY, drag.minY, drag.maxY);
    panel.style.translate = `${x}px ${y}px`;
  });

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function endDrag(event) {
    if (!drag || (event && event.pointerId !== drag.pointerId)) return;
    const pointerId = drag.pointerId;
    drag = null;
    try {
      if (titlebar.hasPointerCapture(pointerId)) titlebar.releasePointerCapture(pointerId);
    } catch {
      /* already released */
    }
  }

  titlebar.addEventListener("pointerup", endDrag);
  titlebar.addEventListener("pointercancel", endDrag);

  function dragBase() {
    const current = panel.style.translate || getComputedStyle(panel).translate;
    if (current && current !== "none") {
      const parts = current.split(/[\s,]+/).map(parseFloat);
      return { x: parts[0] || 0, y: parts[1] || 0 };
    }
    return { x: 0, y: 0 };
  }

  titlebar.addEventListener("dblclick", (event) => {
    if (event.target.closest("button")) return;
    panel.style.translate = "";
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth < 520 && panel.style.translate) panel.style.translate = "";
  });

  /* ---------- boot ---------- */

  load();

  if (state.tungs > 0) {
    log(`profile loaded. ${state.tungs} tungs on record.`, "dim");
  }

  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("reduced-motion");
  }
})();
