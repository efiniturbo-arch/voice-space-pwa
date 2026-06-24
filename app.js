(() => {
  const KEY = "voice-events-v7";
  const MINUTE = 60000;
  const screens = ["events", "tasks", "chat", "docs", "transport", "settings"];
  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  let recorder;
  let chunks = [];
  let activeEvent = null;
  let currentScreen = "events";
  let previousScreen = "events";

  const defaultState = () => ({
    settings: { theme: "theme-standard", interval: 60, ip: "", notify: false, appVersion: "v13.0.0 UI Kit" },
    filter: { date: "", status: "all" },
    events: [],
    tasks: [],
    chat: [{ from: "bot", text: "Привет! Это чат Voice Events." }],
    docs: []
  });

  const load = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!saved) return defaultState();
      const clean = defaultState();
      return {
        ...clean,
        ...saved,
        settings: { ...clean.settings, ...(saved.settings || {}), appVersion: "v13.0.0 UI Kit" },
        filter: { ...clean.filter, ...(saved.filter || {}) },
        events: Array.isArray(saved.events) ? saved.events : [],
        tasks: Array.isArray(saved.tasks) ? saved.tasks : [],
        chat: Array.isArray(saved.chat) ? saved.chat : clean.chat,
        docs: Array.isArray(saved.docs) ? saved.docs : []
      };
    } catch (_) {
      return defaultState();
    }
  };

  let state = load();
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  const pad = value => String(value).padStart(2, "0");
  const isoDate = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const readableDate = date => date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  const readableTime = date => date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  const eventStatus = event => {
    if (event.items.length) {
      const last = new Date(event.items.at(-1).created);
      return { className: "filled", icon: "✓", title: "Заполнено", detail: `Заполнено в ${readableTime(last)}`, pill: "Заполнено" };
    }
    const hours = Math.floor((Date.now() - new Date(event.time)) / 3600000);
    if (hours >= 5) return { className: "danger", icon: "!", title: "Просрочено", detail: `не заполнено ${hours} ч.`, pill: "Просрочено" };
    if (hours >= 3) return { className: "warning", icon: "◉", title: "Ожидает заполнения", detail: `не заполнено ${hours} ч.`, pill: "Ожидает" };
    return { className: "wait", icon: "◷", title: "Ожидает заполнения", detail: hours ? `не заполнено ${hours} ч.` : "текущий интервал", pill: "Ожидает" };
  };

  const ensureEvents = () => {
    const step = Math.max(1, Number(state.settings.interval) || 60) * MINUTE;
    const now = new Date();
    now.setSeconds(0, 0);
    const current = Math.floor(now.getTime() / step) * step;
    const ids = new Set(state.events.map(event => event.id));
    for (let time = current; time >= current - step * 24; time -= step) {
      if (!ids.has(String(time))) state.events.push({ id: String(time), time: new Date(time).toISOString(), items: [] });
    }
    state.events.sort((a, b) => new Date(b.time) - new Date(a.time));
    save();
  };

  const applySettings = () => {
    const theme = state.settings.theme || "theme-standard";
    const detailMode = Boolean(activeEvent);
    document.body.className = `${theme}${detailMode ? " detail-mode" : ""}`;
    $("ip").value = state.settings.ip || "";
    $("hh").value = Math.floor((state.settings.interval || 60) / 60);
    $("mm").value = (state.settings.interval || 60) % 60;
    $("notify").checked = Boolean(state.settings.notify);
    $("fd").value = state.filter.date || "";
    $("fs").value = state.filter.status || "all";
    $("filterBtn").classList.toggle("hasfilter", Boolean(state.filter.date) || state.filter.status !== "all");
    $("badge").textContent = Boolean(state.filter.date) + (state.filter.status !== "all");
    document.dispatchEvent(new CustomEvent("voice-events-state-applied", { detail: { theme } }));
  };

  const go = screen => {
    if (!screens.includes(screen)) return;
    if (screen === "settings") previousScreen = currentScreen === "settings" ? "events" : currentScreen;
    currentScreen = screen;
    screens.forEach(id => $(id).classList.toggle("hidden", id !== screen));
    $("detail").classList.add("hidden");
    document.querySelectorAll("#nav button[data-go]").forEach(button => button.classList.toggle("active", button.dataset.go === screen));
    $("subtitle").textContent = {
      events: "Журнал событий",
      tasks: "Задачи",
      chat: "Чат",
      docs: "Документы",
      transport: "Транспорт",
      settings: "Настройки"
    }[screen];
    $("nav").classList.toggle("hidden", screen === "settings");
    render();
  };

  const renderEvents = () => {
    ensureEvents();
    $("today").textContent = state.filter.date ? readableDate(new Date(`${state.filter.date}T00:00:00`)) : readableDate(new Date());
    const events = state.events.filter(event => {
      const status = eventStatus(event);
      return (!state.filter.date || isoDate(new Date(event.time)) === state.filter.date)
        && (!state.filter.status || state.filter.status === "all" || status.className === state.filter.status);
    });
    $("eventList").innerHTML = events.length ? events.map(event => {
      const status = eventStatus(event);
      const date = new Date(event.time);
      const filled = status.className === "filled";
      return `<article class="event ${status.className}" data-id="${event.id}" tabindex="0" role="button">
        <div class="ico">${status.icon}</div>
        <div><div class="time">${readableTime(date)}</div><div class="desc">${readableDate(date)}<br><b>${status.title}</b><br>${status.detail}</div></div>
        <div class="right">${filled ? `<span class="check">✓</span><br>в ${readableTime(new Date(event.items.at(-1).created))}` : "›"}</div>
      </article>`;
    }).join("") : '<div class="empty">По выбранному фильтру событий нет.</div>';
    document.querySelectorAll(".event").forEach(element => {
      const open = () => openEvent(element.dataset.id);
      element.addEventListener("click", open);
      element.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });
    });
  };

  const renderMessages = () => {
    const event = state.events.find(item => item.id === activeEvent);
    if (!event) return;
    $("msgs").innerHTML = event.items.length ? event.items.map(item => {
      const title = item.type === "audio" ? "Голосовое сообщение" : "Фото события";
      const content = item.type === "audio"
        ? `<audio controls preload="metadata" src="${item.data}"></audio>`
        : `<img src="${item.data}" alt="Фото события">`;
      return `<div class="msg"><small>${new Date(item.created).toLocaleString("ru-RU")}</small><br><b>${title}</b>${content}</div>`;
    }).join("") : '<div class="msg"><small>Пока нет сообщений</small><br>Нажмите микрофон или добавьте фото.</div>';
  };

  const openEvent = id => {
    activeEvent = id;
    const event = state.events.find(item => item.id === id);
    if (!event) return;
    const status = eventStatus(event);
    const date = new Date(event.time);
    screens.forEach(screen => $(screen).classList.add("hidden"));
    $("detail").classList.remove("hidden");
    $("nav").classList.add("hidden");
    $("dt").textContent = `Событие ${readableTime(date)}`;
    $("ds").textContent = `${readableDate(date)} · ${status.title}`;
    $("pill").textContent = status.pill;
    $("pill").classList.toggle("filled", status.className === "filled");
    applySettings();
    renderMessages();
  };

  const closeEvent = () => {
    if (recorder?.state === "recording") recorder.stop();
    activeEvent = null;
    $("detail").classList.add("hidden");
    $("events").classList.remove("hidden");
    $("nav").classList.remove("hidden");
    currentScreen = "events";
    applySettings();
    renderEvents();
  };

  const fileData = (file, callback) => {
    const reader = new FileReader();
    reader.onloadend = () => callback(reader.result);
    reader.readAsDataURL(file);
  };

  const record = async () => {
    if (recorder?.state === "recording") {
      recorder.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      alert("Запись голоса не поддерживается этим браузером.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const targetEventId = activeEvent;
      chunks = [];
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = event => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onstop = () => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const event = state.events.find(item => item.id === targetEventId);
          if (event) {
            event.items.push({ type: "audio", data: reader.result, created: new Date().toISOString() });
            save();
            renderMessages();
          }
        };
        reader.readAsDataURL(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
        stream.getTracks().forEach(track => track.stop());
        $("rec").classList.remove("recording");
        $("hint").textContent = "Нажмите для записи";
      };
      recorder.start();
      $("rec").classList.add("recording");
      $("hint").textContent = "Идёт запись. Нажмите для остановки";
    } catch (_) {
      alert("Разрешите доступ к микрофону в настройках браузера.");
    }
  };

  const render = () => {
    if (currentScreen === "events") renderEvents();
    $("taskList").innerHTML = state.tasks.length ? state.tasks.map(task => `<article class="task"><b>${escapeHtml(task.text)}</b>${task.photo ? `<img src="${task.photo}" alt="Фото задачи">` : ""}</article>`).join("") : '<div class="empty">Задач пока нет.</div>';
    $("chatList").innerHTML = state.chat.map(message => `<div class="bubble ${message.from === "me" ? "me" : ""}">${escapeHtml(message.text)}</div>`).join("");
    $("docList").innerHTML = state.docs.length ? state.docs.map(doc => `<article class="doc"><b>${escapeHtml(doc.name)}</b>${doc.data.startsWith("data:image") ? `<img src="${doc.data}" alt="${escapeHtml(doc.name)}">` : "<p>Файл сохранён локально</p>"}</article>`).join("") : '<div class="empty">Документов пока нет.</div>';
    $("chatBadge").textContent = String(Math.max(1, state.chat.filter(message => message.from !== "me").length));
    applySettings();
  };

  $("back").addEventListener("click", closeEvent);
  $("avatar").addEventListener("click", event => {
    event.stopPropagation();
    const open = $("profile").classList.toggle("open");
    $("profile").setAttribute("aria-hidden", String(!open));
  });
  document.addEventListener("click", event => {
    if (!$("profile").contains(event.target) && event.target !== $("avatar")) {
      $("profile").classList.remove("open");
      $("profile").setAttribute("aria-hidden", "true");
    }
  });
  document.querySelectorAll("[data-go]").forEach(button => button.addEventListener("click", () => {
    $("profile").classList.remove("open");
    go(button.dataset.go);
  }));
  $("closeSettings").addEventListener("click", () => go(previousScreen));
  $("filterBtn").addEventListener("click", () => {
    $("sheet").classList.remove("hidden");
    applySettings();
  });
  $("dateBtn").addEventListener("click", () => {
    $("sheet").classList.remove("hidden");
    applySettings();
  });
  $("x").addEventListener("click", () => $("sheet").classList.add("hidden"));
  $("apply").addEventListener("click", () => {
    state.filter = { date: $("fd").value, status: $("fs").value };
    save();
    $("sheet").classList.add("hidden");
    renderEvents();
  });
  $("reset").addEventListener("click", () => {
    state.filter = { date: "", status: "all" };
    save();
    $("sheet").classList.add("hidden");
    renderEvents();
  });
  $("rec").addEventListener("click", record);
  $("photo").addEventListener("change", event => {
    const file = event.target.files[0];
    if (!file) return;
    fileData(file, data => {
      const item = state.events.find(entry => entry.id === activeEvent);
      if (!item) return;
      item.items.push({ type: "photo", data, created: new Date().toISOString() });
      save();
      renderMessages();
    });
    event.target.value = "";
  });
  $("addTask").addEventListener("click", () => {
    const text = $("taskText").value.trim();
    const file = $("taskPhoto").files[0];
    if (!text) return;
    const add = photo => {
      state.tasks.unshift({ text, photo });
      $("taskText").value = "";
      $("taskPhoto").value = "";
      save();
      render();
    };
    file ? fileData(file, add) : add("");
  });
  $("send").addEventListener("click", () => {
    const text = $("chatText").value.trim();
    if (!text) return;
    state.chat.push({ from: "me", text });
    $("chatText").value = "";
    save();
    render();
  });
  $("chatText").addEventListener("keydown", event => {
    if (event.key === "Enter") $("send").click();
  });
  $("docIn").addEventListener("change", event => {
    [...event.target.files].forEach(file => fileData(file, data => {
      state.docs.unshift({ name: file.name, data });
      save();
      render();
    }));
    event.target.value = "";
  });
  ["ip", "hh", "mm", "notify"].forEach(id => $(id).addEventListener("change", () => {
    state.settings.ip = $("ip").value;
    state.settings.interval = Number($("hh").value) * 60 + Number($("mm").value) || 60;
    state.settings.notify = $("notify").checked;
    save();
    renderEvents();
  }));
  document.addEventListener("voice-events-theme-change", event => {
    state.settings.theme = event.detail.theme;
    state.settings.appVersion = "v13.0.0 UI Kit";
    save();
    applySettings();
  });

  window.voiceEvents = { getState: () => state, save };
  applySettings();
  go("events");
  setInterval(() => {
    if (currentScreen === "events" && !activeEvent) renderEvents();
  }, MINUTE);
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
})();
