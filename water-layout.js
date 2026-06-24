(() => {
  "use strict";

  const VERSION = "v21.0.0 Water Rebuild";
  const $ = id => document.getElementById(id);
  const isWater = () => document.body.classList.contains("theme-water");
  const statusLabels = {
    all: "Показать все",
    filled: "Заполнено",
    wait: "Ожидает",
    warning: "Внимание",
    danger: "Просрочено"
  };
  const navItems = {
    events: ["events", "События"],
    tasks: ["tasks", "Задачи"],
    chat: ["chat", "Чат"],
    docs: ["docs", "Документы"],
    transport: ["transport", "Транспорт"]
  };

  let taskRecognition = null;
  let taskListening = false;
  let syncing = false;

  const state = () => window.voiceEvents?.getState?.();
  const save = () => window.voiceEvents?.save?.();

  function setVersion() {
    document.querySelectorAll(".settings-version span").forEach(node => {
      node.textContent = VERSION;
    });
    const current = state();
    if (current && current.settings.appVersion !== VERSION) {
      current.settings.appVersion = VERSION;
      save();
    }
  }

  function renderWaterNav() {
    const nav = $("nav");
    if (!nav) return;
    nav.classList.toggle("water-bottom-nav", isWater());

    if (!isWater()) {
      if (!nav.dataset.waterRendered) return;
      document.querySelectorAll("#nav button[data-go]").forEach(button => {
        const item = navItems[button.dataset.go];
        if (!item) return;
        const badge = button.querySelector(".nav-badge")?.outerHTML || "";
        button.innerHTML = `<span class="orb-menu-shell"><span class="orb-menu-icon" aria-hidden="true">◉</span></span><span class="orb-menu-label">${item[1]}</span>${badge}`;
      });
      delete nav.dataset.waterRendered;
      return;
    }

    if (nav.dataset.waterRendered && nav.querySelector(".water-drop")) return;
    document.querySelectorAll("#nav button[data-go]").forEach(button => {
      const item = navItems[button.dataset.go];
      if (!item) return;
      const badge = button.querySelector(".nav-badge")?.outerHTML || "";
      button.innerHTML = `<span class="water-drop" aria-hidden="true">
        <img class="water-drop-image water-drop-idle" src="assets/water/water-drop-${item[0]}-idle.png" alt="">
        <img class="water-drop-image water-drop-active" src="assets/water/water-drop-${item[0]}-active.png" alt="">
      </span><span class="water-nav-label">${item[1]}</span>${badge}`;
    });
    nav.dataset.waterRendered = "true";
  }

  function setHomeCopy() {
    const events = $("events");
    const detail = $("detail");
    const tasks = $("tasks");
    events?.classList.toggle("water-home-layout", isWater());
    detail?.classList.toggle("water-event-layout", isWater());
    tasks?.classList.toggle("water-tasks-layout", isWater());
    if (isWater()) {
      document.body.classList.toggle("tasks-active", Boolean(tasks && !tasks.classList.contains("hidden")));
    }

    const heading = events?.querySelector(".hero h1");
    const headingText = isWater() ? "Журнал событий" : "TEPA Events";
    if (heading && heading.textContent !== headingText) heading.textContent = headingText;
    if (!isWater()) return;

    const current = state();
    const dateButton = $("dateBtn");
    const statusButton = $("filterBtn");
    const todayText = $("today")?.textContent || "Выбрать дату";
    if (dateButton) {
      dateButton.setAttribute("aria-label", "Выбрать дату событий");
      const dateMarkup = `<span class="filter-icon" aria-hidden="true">⌄</span><span id="today">${todayText}</span>`;
      if (dateButton.innerHTML !== dateMarkup) dateButton.innerHTML = dateMarkup;
    }
    if (statusButton) {
      const status = current?.filter?.status || "all";
      statusButton.setAttribute("aria-label", "Выбрать статус карточки");
      const statusMarkup = `<span>${statusLabels[status] || statusLabels.all}</span><span class="filter-icon" aria-hidden="true">⌄</span><span id="badge"></span>`;
      if (statusButton.innerHTML !== statusMarkup) statusButton.innerHTML = statusMarkup;
    }
  }

  function ensureFilterPopovers() {
    if (!$("waterDatePopover")) {
      const datePopover = document.createElement("div");
      datePopover.id = "waterDatePopover";
      datePopover.className = "water-filter-popover hidden";
      datePopover.innerHTML = `
        <div class="water-filter-card" role="dialog" aria-modal="true" aria-labelledby="waterDateTitle">
          <h2 id="waterDateTitle">Выбор даты</h2>
          <input id="waterDateInput" type="date">
          <div class="water-filter-actions">
            <button id="waterDateClear" type="button">Сбросить</button>
            <button id="waterDateApply" class="primary" type="button">Применить</button>
          </div>
        </div>`;
      document.body.appendChild(datePopover);
      datePopover.addEventListener("click", event => {
        if (event.target === datePopover) datePopover.classList.add("hidden");
      });
      $("waterDateClear").addEventListener("click", () => applyFilter({ date: "" }));
      $("waterDateApply").addEventListener("click", () => applyFilter({ date: $("waterDateInput").value || "" }));
    }

    if (!$("waterStatusPopover")) {
      const statusPopover = document.createElement("div");
      statusPopover.id = "waterStatusPopover";
      statusPopover.className = "water-filter-popover hidden";
      statusPopover.innerHTML = `
        <div class="water-filter-card" role="dialog" aria-modal="true" aria-labelledby="waterStatusTitle">
          <h2 id="waterStatusTitle">Статус карточки</h2>
          <div class="water-status-options">
            ${Object.entries(statusLabels).map(([value, label]) => `<button type="button" data-water-status="${value}">${label}</button>`).join("")}
          </div>
        </div>`;
      document.body.appendChild(statusPopover);
      statusPopover.addEventListener("click", event => {
        if (event.target === statusPopover) statusPopover.classList.add("hidden");
        const button = event.target.closest("[data-water-status]");
        if (button) applyFilter({ status: button.dataset.waterStatus });
      });
    }
  }

  function applyFilter(next) {
    const current = state();
    if (!current) return;
    current.filter = {
      date: next.date ?? current.filter?.date ?? "",
      status: next.status ?? current.filter?.status ?? "all"
    };
    save();
    if ($("fd")) $("fd").value = current.filter.date;
    if ($("fs")) $("fs").value = current.filter.status;
    $("apply")?.click();
    $("waterDatePopover")?.classList.add("hidden");
    $("waterStatusPopover")?.classList.add("hidden");
    window.setTimeout(sync, 50);
  }

  function openDatePopover() {
    ensureFilterPopovers();
    $("waterDateInput").value = state()?.filter?.date || "";
    $("waterStatusPopover")?.classList.add("hidden");
    $("waterDatePopover").classList.remove("hidden");
    window.setTimeout(() => $("waterDateInput")?.focus(), 30);
  }

  function openStatusPopover() {
    ensureFilterPopovers();
    const selected = state()?.filter?.status || "all";
    $("waterDatePopover")?.classList.add("hidden");
    $("waterStatusPopover").classList.remove("hidden");
    document.querySelectorAll("[data-water-status]").forEach(button => {
      button.classList.toggle("active", button.dataset.waterStatus === selected);
    });
  }

  function configureEventComposer() {
    $("eventActionBar")?.remove();
    const composer = document.querySelector("#detail .composer");
    if (!composer) return;
    const rec = $("rec");
    const photo = $("photo");
    const input = $("eventTextInput");
    if (rec) {
      rec.textContent = "🎙";
      rec.setAttribute("aria-label", "Записать голосовой комментарий");
      rec.dataset.directMicrophone = "true";
    }
    if (photo?.parentElement) {
      const label = photo.parentElement;
      label.setAttribute("aria-label", "Добавить фото события");
      Array.from(label.childNodes).filter(node => node.nodeType === Node.TEXT_NODE).forEach(node => node.remove());
      if (!label.querySelector(".water-action-glyph")) {
        const glyph = document.createElement("span");
        glyph.className = "water-action-glyph";
        glyph.textContent = "📷";
        label.prepend(glyph);
      }
    }
    if (input) input.placeholder = "Комментарий к событию...";
  }

  function configureTaskComposer() {
    let bar = $("taskMediaBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "taskMediaBar";
      document.body.appendChild(bar);
    }
    if (!bar.dataset.waterComposer) {
      bar.innerHTML = `
        <button id="taskRec" class="task-mic" type="button" aria-label="Продиктовать текст задачи">🎙</button>
        <label class="task-photo" for="taskPhoto" aria-label="Добавить фото задачи">📷</label>
        <input id="taskActionInput" class="task-action-input" type="text" placeholder="Введите текст задачи..." autocomplete="off">`;
      bar.dataset.waterComposer = "true";
      $("taskRec").addEventListener("click", startTaskDictation);
      $("taskActionInput").addEventListener("input", event => {
        if ($("taskText")) $("taskText").value = event.target.value;
      });
      $("taskActionInput").addEventListener("keydown", event => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        const text = event.currentTarget.value.trim();
        if (!text) return;
        if ($("taskText")) $("taskText").value = text;
        $("addTask")?.click();
        event.currentTarget.value = "";
      });
    }
    bar.classList.toggle("water-task-composer", isWater());
  }

  function startTaskDictation() {
    if (!isWater() || taskListening) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const input = $("taskActionInput");
    const button = $("taskRec");
    if (!SpeechRecognition) {
      input?.focus();
      if (input) input.placeholder = "Диктовка недоступна — введите задачу";
      return;
    }

    taskRecognition = new SpeechRecognition();
    taskRecognition.lang = "ru-RU";
    taskRecognition.interimResults = true;
    taskRecognition.continuous = false;
    const initial = input?.value.trim() || "";
    taskListening = true;
    button?.classList.add("listening");

    taskRecognition.onresult = event => {
      const transcript = Array.from(event.results).map(result => result[0].transcript).join(" ").trim();
      if (!input) return;
      input.value = [initial, transcript].filter(Boolean).join(initial ? " " : "");
      if ($("taskText")) $("taskText").value = input.value;
    };
    taskRecognition.onerror = () => input?.focus();
    taskRecognition.onend = () => {
      taskListening = false;
      button?.classList.remove("listening");
      input?.focus();
    };
    taskRecognition.start();
  }

  function sync() {
    if (syncing) return;
    syncing = true;
    try {
      setVersion();
      setHomeCopy();
      renderWaterNav();
      ensureFilterPopovers();
      configureEventComposer();
      configureTaskComposer();
    } finally {
      syncing = false;
    }
  }

  document.addEventListener("click", event => {
    if (!isWater()) return;
    const dateButton = event.target.closest("#dateBtn");
    const statusButton = event.target.closest("#filterBtn");
    if (!dateButton && !statusButton) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (dateButton) openDatePopover();
    if (statusButton) openStatusPopover();
  }, true);

  document.addEventListener("voice-events-theme-change", () => window.setTimeout(sync, 0));
  document.addEventListener("voice-events-state-applied", () => window.setTimeout(sync, 0));
  document.addEventListener("DOMContentLoaded", sync);

  new MutationObserver(() => window.setTimeout(sync, 0)).observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
    childList: true,
    subtree: true
  });

  window.setTimeout(sync, 550);
  window.setTimeout(sync, 1650);
  window.setInterval(setVersion, 1200);
  window.voraWaterV21 = { version: VERSION, sync, openDatePopover, openStatusPopover };
})();
