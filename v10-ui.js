(() => {
  const APP_KEY = 'voice-events-v7';
  const APP_VERSION = 'v11.0.0 Water Glass Pro';

  const loadCss = href => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  };
  loadCss('splash.css');
  loadCss('v10-ui.css');

  const $ = id => document.getElementById(id);
  const readState = () => {
    try { return JSON.parse(localStorage.getItem(APP_KEY) || 'null'); }
    catch (_) { return null; }
  };
  const writeState = state => localStorage.setItem(APP_KEY, JSON.stringify(state));

  const patchStorage = () => {
    if (window.__voiceEventsV11StoragePatch) return;
    window.__voiceEventsV11StoragePatch = true;
    const originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = (key, value) => {
      if (key === APP_KEY) {
        try {
          const previous = JSON.parse(localStorage.getItem(APP_KEY) || '{}');
          const next = JSON.parse(value);
          next.settings = next.settings || {};
          const prevSettings = previous.settings || {};
          if (prevSettings.login && !next.settings.login) next.settings.login = prevSettings.login;
          if (prevSettings.password && !next.settings.password) next.settings.password = prevSettings.password;
          next.settings.appVersion = APP_VERSION;
          value = JSON.stringify(next);
        } catch (_) {}
      }
      originalSetItem(key, value);
    };
  };

  const setTransportTab = () => {
    const settingsButton = document.querySelector('#nav button[data-go="settings"], #nav button[data-go="transport"]');
    if (!settingsButton) return;
    settingsButton.dataset.go = 'transport';
    settingsButton.setAttribute('aria-label', 'Транспорт');
    const icon = settingsButton.querySelector('.nav-icon');
    const label = settingsButton.querySelector('.nav-label');
    if (icon) icon.textContent = '▤';
    if (label) label.textContent = 'Транспорт';
  };

  const ensureTransportScreen = () => {
    if ($('transport')) return;
    const main = document.createElement('main');
    main.id = 'transport';
    main.className = 'screen hidden';
    main.innerHTML = `<section class="panel transport-panel"><h1>Транспорт</h1><p>Мониторинг техники и статусов</p><div class="transport-grid">
      <div class="transport-card"><span class="transport-icon">▣</span><div><b>ТС-001 / Буровая</b><div class="transport-state transport-online">Онлайн · 12 км/ч</div></div><span>›</span></div>
      <div class="transport-card"><span class="transport-icon">⛽</span><div><b>Топливо</b><div class="transport-state">4 бака · 72%</div></div><span>›</span></div>
      <div class="transport-card"><span class="transport-icon">⌖</span><div><b>Геозоны</b><div class="transport-state">Объект №23 · в зоне</div></div><span>›</span></div>
      <div class="transport-card"><span class="transport-icon">!</span><div><b>События транспорта</b><div class="transport-state">Нет критичных уведомлений</div></div><span>›</span></div>
    </div></section>`;
    const nav = $('nav');
    document.body.insertBefore(main, nav);
  };

  const patchGo = () => {
    if (window.__voiceEventsV11GoPatch) return;
    window.__voiceEventsV11GoPatch = true;
    document.addEventListener('click', event => {
      const button = event.target.closest('#nav button[data-go="transport"]');
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      ['events','tasks','chat','docs','settings','transport'].forEach(id => {
        const el = $(id);
        if (el) el.classList.toggle('hidden', id !== 'transport');
      });
      document.querySelectorAll('#nav button').forEach(btn => btn.classList.toggle('active', btn === button));
      const subtitle = $('subtitle');
      if (subtitle) subtitle.textContent = 'Транспорт';
    }, true);
  };

  const enhanceAvatar = () => {
    const avatar = $('avatar');
    const profile = $('profile');
    if (!avatar || !profile || avatar.dataset.v11Avatar) return;
    avatar.dataset.v11Avatar = '1';
    avatar.setAttribute('aria-label', 'Профиль и настройки');
    avatar.addEventListener('click', () => {
      avatar.classList.toggle('gear-mode');
      setTimeout(() => avatar.classList.remove('gear-mode'), 900);
    });
    if (!profile.querySelector('.profile-login')) {
      const login = document.createElement('div');
      login.className = 'profile-login';
      login.innerHTML = `<label>Логин<input id="profileLogin" autocomplete="username" placeholder="Введите логин"></label><label>Пароль<input id="profilePassword" autocomplete="current-password" type="password" placeholder="Введите пароль"></label>`;
      const firstButton = profile.querySelector('button');
      profile.insertBefore(login, firstButton);
    }
  };

  const rebuildThemeCards = () => {
    const grid = document.querySelector('.theme-grid');
    if (!grid || grid.dataset.v11Themes) return;
    grid.dataset.v11Themes = '1';
    const themes = [
      ['theme-drive-hero', 'DriveInTech', 'Корпоративное стекло и техно-свет'],
      ['theme-standard', 'Космос', 'Космическая глубина'],
      ['theme-water', 'Капли воды', 'Water Glass Pro'],
      ['theme-electric', 'Электрический разряд', 'Синий и жёлтый заряд'],
      ['theme-red-nebula', 'Red Nebula', 'Красное свечение и danger UI']
    ];
    const byTheme = new Map(Array.from(grid.querySelectorAll('.theme-card')).map(card => [card.dataset.theme, card]));
    themes.forEach(([theme, title, note], index) => {
      const card = byTheme.get(theme);
      if (!card) return;
      card.hidden = false;
      card.style.display = '';
      card.style.order = String(index + 1);
      const titleEl = card.querySelector('.theme-copy b');
      const noteEl = card.querySelector('.theme-copy small');
      if (titleEl) titleEl.textContent = title;
      if (noteEl) noteEl.textContent = note;
      grid.appendChild(card);
    });
    const monitor = byTheme.get('theme-drive-monitor');
    if (monitor) monitor.hidden = true;
  };

  const syncCredentials = () => {
    const state = readState();
    const login = state?.settings?.login || '';
    const password = state?.settings?.password || '';
    ['profileLogin','settingsLogin'].forEach(id => { const el = $(id); if (el && el.value !== login) el.value = login; });
    ['profilePassword','settingsPassword'].forEach(id => { const el = $(id); if (el && el.value !== password) el.value = password; });
  };

  const saveCredentials = () => {
    const state = readState();
    if (!state?.settings) return;
    const login = $('settingsLogin')?.value ?? $('profileLogin')?.value ?? '';
    const password = $('settingsPassword')?.value ?? $('profilePassword')?.value ?? '';
    state.settings.login = login;
    state.settings.password = password;
    state.settings.appVersion = APP_VERSION;
    writeState(state);
    syncCredentials();
  };

  const showUpdateSplash = () => {
    document.getElementById('startupSplash')?.remove();
    const splash = document.createElement('div');
    splash.id = 'startupSplash';
    splash.className = 'water-update-splash';
    splash.innerHTML = `<div class="splash-stars"></div><div class="splash-orbit"></div><div class="splash-earth"></div><div class="splash-flare"></div><div class="splash-core"><div class="splash-logo">VOROP<span>A</span>EV</div><div class="splash-subtitle">Digital Transport Systems</div></div>`;
    document.body.prepend(splash);
    const core = splash.querySelector('.splash-core');
    const phases = [
      `<div class="splash-logo">VOROP<span>A</span>EV</div><div class="splash-subtitle">Digital Transport Systems</div>`,
      `<div class="drive-logo-splash">DRIVE<small>in tech</small></div><div class="splash-subtitle splash-visible">Industrial Intelligence</div>`,
      `<div class="voice-logo-splash">Voice Events</div><div class="splash-subtitle splash-visible">Water Glass Pro</div>`
    ];
    phases.slice(1).forEach((html, index) => {
      setTimeout(() => {
        core.classList.add('splash-phase-out');
        setTimeout(() => {
          core.innerHTML = html;
          core.classList.remove('splash-phase-out');
        }, 420);
      }, 1350 + index * 1350);
    });
    setTimeout(() => {
      splash.classList.add('hide');
      setTimeout(() => splash.remove(), 650);
    }, 4700);
  };

  const forceAppUpdate = () => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistration().then(reg => reg?.update());
    if ('caches' in window) caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('voice-events-pwa-')).map(key => caches.delete(key))));
    showUpdateSplash();
    setTimeout(() => window.location.reload(), 5200);
  };

  const enhanceSettings = () => {
    const panel = document.querySelector('#settings .panel');
    if (!panel) return;
    if (!panel.querySelector('.settings-credentials')) {
      const credentials = document.createElement('div');
      credentials.className = 'settings-credentials';
      credentials.innerHTML = `<h2>Доступ</h2><div class="form-group"><label>Логин<input id="settingsLogin" autocomplete="username" placeholder="Введите логин"></label></div><div class="form-group"><label>Пароль<input id="settingsPassword" autocomplete="current-password" type="password" placeholder="Введите пароль"></label></div>`;
      const designTitle = Array.from(panel.querySelectorAll('h2')).find(h => h.textContent.includes('Дизайн'));
      panel.insertBefore(credentials, designTitle || null);
      credentials.querySelectorAll('input').forEach(input => input.addEventListener('change', saveCredentials));
    }
    if (!panel.querySelector('.settings-version')) {
      const version = document.createElement('div');
      version.className = 'settings-version';
      version.innerHTML = `<div class="version-row"><b>Версия приложения</b><span>${APP_VERSION}</span></div><button id="updateAppButton" class="primary" type="button">Обновить приложение</button>`;
      panel.appendChild(version);
      version.querySelector('#updateAppButton').addEventListener('click', forceAppUpdate);
    }
    ['profileLogin','profilePassword'].forEach(id => $(id)?.addEventListener('change', saveCredentials));
    syncCredentials();
  };

  const init = () => {
    patchStorage();
    setTransportTab();
    ensureTransportScreen();
    patchGo();
    enhanceAvatar();
    rebuildThemeCards();
    enhanceSettings();
  };

  document.addEventListener('DOMContentLoaded', init);
  setTimeout(init, 300);
  setTimeout(init, 1200);
})();
