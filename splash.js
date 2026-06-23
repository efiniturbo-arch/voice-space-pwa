(() => {
  const VERSION_KEY = "voice-events-splash-v1";
  const splash = document.getElementById("startupSplash");
  if (!splash) return;

  const close = () => {
    splash.classList.add("hide");
    try { localStorage.setItem(VERSION_KEY, "shown"); } catch (_) {}
    setTimeout(() => splash.remove(), 650);
  };

  let shown = false;
  try { shown = localStorage.getItem(VERSION_KEY) === "shown"; } catch (_) {}

  if (shown) {
    splash.remove();
    return;
  }

  splash.querySelector(".splash-skip")?.addEventListener("click", close);
  splash.addEventListener("click", event => {
    if (event.target === splash) close();
  });

  window.addEventListener("load", () => setTimeout(close, 2800), { once: true });
})();
