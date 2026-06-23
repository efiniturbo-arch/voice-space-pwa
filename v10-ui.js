(() => {
  const loadCss = href => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  };
  loadCss('v10-ui.css');

  const $ = id => document.getElementById(id);

  const setTransportTab = () => {
    const settingsButton = document.querySelector('#nav button[data-go="settings"]');
    if (!settingsButton || settingsButton.dataset.go === 'transport') return;
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
    main.innerHTML = `<section class="panel"><h1>Транспорт</h1><p>Мониторинг техники и статусов</p><div class="transport-grid">
      <div class="transport-card"><span class="transport-icon">🚚</span><div><b>ТС-001 / Буровая</b><div class="transport-state transport-online">Онлайн · 12 км/ч</div></div><span>›</span></div>
      <div class="transport-card"><span class="transport-icon">⛽</span><div><b>Топливо</b><div class="transport-state">4 бака · 72%</div></div><span>›</span></div>
      <div class="transport-card"><span class="transport-icon">📍</span><div><b>Геозоны</b><div class="transport-state">Объект №23 · в зоне</div></div><span>›</span></div>
      <div class="transport-card"><span class="transport-icon">⚠</span><div><b>События транспорта</b><div class="transport-state">Нет критичных уведомлений</div></div><span>›</span></div>
    </div></section>`;
    const nav = $('nav');
    document.body.insertBefore(main, nav);
  };

  const patchGo = () => {
    if (window.__voiceEventsV10GoPatch) return;
    window.__voiceEventsV10GoPatch = true;
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
    if (!avatar || !profile || avatar.dataset.v10Avatar) return;
    avatar.dataset.v10Avatar = '1';
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
    if (!grid || grid.dataset.v10Themes) return;
    grid.dataset.v10Themes = '1';
    grid.innerHTML = `
      <button class="theme theme-card" data-theme="theme-drive-hero"><span class="theme-preview theme-preview-drive"><i></i></span><span class="theme-copy"><b>DriveInTech</b><small>Техно стиль, зелёный неон</small></span><span class="theme-check">✓</span></button>
      <button class="theme theme-card" data-theme="theme-standard"><span class="theme-preview theme-preview-cosmos"><i></i></span><span class="theme-copy"><b>Космос</b><small>Космическая глубина</small></span><span class="theme-check">✓</span></button>
      <button class="theme theme-card" data-theme="theme-water"><span class="theme-preview theme-preview-water"><i></i></span><span class="theme-copy"><b>Капли воды</b><small>Стекло и вода</small></span><span class="theme-check">✓</span></button>
      <button class="theme theme-card" data-theme="theme-electric"><span class="theme-preview theme-preview-electric"><i></i></span><span class="theme-copy"><b>Электрический разряд</b><small>Энергия и молнии</small></span><span class="theme-check">✓</span></button>`;
    grid.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        try {
          const raw = localStorage.getItem('voice-events-v7');
          const state = raw ? JSON.parse(raw) : null;
          if (state?.settings) {
            state.settings.theme = card.dataset.theme;
            localStorage.setItem('voice-events-v7', JSON.stringify(state));
          }
        } catch (_) {}
        document.body.className = card.dataset.theme;
        requestAnimationFrame(() => grid.querySelectorAll('.theme-card').forEach(c => c.classList.toggle('active', c === card)));
      });
    });
  };

  const showDualSplash = () => {
    localStorage.removeItem('voice-events-splash-voropaev-v1');
    document.getElementById('startupSplash')?.remove();
    const splash = document.createElement('div');
    splash.id = 'startupSplash';
    splash.innerHTML = `<div class="splash-stars"></div><div class="splash-orbit"></div><div class="splash-earth"></div><div class="splash-flare"></div><div class="splash-core"><div class="splash-logo">VOROP<span>A</span>EV</div><div class="splash-subtitle">Digital Transport Systems</div></div>`;
    document.body.prepend(splash);
    setTimeout(() => {
      const core = splash.querySelector('.splash-core');
      core.classList.add('splash-phase-out');
      setTimeout(() => {
        core.classList.remove('splash-phase-out');
        core.innerHTML = `<div class="drive-logo-splash">DRIVE<small>in tech</small></div><div class="splash-subtitle" style="opacity:1">Voice Events Platform</div>`;
      }, 460);
    }, 1450);
    setTimeout(() => {
      splash.classList.add('hide');
      setTimeout(() => splash.remove(), 650);
    }, 3400);
  };

  const enhanceSettings = () => {
    const panel = document.querySelector('#settings .panel');
    if (!panel || panel.querySelector('.settings-version')) return;
    const version = document.createElement('div');
    version.className = 'settings-version';
    version.innerHTML = `<div class="version-row"><b>Версия приложения</b><span>v10.0.0</span></div><button id="updateAppButton" class="primary" type="button">Обновить приложение</button>`;
    panel.appendChild(version);
    version.querySelector('#updateAppButton').addEventListener('click', () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => reg?.update());
      }
      showDualSplash();
    });
  };

  const init = () => {
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
