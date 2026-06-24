(() => {
  const VERSION = 'v13.0.0 UI Kit';
  const assets = window.VOICE_EVENTS_V13_ASSETS || {};
  const themeKey = 'voice-events-theme-override';
  const stateKey = 'voice-events-v7';
  const themeMap = {
    'theme-drive-hero': 'driveintech',
    'theme-standard': 'cosmos',
    'theme-water': 'water',
    'theme-electric': 'electric',
    'theme-drive-monitor': 'drive_monitor',
    'theme-red-nebula': 'red_nebula'
  };
  const sectionMap = {events:'events',tasks:'tasks',chat:'chat',docs:'documents',transport:'transport'};
  const currentThemeClass = () => Object.keys(themeMap).find(name => document.body.classList.contains(name)) || 'theme-standard';
  const applyThemeAssets = () => {
    const theme = themeMap[currentThemeClass()];
    const background = assets[`themes/${theme}/backgrounds/background.svg`];
    const card = assets[`themes/${theme}/components/event-card-shell.svg`];
    if (background) document.body.style.setProperty('--v13-background', `url("${background}")`);
    if (card) document.body.style.setProperty('--v13-event-card', `url("${card}")`);
    document.querySelectorAll('#nav button[data-go]').forEach(button => {
      const section = sectionMap[button.dataset.go];
      if (!section) return;
      const normal = button.querySelector('.v13-nav-normal');
      const active = button.querySelector('.v13-nav-active');
      if (normal) normal.src = assets[`themes/${theme}/nav/${section}-normal.svg`] || '';
      if (active) active.src = assets[`themes/${theme}/nav/${section}-active.svg`] || '';
    });
  };
  const buildNavigation = () => {
    document.querySelectorAll('#nav button[data-go]').forEach(button => {
      if (button.dataset.v13) return;
      const section = sectionMap[button.dataset.go];
      if (!section) return;
      const badge = button.querySelector('.nav-badge');
      button.dataset.v13 = '1';
      button.innerHTML = '<span class="v13-nav-art" aria-hidden="true"><img class="v13-nav-normal" alt=""><img class="v13-nav-active" alt=""></span>';
      if (badge) button.appendChild(badge);
    });
  };
  const decorateThemePreviews = () => {
    document.querySelectorAll('.theme-card[data-theme]').forEach(card => {
      const theme = themeMap[card.dataset.theme];
      const preview = card.querySelector('.theme-preview');
      const mockup = theme && assets[`themes/${theme}/mockups/home-screen.svg`];
      if (preview && mockup) {
        preview.style.backgroundImage = `url("${mockup}")`;
        preview.classList.add('v13-theme-preview');
      }
    });
  };
  const persistTheme = themeClass => {
    if (!themeMap[themeClass]) return;
    localStorage.setItem(themeKey, themeClass);
    try {
      const state = JSON.parse(localStorage.getItem(stateKey) || '{}');
      if (state.settings) {
        state.settings.theme = themeClass;
        state.settings.appVersion = VERSION;
        localStorage.setItem(stateKey, JSON.stringify(state));
      }
    } catch (_) {}
  };
  const sync = () => {
    buildNavigation();
    decorateThemePreviews();
    applyThemeAssets();
    const version = document.querySelector('.settings-version .version-row span');
    if (version) version.textContent = VERSION;
  };
  document.addEventListener('click', event => {
    const card = event.target.closest('.theme-card[data-theme]');
    if (card) persistTheme(card.dataset.theme);
    if (card || event.target.closest('#nav button[data-go]')) requestAnimationFrame(sync);
  }, true);
  new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class'],subtree:true});
  const init = () => { buildNavigation(); decorateThemePreviews(); sync(); };
  document.addEventListener('DOMContentLoaded', init);
  setTimeout(init, 500);
  setTimeout(init, 1400);
})();
