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

  function drawSky(ctx, w, h, t, opts) {
    opts = opts || {};
    const k = kind();
    const pn = parisNow();
    const f = dayFactor(pn.minutes);
    const sc = Math.min(w, h) / 600; // échelle des éléments

    // Dégradé du ciel
    let top = mix(NIGHT_TOP, DAY_TOP, f), bot = mix(NIGHT_BOT, DAY_BOT, f);
    const gtop = mix(GREY_NIGHT_TOP, GREY_DAY_TOP, f), gbot = mix(GREY_NIGHT_BOT, GREY_DAY_BOT, f);
    const heavy = Math.max(k.cloud * 0.85, k.storm);
    top = mix(top, gtop, heavy); bot = mix(bot, gbot, heavy);
    if (k.storm) { top = mix(top, mix(STORM_TOP, [6, 8, 14], 1 - f), k.storm * 0.8); bot = mix(bot, mix(STORM_BOT, [16, 20, 28], 1 - f), k.storm * 0.8); }
    const golden = Math.max(0, 1 - Math.abs(f * 2 - 1)) * (1 - heavy * 0.6);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, rgb(top));
    g.addColorStop(0.62, rgb(mix(bot, [255, 150, 80], golden * 0.55)));
    g.addColorStop(1, rgb(mix(bot, [255, 190, 110], golden * 0.4)));
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    // Étoiles
    const starA = (1 - f) * (1 - k.cloud * 0.9);
    if (starA > 0.03) {
      for (let i = 0; i < (opts.small ? 30 : 140); i++) {
        const tw = 0.6 + 0.4 * Math.sin(t * (0.8 + hash(i + 9)) + i);
        ctx.fillStyle = 'rgba(255,255,255,' + (starA * tw * (0.4 + hash(i + 3) * 0.6)).toFixed(3) + ')';
        const s = (hash(i + 5) > 0.9 ? 2.4 : 1.4) * Math.max(1, sc);
        ctx.fillRect(hash(i) * w, hash(i + 1) * h * 0.8, s, s);
      }
    }

    // Soleil ou lune
    const a = arc(pn.minutes);
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
      ctx.fillStyle = 'rgba(' + Math.round(bot[0]) + ',' + Math.round(bot[1]) + ',' + Math.round(bot[2]) + ',' + (0.55 * vis).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(px + r * 0.45, py - r * 0.2, r * 0.9, 0, 7); ctx.fill();
    }

    // Nuages
    const nClouds = Math.round(k.cloud * (opts.small ? 6 : 14)) + 1;
    const cl = mix(mix([120, 130, 150], [255, 255, 255], f), mix([30, 34, 44], [120, 128, 140], f), heavy * 0.8 + k.storm * 0.4);
    for (let i = 0; i < nClouds; i++) {
      const speed = (0.004 + hash(i + 40) * 0.006) * (1 + W.wind / 25);
      const x = (((hash(i + 20) * 1.5 + t * speed) % 1.5) - 0.25) * w;
      const y = h * (0.1 + hash(i + 30) * 0.42);
      const s = (50 + hash(i + 50) * 70) * sc;
      ctx.fillStyle = rgb(cl, 0.35 + k.cloud * 0.5);
      for (let j = 0; j < 5; j++) {
        ctx.beginPath();
        ctx.ellipse(x + (j - 2) * s * 0.42, y + Math.sin(j * 1.7) * s * 0.12, s * (0.5 + 0.18 * Math.sin(j * 2.3 + i)), s * 0.34, 0, 0, 7);
        ctx.fill();
      }
    }

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

    // Éclairs
    if (k.storm) {
      const slot = Math.floor(t / 5), at = t - slot * 5 - hash(slot + 3) * 3.5;
      if (hash(slot) < 0.75 && at > 0 && at < 0.5) {
        const fl = at < 0.12 ? 1 : (at < 0.2 ? 0.2 : (at < 0.28 ? 0.7 : 0));
        ctx.fillStyle = 'rgba(235,240,255,' + (0.5 * fl).toFixed(2) + ')'; ctx.fillRect(0, 0, w, h);
      }
    }
    if (!opts.noPrecip) drawPrecip(ctx, w, h, t, opts);
    return { f, k };
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

  window.Weather = Object.assign(W, { parisDate, isDay() { return dayFactor(parisNow().minutes) > 0.5; }, kind, dayFactor, parisNow, drawSky, drawPrecip, arc, onChange(fn) { W.listeners.push(fn); } });
})();
