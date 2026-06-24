(() => {
  const VERSION = "v13.0.0 UI Kit";
  const SPLASH_KEY = "voice-events-splash-v13";
  const themeMap = {
    "theme-drive-hero": "driveintech",
    "theme-standard": "cosmos",
    "theme-water": "water",
    "theme-electric": "electric",
    "theme-drive-monitor": "drive_monitor",
    "theme-red-nebula": "red_nebula"
  };
  const sectionMap = { events: "events", tasks: "tasks", chat: "chat", docs: "documents", transport: "transport" };
  let manifest;

  const activeThemeClass = () => Object.keys(themeMap).find(name => document.body.classList.contains(name)) || "theme-standard";
  const themeRecord = className => manifest?.themes.find(theme => theme.id === themeMap[className]);
  const setThemeColor = theme => {
    const colors = {
      driveintech: "#020604", cosmos: "#030514", water: "#03131d",
      electric: "#020817", drive_monitor: "#050908", red_nebula: "#0b0106"
    };
    document.querySelector('meta[name="theme-color"]').content = colors[theme] || "#050816";
  };

  const syncTheme = () => {
    const className = activeThemeClass();
    const theme = themeRecord(className);
    if (!theme) return;
    document.body.style.setProperty("--v13-background", `url("${theme.background}")`);
    document.body.style.setProperty("--v13-event-card", `url("${theme.event_card}")`);
    setThemeColor(theme.id);
    document.querySelectorAll("#nav button[data-go]").forEach(button => {
      const section = sectionMap[button.dataset.go];
      if (!section || !theme.nav[section]) return;
      const normal = button.querySelector(".v13-nav-normal");
      const active = button.querySelector(".v13-nav-active");
      if (!normal || !active) return;
      normal.src = theme.nav[section].normal;
      active.src = theme.nav[section].active;
    });
    document.querySelectorAll(".theme-card").forEach(card => card.classList.toggle("active", card.dataset.theme === className));
  };

  const buildThemeGrid = () => {
    const grid = document.getElementById("themeGrid");
    if (!grid || !manifest) return;
    const classById = Object.fromEntries(Object.entries(themeMap).map(([className, id]) => [id, className]));
    grid.innerHTML = manifest.themes.map(theme => `<button class="theme-card" type="button" data-theme="${classById[theme.id]}">
      <span class="theme-preview" style="background-image:url('${theme.home_mockup}')"></span>
      <span class="theme-copy"><b>${theme.title}</b><small>${({
        driveintech: "Объёмные техно-сферы",
        cosmos: "Планеты и космический неон",
        water: "Прозрачные капли Water Glass",
        electric: "Шаровые молнии и заряд",
        drive_monitor: "Металл и приборные акценты",
        red_nebula: "Красные планеты без колец"
      })[theme.id]}</small></span><span class="theme-check">✓</span>
    </button>`).join("");
    grid.querySelectorAll(".theme-card").forEach(card => card.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("voice-events-theme-change", { detail: { theme: card.dataset.theme } }));
      requestAnimationFrame(syncTheme);
    }));
    syncTheme();
  };

  const playSound = mode => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const context = new AudioContext();
      const master = context.createGain();
      master.gain.value = 0.035;
      master.connect(context.destination);
      const notes = mode === "electric" ? [110, 220, 440, 880, 660] : [82, 123, 164, 246, 329];
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime + index * .16;
        oscillator.type = mode === "electric" ? "sawtooth" : "sine";
        oscillator.frequency.setValueAtTime(frequency, start);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.3, start + .5);
        gain.gain.setValueAtTime(.001, start);
        gain.gain.linearRampToValueAtTime(.6, start + .04);
        gain.gain.exponentialRampToValueAtTime(.001, start + .75);
        oscillator.connect(gain).connect(master);
        oscillator.start(start);
        oscillator.stop(start + .8);
      });
      setTimeout(() => context.close(), 1800);
    } catch (_) {}
  };

  const ensureSplash = () => {
    let splash = document.getElementById("startupSplash");
    if (splash) return splash;
    splash = document.createElement("div");
    splash.id = "startupSplash";
    splash.className = "startup-splash";
    splash.setAttribute("aria-label", "Запуск Voice Events");
    splash.innerHTML = '<div class="splash-atmosphere"></div><div id="splashStage" class="splash-stage"><div class="splash-wordmark">VOROP<span>A</span>EV</div></div>';
    document.body.prepend(splash);
    return splash;
  };

  const showSplash = ({ force = false, sound = false, reload = false } = {}) => {
    if (!force && localStorage.getItem(SPLASH_KEY) === "shown") {
      document.getElementById("startupSplash")?.remove();
      return;
    }
    const splash = ensureSplash();
    const stage = splash.querySelector("#splashStage");
    splash.classList.remove("hide");
    const phases = [
      [0, '<div class="splash-wordmark">VOROP<span>A</span>EV</div>'],
      [2000, '<div class="splash-subtitle">Digital Transport Systems</div>'],
      [3000, '<div class="splash-drive">DRIVE<small>in tech</small></div>'],
      [4500, '<div class="splash-voice">Voice Events</div>'],
      [5500, '<div class="splash-subtitle">Полевой журнал событий</div>']
    ];
    phases.forEach(([time, html], index) => setTimeout(() => {
      stage.classList.add("out");
      setTimeout(() => {
        stage.innerHTML = html;
        stage.classList.remove("out");
        if (sound && index === 2) playSound("electric");
      }, index ? 240 : 0);
    }, time));
    if (sound) playSound("space");
    setTimeout(() => {
      splash.classList.add("hide");
      localStorage.setItem(SPLASH_KEY, "shown");
      setTimeout(() => {
        if (reload) location.reload();
        else splash.remove();
      }, 520);
    }, 6000);
  };

  const updateApp = async () => {
    ensureSplash().classList.remove("hide");
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration?.update();
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter(key => key.startsWith("voice-events-pwa-")).map(key => caches.delete(key)));
      }
    } finally {
      showSplash({ force: true, sound: true, reload: true });
    }
  };

  const init = async () => {
    try {
      const response = await fetch("./asset-manifest.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`UI Kit manifest: ${response.status}`);
      manifest = await response.json();
      buildThemeGrid();
      syncTheme();
    } catch (error) {
      console.error("Не удалось загрузить UI Kit v13", error);
    }
    document.getElementById("updateAppButton")?.addEventListener("click", updateApp);
    showSplash();
  };

  document.addEventListener("voice-events-state-applied", syncTheme);
  new MutationObserver(syncTheme).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  document.addEventListener("DOMContentLoaded", init);
  window.voiceEventsV13 = { version: VERSION, syncTheme };
})();
