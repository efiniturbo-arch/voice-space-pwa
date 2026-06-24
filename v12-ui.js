(() => {
  const APP_KEY = 'voice-events-v7';
  const SPLASH_KEY = 'voice-events-splash-v12';
  const VERSION = 'v12.0.0 Themes Pro';

  const loadCss = href => {
    if (!document.querySelector(`link[href^="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${href}?v=12`;
      document.head.appendChild(link);
    }
  };
  loadCss('v12-themes.css');

  const readState = () => {
    try { return JSON.parse(localStorage.getItem(APP_KEY) || 'null'); }
    catch (_) { return null; }
  };
  const writeState = state => localStorage.setItem(APP_KEY, JSON.stringify(state));

  const playLogoSound = (mode = 'space') => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = 0.04;
      master.connect(ctx.destination);
      const start = ctx.currentTime;
      const notes = mode === 'electric' ? [110, 220, 440, 880, 660] : [82, 123, 164, 246, 329];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = mode === 'electric' ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(freq, start + i * 0.18);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.35, start + i * 0.18 + 0.45);
        gain.gain.setValueAtTime(0, start + i * 0.18);
        gain.gain.linearRampToValueAtTime(0.7, start + i * 0.18 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, start + i * 0.18 + 0.8);
        osc.connect(gain).connect(master);
        osc.start(start + i * 0.18);
        osc.stop(start + i * 0.18 + 0.85);
      });
      setTimeout(() => ctx.close(), 2200);
    } catch (_) {}
  };

  const showSixSecondSplash = ({sound = false, force = false} = {}) => {
    if (!force && localStorage.getItem(SPLASH_KEY) === 'shown') return;
    document.getElementById('startupSplash')?.remove();
    const splash = document.createElement('div');
    splash.id = 'startupSplash';
    splash.className = 'water-update-splash';
    splash.innerHTML = `<div class="splash-stars"></div><div class="splash-orbit"></div><div class="splash-earth"></div><div class="splash-flare"></div><div class="splash-core"><div class="splash-logo">VOROP<span>A</span>EV</div><div class="splash-subtitle splash-visible">Digital Transport Systems</div></div>`;
    document.body.prepend(splash);
    if (sound) playLogoSound('space');
    const core = splash.querySelector('.splash-core');
    const phases = [
      `<div class="splash-logo">VOROP<span>A</span>EV</div><div class="splash-subtitle splash-visible">Digital Transport Systems</div>`,
      `<div class="drive-logo-splash">DRIVE<small>in tech</small></div><div class="splash-subtitle splash-visible">Industrial Intelligence</div>`,
      `<div class="voice-logo-splash">Voice Events</div><div class="splash-subtitle splash-visible">Professional Field Journal</div>`
    ];
    [1,2].forEach(index => {
      setTimeout(() => {
        core.classList.add('splash-phase-out');
        setTimeout(() => {
          core.innerHTML = phases[index];
          core.classList.remove('splash-phase-out');
          if (sound && index === 1) playLogoSound('electric');
        }, 520);
      }, index === 1 ? 2150 : 4050);
    });
    setTimeout(() => {
      splash.classList.add('hide');
      localStorage.setItem(SPLASH_KEY, 'shown');
      setTimeout(() => splash.remove(), 700);
    }, 6000);
  };

  const rebuildSixThemes = () => {
    const grid = document.querySelector('.theme-grid');
    if (!grid) return;
    const themes = [
      ['theme-drive-hero', 'DriveInTech', 'Техно стиль, зелёный неон', 'theme-preview-drive'],
      ['theme-standard', 'Космос', 'Космическая глубина', 'theme-preview-cosmos'],
      ['theme-water', 'Капли воды', 'Water Glass Pro', 'theme-preview-water'],
      ['theme-electric', 'Электрический разряд', 'Энергия и молнии', 'theme-preview-electric'],
      ['theme-drive-monitor', 'Drive Monitor', 'Мониторинг транспорта', 'theme-preview-monitor'],
      ['theme-red-nebula', 'Red Nebula', 'Красный ночной режим', 'theme-preview-red']
    ];
    grid.innerHTML = themes.map(([theme,title,note,preview]) => `<button class="theme theme-card" data-theme="${theme}"><span class="theme-preview ${preview}"><i></i></span><span class="theme-copy"><b>${title}</b><small>${note}</small></span><span class="theme-check">✓</span></button>`).join('');
    grid.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        const state = readState();
        if (state?.settings) {
          state.settings.theme = card.dataset.theme;
          state.settings.appVersion = VERSION;
          writeState(state);
        }
        document.body.className = card.dataset.theme;
        requestAnimationFrame(syncActiveTheme);
      });
    });
    syncActiveTheme();
  };

  const syncActiveTheme = () => {
    document.querySelectorAll('.theme-card').forEach(card => card.classList.toggle('active', document.body.classList.contains(card.dataset.theme)));
    const version = document.querySelector('.settings-version .version-row span');
    if (version) version.textContent = VERSION;
  };

  const patchUpdateButton = () => {
    document.querySelectorAll('#updateAppButton').forEach(btn => {
      if (btn.dataset.v12) return;
      btn.dataset.v12 = '1';
      btn.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistration().then(reg => reg?.update());
        if ('caches' in window) caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('voice-events-pwa-')).map(key => caches.delete(key))));
        showSixSecondSplash({sound:true, force:true});
        setTimeout(() => window.location.reload(), 6600);
      }, true);
    });
  };

  const defaultThemeWaterOnce = () => {
    if (localStorage.getItem('voice-events-v12-default-theme')) return;
    const state = readState();
    if (state?.settings) {
      state.settings.theme = 'theme-water';
      state.settings.appVersion = VERSION;
      writeState(state);
      document.body.className = 'theme-water';
      localStorage.setItem('voice-events-v12-default-theme', '1');
    }
  };

  const init = () => {
    defaultThemeWaterOnce();
    rebuildSixThemes();
    syncActiveTheme();
    patchUpdateButton();
  };

  document.addEventListener('DOMContentLoaded', () => {
    init();
    showSixSecondSplash({sound:false});
  });
  setTimeout(init, 500);
  setTimeout(init, 1500);
})();
