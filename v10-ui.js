(() => {
  const $ = id => document.getElementById(id);
  const syncThemes = () => {
    document.querySelectorAll('.theme-card').forEach(card => {
      card.classList.toggle('active', document.body.classList.contains(card.dataset.theme));
    });
  };
  const notifyLabel = () => {
    const input = $('notify');
    const label = $('notifyState');
    if (!input || !label) return;
    label.textContent = input.checked ? 'Включены' : 'Выключены';
    label.classList.toggle('on', input.checked);
  };
  const addVersion = () => {
    const panel = document.querySelector('#settings .panel');
    if (!panel || panel.querySelector('.settings-version')) return;
    const version = document.createElement('div');
    version.className = 'settings-version';
    version.innerHTML = '<div class="version-row"><b>Версия приложения</b><span>v10.6.0</span></div><button id="updateAppButton" class="primary" type="button">Обновить приложение</button>';
    panel.appendChild(version);
    $('updateAppButton')?.addEventListener('click', () => {
      if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistration().then(reg => reg && reg.update());
      location.reload();
    });
  };
  const init = () => {
    if (!document.querySelector('link[href="v10-ui.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'v10-ui.css?v=10.6.0';
      document.head.appendChild(link);
    }
    syncThemes();
    notifyLabel();
    addVersion();
    $('notify')?.addEventListener('change', notifyLabel);
    $('eventSend')?.addEventListener('click', () => {
      const input = $('eventText');
      if (!input || !input.value.trim()) return;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    $('chatMic')?.addEventListener('click', () => {
      const input = $('chatText');
      if (input) { input.value = input.value || 'Голосовое сообщение: '; input.focus(); }
    });
    document.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => requestAnimationFrame(syncThemes));
    });
  };
  document.addEventListener('DOMContentLoaded', init);
  setTimeout(init, 300);
  setInterval(notifyLabel, 1000);
})();