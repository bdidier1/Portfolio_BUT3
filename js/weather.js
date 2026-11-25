// Météo en temps réel à Belfort (IUT Nord Franche-Comté) via Open-Meteo, et dessin du ciel.
(function () {
  'use strict';
  const URL_API = 'https://api.open-meteo.com/v1/forecast?latitude=47.6397&longitude=6.8628'
    + '&current=temperature_2m,weather_code,is_day,cloud_cover,wind_speed_10m,precipitation'
    + '&daily=sunrise,sunset&timezone=Europe%2FParis&forecast_days=1';

  const W = {
    ok: false,
    code: 0, temp: null, cloud: 0, wind: 0, precip: 0,
    sunrise: 7 * 60, sunset: 19 * 60,
    listeners: [],
  };

  const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
  const rgb = (c, a) => 'rgba(' + c.map(Math.round).join(',') + ',' + (a === undefined ? 1 : a) + ')';
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  // Heure et minutes à Belfort (Europe/Paris), quel que soit le fuseau du visiteur
  // (mis en cache : le calcul du fuseau horaire est coûteux et le ciel est redessiné souvent)
  const FMT = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  let nowCache = null, nowAt = -1e9;
  function parisNow() {
    const ms = Date.now();
    if (nowCache && ms - nowAt < 250) return nowCache;
    const parts = FMT.formatToParts(new Date(ms));
    const g = (t) => parseInt(parts.find((p) => p.type === t).value, 10) % 24;
    nowAt = ms;
    nowCache = { h: g('hour'), m: g('minute'), s: g('second'), minutes: g('hour') * 60 + g('minute') + g('second') / 60 };
    return nowCache;
  }

  const toMin = (iso) => { const t = iso.split('T')[1].split(':'); return parseInt(t[0], 10) * 60 + parseInt(t[1], 10); };

  // Type de temps déduit du code WMO
  function kind() {
    const c = W.code;
    if (c === 0) return { id: 'clear', label: 'Ciel dégagé', cloud: 0.05, rain: 0, snow: 0, fog: 0, storm: 0 };
    if (c === 1) return { id: 'clear', label: 'Plutôt dégagé', cloud: 0.2, rain: 0, snow: 0, fog: 0, storm: 0 };
    if (c === 2) return { id: 'partly', label: 'Partiellement nuageux', cloud: 0.55, rain: 0, snow: 0, fog: 0, storm: 0 };
    if (c === 3) return { id: 'cloudy', label: 'Couvert', cloud: 0.9, rain: 0, snow: 0, fog: 0, storm: 0 };
    if (c === 45 || c === 48) return { id: 'fog', label: 'Brouillard', cloud: 0.8, rain: 0, snow: 0, fog: 1, storm: 0 };
    if (c >= 51 && c <= 57) return { id: 'drizzle', label: 'Bruine', cloud: 0.85, rain: 0.35, snow: 0, fog: 0.2, storm: 0 };
    if (c >= 61 && c <= 65) return { id: 'rain', label: c === 61 ? 'Pluie faible' : (c === 63 ? 'Pluie' : 'Forte pluie'), cloud: 0.92, rain: c === 61 ? 0.5 : (c === 63 ? 0.75 : 1), snow: 0, fog: 0, storm: 0 };
    if (c === 66 || c === 67) return { id: 'rain', label: 'Pluie verglaçante', cloud: 0.92, rain: 0.8, snow: 0.2, fog: 0, storm: 0 };
    if (c >= 71 && c <= 77) return { id: 'snow', label: 'Neige', cloud: 0.88, rain: 0, snow: c === 71 ? 0.5 : 1, fog: 0.1, storm: 0 };
    if (c >= 80 && c <= 82) return { id: 'rain', label: 'Averses', cloud: 0.9, rain: c === 80 ? 0.6 : 1, snow: 0, fog: 0, storm: 0 };
    if (c === 85 || c === 86) return { id: 'snow', label: 'Averses de neige', cloud: 0.9, rain: 0, snow: 0.9, fog: 0, storm: 0 };
    if (c >= 95) return { id: 'storm', label: 'Orage', cloud: 1, rain: 1, snow: 0, fog: 0, storm: 1 };
    return { id: 'cloudy', label: 'Variable', cloud: 0.5, rain: 0, snow: 0, fog: 0, storm: 0 };
  }

  // 0 = nuit, 1 = plein jour (transition autour du lever et du coucher du soleil)
  function dayFactor(minutes) {
    const up = smooth((minutes - (W.sunrise - 30)) / 60);
    const down = smooth((minutes - (W.sunset - 30)) / 60);
    return up * (1 - down);
  }

  // Position (0..1) du soleil ou de la lune sur son arc
  function arc(minutes) {
    const day = minutes >= W.sunrise && minutes <= W.sunset;
    if (day) return { sun: true, p: (minutes - W.sunrise) / (W.sunset - W.sunrise) };
    const nightLen = 1440 - (W.sunset - W.sunrise);
    const since = minutes > W.sunset ? minutes - W.sunset : minutes + 1440 - W.sunset;
    return { sun: false, p: since / nightLen };
  }

  const DAY_TOP = [38, 118, 214], DAY_BOT = [158, 208, 245];
  const NIGHT_TOP = [3, 6, 16], NIGHT_BOT = [14, 26, 52];
  const GREY_DAY_TOP = [96, 112, 130], GREY_DAY_BOT = [176, 188, 200];
  const GREY_NIGHT_TOP = [10, 14, 22], GREY_NIGHT_BOT = [26, 34, 46];
  const STORM_TOP = [40, 46, 58], STORM_BOT = [88, 96, 108];

  // ---------- Éléments du ciel : chacun est dessiné par une petite fonction, réutilisée par drawSky et par createSky ----------
  function skyState() {
    const k = kind(), pn = parisNow(), f = dayFactor(pn.minutes);
    return { k, pn, f, heavy: Math.max(k.cloud * 0.85, k.storm) };
  }
  function skyColors(st) {
    const { k, f, heavy } = st;
    let top = mix(NIGHT_TOP, DAY_TOP, f), bot = mix(NIGHT_BOT, DAY_BOT, f);
    const gtop = mix(GREY_NIGHT_TOP, GREY_DAY_TOP, f), gbot = mix(GREY_NIGHT_BOT, GREY_DAY_BOT, f);
    top = mix(top, gtop, heavy); bot = mix(bot, gbot, heavy);
    if (k.storm) { top = mix(top, mix(STORM_TOP, [6, 8, 14], 1 - f), k.storm * 0.8); bot = mix(bot, mix(STORM_BOT, [16, 20, 28], 1 - f), k.storm * 0.8); }
    const golden = Math.max(0, 1 - Math.abs(f * 2 - 1)) * (1 - heavy * 0.6);
    const cl = mix(mix([120, 130, 150], [255, 255, 255], f), mix([30, 34, 44], [120, 128, 140], f), heavy * 0.8 + k.storm * 0.4);
    return { top, bot, golden, cl };
  }
  function paintGradient(ctx, w, h, col) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, rgb(col.top));
    g.addColorStop(0.62, rgb(mix(col.bot, [255, 150, 80], col.golden * 0.55)));
    g.addColorStop(1, rgb(mix(col.bot, [255, 190, 110], col.golden * 0.4)));
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  function paintStars(ctx, w, h, t, st, sc, opts) {
    const starA = (1 - st.f) * (1 - st.k.cloud * 0.9);
    if (starA <= 0.03) return;
    for (let i = 0; i < (opts.small ? 30 : 140); i++) {
      const tw = 0.6 + 0.4 * Math.sin(t * (0.8 + hash(i + 9)) + i);
      ctx.fillStyle = 'rgba(255,255,255,' + (starA * tw * (0.4 + hash(i + 3) * 0.6)).toFixed(3) + ')';
      const s = (hash(i + 5) > 0.9 ? 2.4 : 1.4) * Math.max(1, sc);
      ctx.fillRect(hash(i) * w, hash(i + 1) * h * 0.8, s, s);
    }
  }
  function paintBody(ctx, w, h, st, col, sc) {
    const { k, f } = st;
    const a = arc(st.pn.minutes);
    const px = w * (0.1 + 0.8 * a.p), py = h * (0.78 - Math.sin(a.p * Math.PI) * 0.55);
    const vis = (1 - k.cloud * 0.75) * (1 - k.fog * 0.5);
    if (a.sun && f > 0.01) {
      const r = 34 * sc;
      const gl = ctx.createRadialGradient(px, py, 0, px, py, r * 5);
      gl.addColorStop(0, 'rgba(255,236,170,' + (0.55 * vis).toFixed(3) + ')'); gl.addColorStop(1, 'rgba(255,236,170,0)');
      ctx.fillStyle = gl; ctx.fillRect(px - r * 5, py - r * 5, r * 10, r * 10);
      ctx.fillStyle = 'rgba(255,244,200,' + (0.4 + 0.6 * vis).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill();
    } else if (!a.sun) {
      const r = 26 * sc;
      const gl = ctx.createRadialGradient(px, py, 0, px, py, r * 4);
      gl.addColorStop(0, 'rgba(210,225,255,' + (0.3 * vis).toFixed(3) + ')'); gl.addColorStop(1, 'rgba(210,225,255,0)');
      ctx.fillStyle = gl; ctx.fillRect(px - r * 4, py - r * 4, r * 8, r * 8);
      ctx.fillStyle = 'rgba(245,247,225,' + (0.35 + 0.65 * vis).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(' + Math.round(col.bot[0]) + ',' + Math.round(col.bot[1]) + ',' + Math.round(col.bot[2]) + ',' + (0.55 * vis).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(px + r * 0.45, py - r * 0.2, r * 0.9, 0, 7); ctx.fill();
    }
  }
  // Un nuage : cinq ellipses qui se chevauchent, centrées sur (cx, cy), de taille s
  function paintCloudShape(ctx, i, s, cx, cy, fill) {
    ctx.fillStyle = fill;
    for (let j = 0; j < 5; j++) {
      ctx.beginPath();
      ctx.ellipse(cx + (j - 2) * s * 0.42, cy + Math.sin(j * 1.7) * s * 0.12, s * (0.5 + 0.18 * Math.sin(j * 2.3 + i)), s * 0.34, 0, 0, 7);
      ctx.fill();
    }
  }
  function cloudSpecs(st, opts) {
    const n = Math.round(st.k.cloud * (opts.small ? 6 : 14)) + 1, out = [];
    for (let i = 0; i < n; i++) out.push({ i, speed: (0.004 + hash(i + 40) * 0.006) * (1 + W.wind / 25), x0: hash(i + 20) * 1.5, y: 0.1 + hash(i + 30) * 0.42, s: 50 + hash(i + 50) * 70 });
    return out;
  }
  function paintFront(ctx, w, h, st) {
    const { k, f, heavy } = st;
    // Silhouette de collines au loin
    const hillBase = mix([4, 8, 14], [40, 70, 60], f), hillGrey = mix(hillBase, [70, 78, 86], heavy * 0.6 * f);
    ctx.fillStyle = rgb(hillGrey);
    ctx.beginPath(); ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) ctx.lineTo(x, h * 0.9 - Math.sin(x / w * 5 + 1) * h * 0.04 - Math.sin(x / w * 11) * h * 0.015);
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    // Brouillard
    if (k.fog) {
      const fg = ctx.createLinearGradient(0, 0, 0, h);
      fg.addColorStop(0, rgb(mix([40, 46, 58], [220, 226, 232], f), 0.55 * k.fog));
      fg.addColorStop(1, rgb(mix([60, 66, 78], [235, 238, 242], f), 0.8 * k.fog));
      ctx.fillStyle = fg; ctx.fillRect(0, 0, w, h);
    }
  }
  function paintLightning(ctx, w, h, t, st) {
    if (!st.k.storm) return;
    const slot = Math.floor(t / 5), at = t - slot * 5 - hash(slot + 3) * 3.5;
    if (hash(slot) < 0.75 && at > 0 && at < 0.5) {
      const fl = at < 0.12 ? 1 : (at < 0.2 ? 0.2 : (at < 0.28 ? 0.7 : 0));
      ctx.fillStyle = 'rgba(235,240,255,' + (0.5 * fl).toFixed(2) + ')'; ctx.fillRect(0, 0, w, h);
    }
  }

  // Ciel complet dessiné d'un coup (texture de la fenêtre de la chambre)
  function drawSky(ctx, w, h, t, opts) {
    opts = opts || {};
    const st = skyState(), col = skyColors(st), sc = Math.min(w, h) / 600;
    paintGradient(ctx, w, h, col);
    paintStars(ctx, w, h, t, st, sc, opts);
    paintBody(ctx, w, h, st, col, sc);
    cloudSpecs(st, opts).forEach((c) => {
      const x = (((c.x0 + t * c.speed) % 1.5) - 0.25) * w;
      paintCloudShape(ctx, c.i, c.s * sc, x, h * c.y, rgb(col.cl, 0.35 + st.k.cloud * 0.5));
    });
    paintFront(ctx, w, h, st);
    paintLightning(ctx, w, h, t, st);
    if (!opts.noPrecip) drawPrecip(ctx, w, h, t, opts);
    return { f: st.f, k: st.k };
  }

  // Ciel du fond de page : fluide et léger. Les nuages sont dessinés une seule fois dans de petites images, puis
  // simplement déplacés à chaque image (quelques drawImage) ; le dégradé, le soleil / la lune, les collines et le
  // brouillard sont gardés en mémoire et ne sont redessinés que s'ils changent (taille, météo, heure, étoiles la nuit).
  function createSky(canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d', { alpha: false });
    const mk = () => { const c = document.createElement('canvas'); return { c, x: c.getContext('2d') }; };
    const back = mk(), front = mk();
    let w = 0, h = 0, dirty = true, builtAt = -1e9, backAt = -1e9, last = 0, clouds = [], st = null;
    W.listeners.push(() => { dirty = true; });                 // la météo vient d'être mise à jour
    function resize(nw, nh) {
      w = canvas.width = nw; h = canvas.height = nh;
      back.c.width = front.c.width = nw; back.c.height = front.c.height = nh;
      dirty = true;
    }
    // Position des nuages à l'instant t (secondes) : même mouvement que drawSky
    function seek(t) { clouds.forEach((c) => { c.pos = (c.x0 + t * c.speed) % 1.5; }); }
    function rebuild(now) {
      st = skyState();
      const col = skyColors(st), sc = Math.min(w, h) / 600;
      const old = clouds, specs = cloudSpecs(st, opts);
      clouds = specs.map((c, k) => {
        const S = c.s * sc, sw = Math.ceil(S * 3.1) + 4, sh = Math.ceil(S * 0.95) + 4;
        const sp = document.createElement('canvas'); sp.width = sw; sp.height = sh;
        paintCloudShape(sp.getContext('2d'), c.i, S, sw / 2, sh / 2, rgb(col.cl, 0.35 + st.k.cloud * 0.5));
        return { sp, ox: sw / 2, oy: sh / 2, speed: c.speed, y: h * c.y, x0: c.x0, pos: old[k] ? old[k].pos : c.x0 };
      });
      front.x.clearRect(0, 0, w, h); paintFront(front.x, w, h, st);
      builtAt = now; backAt = -1e9; dirty = false;
    }
    // Fond : dégradé + étoiles + soleil / lune. De jour il ne change presque pas ; la nuit les étoiles scintillent.
    function paintBack(now, t) {
      const col = skyColors(st), sc = Math.min(w, h) / 600;
      paintGradient(back.x, w, h, col);
      paintStars(back.x, w, h, t, st, sc, opts);
      paintBody(back.x, w, h, st, col, sc);
      backAt = now;
    }
    function frame(now) {
      if (!w || !h) return;
      const t = now / 1000, dt = Math.min(0.25, last ? (now - last) / 1000 : 0); last = now;
      if (dirty || now - builtAt > 20000) { const first = !clouds.length; rebuild(now); if (first) seek(t); }
      const night = (1 - st.f) * (1 - st.k.cloud * 0.9) > 0.03;
      if (backAt < 0 || now - backAt > (night ? 260 : 20000)) paintBack(now, t);
      ctx.drawImage(back.c, 0, 0);
      for (let i = 0; i < clouds.length; i++) {
        const c = clouds[i];
        c.pos = (c.pos + c.speed * dt) % 1.5;
        ctx.drawImage(c.sp, (c.pos - 0.25) * w - c.ox, c.y - c.oy);
      }
      ctx.drawImage(front.c, 0, 0);
      paintLightning(ctx, w, h, t, st);
    }
    return { resize, frame, seek, invalidate() { dirty = true; } };
  }

  // Pluie et neige : dessinées à chaque image, sur une couche à part, pour un mouvement fluide
  function drawPrecip(ctx, w, h, t, opts) {
    opts = opts || {};
    const k = kind();
    if (!k.rain && !k.snow) return false;
    const f = dayFactor(parisNow().minutes);
    const sc = Math.min(w, h) / 600;
    const dens = opts.density || 1;
    if (k.rain) {
      // Gouttes en traits fins, vitesse modérée : chaque goutte avance de quelques pixels par image
      const n = Math.round(k.rain * (opts.small ? 60 : 200) * dens);
      const len = 18 * Math.max(0.6, sc), slant = 0.18;
      ctx.lineCap = 'round';
      for (let layer = 0; layer < 2; layer++) {
        ctx.strokeStyle = 'rgba(190,210,235,' + ((layer ? 0.22 : 0.4) + 0.2 * f).toFixed(2) + ')';
        ctx.lineWidth = Math.max(1, sc * (layer ? 0.8 : 1.3));
        ctx.beginPath();
        for (let i = layer; i < n; i += 2) {
          const sp = (layer ? 0.32 : 0.48) + hash(i + 7) * 0.18;          // hauteurs d'écran par seconde
          const y = ((hash(i + 2) + t * sp) % 1) * (h + len * 2) - len;
          const x = ((hash(i) * (w + 120) - 60 - y * slant) % (w + 120) + w + 120) % (w + 120) - 60;
          const l = len * (layer ? 0.7 : 1);
          ctx.moveTo(x, y); ctx.lineTo(x - l * slant, y + l);
        }
        ctx.stroke();
      }
    }
    if (k.snow) {
      const n = Math.round(k.snow * (opts.small ? 40 : 160) * dens);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < n; i++) {
        const sp = 0.05 + hash(i + 7) * 0.06;
        const y = ((hash(i + 2) + t * sp) % 1) * (h + 20) - 10;
        const x = hash(i) * w + Math.sin(t * 0.8 + i) * 14 * sc;
        const r = (1.2 + hash(i + 4) * 2.2) * Math.max(1, sc);
        ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      }
    }
    return true;
  }

  function update(raw) {
    const c = raw.current, d = raw.daily;
    W.code = c.weather_code; W.temp = c.temperature_2m; W.cloud = c.cloud_cover; W.wind = c.wind_speed_10m; W.precip = c.precipitation;
    W.sunrise = toMin(d.sunrise[0]); W.sunset = toMin(d.sunset[0]);
    W.ok = true;
    W.listeners.forEach((fn) => fn());
  }

  function load() {
    fetch(URL_API).then((r) => r.json()).then(update).catch(() => { W.listeners.forEach((fn) => fn()); });
  }
  load();
  setInterval(load, 10 * 60 * 1000);

  function parisDate() {
    return new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  }

  window.Weather = Object.assign(W, { parisDate, isDay() { return dayFactor(parisNow().minutes) > 0.5; }, kind, dayFactor, parisNow, drawSky, createSky, drawPrecip, arc, onChange(fn) { W.listeners.push(fn); } });
})();
