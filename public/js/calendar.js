// Read-only week-view calendar UI backed by Google Calendar events

async function apiGet(path) {
  const res = await fetch(path, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPut(path, body) {
  const res = await fetch(path, {
    method: "PUT",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(path, {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!res.ok && res.status !== 204) throw new Error(await res.text());
  return true;
}

function startOfWeek(d) {
  const dt = new Date(d);
  const day = dt.getDay(); // 0 Sunday
  const diff = dt.getDate() - day;
  const s = new Date(dt.setDate(diff));
  s.setHours(0, 0, 0, 0);
  return s;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function renderTimes() {
  const container = document.getElementById("times");
  if (!container) return;
  container.innerHTML = "";
  for (let h = 0; h < 24; h++) {
    const el = document.createElement("div");
    el.className = "time-cell";
    const dt = new Date();
    dt.setHours(h, 0, 0, 0);
    el.textContent = dt.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    container.appendChild(el);
  }
}

function formatWeekRange(weekStart) {
  const start = new Date(weekStart);
  const end = addDays(start, 6);

  const optionsStart = { month: "short", day: "numeric" };
  const optionsEnd = { month: "short", day: "numeric", year: "numeric" };
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();

  if (sameMonth && sameYear) {
    const endStr = end.toLocaleDateString(undefined, optionsEnd);
    return `${start.getDate()}–${endStr}`;
  }

  const startStr = start.toLocaleDateString(undefined, optionsStart);
  const endStr = end.toLocaleDateString(undefined, optionsEnd);
  return `${startStr} – ${endStr}`;
}

function updateWeekLabel() {
  const label = document.getElementById("weekLabel");
  if (!label) return;
  const span = label.querySelector("span:last-child");
  if (!span) return;
  span.textContent = formatWeekRange(currentWeekStart);
}

function setEmptyMessage(msg) {
  const el = document.getElementById("emptyMsg");
  if (!el) return;
  el.textContent = msg || "";
}

let currentWeekStart = startOfWeek(new Date());
let eventsCache = [];

async function loadUserAndEvents() {
  try {
    const userResp = await apiGet("/api/user");
    if (!userResp.authenticated) {
      window.location.href = "/auth/google";
      return;
    }
    renderUser(userResp.user);
    await loadEventsForWeek(currentWeekStart);
  } catch (err) {
    console.error(err);
    window.location.href = "/auth/google";
  }
}

function renderUser(user) {
  const box = document.getElementById("userBox");
  if (!box) return;
  box.innerHTML = "";

  if (!user) {
    const btn = document.createElement("button");
    btn.textContent = "Sign in with Google";
    btn.className = "btn btn-primary";
    btn.onclick = () => {
      window.location.href = "/auth/google";
    };
    box.appendChild(btn);
    return;
  }

  const avatar = document.createElement("img");
  avatar.src = user.picture || "/img/default-avatar.png";
  avatar.alt = user.name || user.email || "User avatar";
  avatar.className = "user-avatar";

  const meta = document.createElement("div");
  meta.className = "user-meta";

  const nameEl = document.createElement("div");
  nameEl.className = "user-name";
  nameEl.textContent = user.name || user.email || "Signed in";

  const emailEl = document.createElement("div");
  emailEl.className = "user-email";
  emailEl.textContent = user.email || "";

  meta.appendChild(nameEl);
  meta.appendChild(emailEl);

  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.gap = "8px";

  wrapper.appendChild(avatar);
  wrapper.appendChild(meta);

  box.appendChild(wrapper);
}

async function loadEventsForWeek(weekStart) {
  setEmptyMessage("Loading events…");
  try {
    const weekEnd = addDays(weekStart, 7);
    const query = `?timeMin=${encodeURIComponent(
      weekStart.toISOString()
    )}&timeMax=${encodeURIComponent(weekEnd.toISOString())}&maxResults=100`;

    const items = await apiGet(`/api/calendar/events${query}`);

    eventsCache = items.map((e) => {
      const startVal = e.start?.dateTime || e.start;
      const endVal = e.end?.dateTime || e.end;
      return {
        ...e,
        startDt: new Date(startVal),
        endDt: new Date(endVal),
      };
    });

    renderGrid(weekStart);
    scrollToCurrentTimeIfThisWeek(weekStart);
  } catch (err) {
    console.error(err);
    setEmptyMessage("Failed to load events. Click Sync to retry.");
  }
}

function clearGrid() {
  const container = document.getElementById("gridContainer");
  if (!container) return;
  container.innerHTML = "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const dayDate = addDays(currentWeekStart, i);
    const col = document.createElement("div");
    col.className = "day-col";
    col.dataset.dayIndex = i.toString();

    const header = document.createElement("div");
    header.className = "day-header";

    const dayName = document.createElement("div");
    dayName.className = "day-name";
    dayName.textContent = dayDate
      .toLocaleDateString(undefined, { weekday: "short" })
      .toUpperCase();

    const dayNum = document.createElement("div");
    dayNum.className = "day-date";
    dayNum.textContent = String(dayDate.getDate());

    header.appendChild(dayName);
    header.appendChild(dayNum);

    if (isSameDay(dayDate, today)) {
      col.classList.add("day-col--today");
      const pill = document.createElement("div");
      pill.className = "today-pill";
      pill.textContent = "Today";
      header.appendChild(pill);
    }

    col.appendChild(header);

    const slotsWrapper = document.createElement("div");
    slotsWrapper.className = "slots";

    for (let h = 0; h < 24; h++) {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.day = i.toString();
      slot.dataset.hour = h.toString();
      // read-only grid: no click handler
      slotsWrapper.appendChild(slot);
    }

    col.appendChild(slotsWrapper);
    container.appendChild(col);
  }
}

function renderGrid(weekStart) {
  clearGrid();
  updateWeekLabel();

  const weekEnd = addDays(weekStart, 7);
  const evs = eventsCache.filter(
    (e) => e.startDt < weekEnd && e.endDt >= weekStart
  );

  for (const e of evs) {
    placeEventNode(e);
  }

  if (evs.length === 0) {
    setEmptyMessage("No events this week.");
  } else {
    setEmptyMessage(
      `${evs.length} event${evs.length === 1 ? "" : "s"} this week.`
    );
  }
}

function placeEventNode(eventObj) {
  const start = eventObj.startDt;
  const end = eventObj.endDt;

  const dayIdx = Math.floor(
    (start - currentWeekStart) / (24 * 3600 * 1000)
  );
  if (dayIdx < 0 || dayIdx > 6) return;

  const col = document.querySelector(
    `.day-col[data-day-index="${dayIdx}"]`
  );
  if (!col) return;

  const hourHeight =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--hour-height"
      )
    ) || 48;
  const headerHeight =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--day-header-height"
      )
    ) || 40;

  const startHours = start.getHours() + start.getMinutes() / 60;
  const durationHours = Math.max(
    0.25,
    (end - start) / (3600 * 1000)
  );

  const topPx = headerHeight + startHours * hourHeight;
  const heightPx = durationHours * hourHeight;

  const node = document.createElement("div");
  node.className = "event";
  node.style.top = `${topPx}px`;
  node.style.height = `${heightPx - 6}px`;
  node.style.position = "absolute";
  node.dataset.eventId = eventObj.id;

  const title = document.createElement("div");
  title.className = "event-title";
  title.textContent = eventObj.summary || "(No title)";

  const time = document.createElement("div");
  time.className = "event-time";
  time.textContent = `${start.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })} – ${end.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  node.appendChild(title);
  node.appendChild(time);

  // still allow edit/delete via click
  node.addEventListener("click", (ev) => {
    ev.stopPropagation();
    onEventClick(eventObj);
  });

  col.appendChild(node);
}

async function onEventClick(eventObj) {
  const newTitle = prompt(
    "Edit title (Cancel to keep current title)",
    eventObj.summary
  );
  if (newTitle === null) return;

  const doDelete = confirm(
    "Delete this event?\n\nOK = delete, Cancel = save updated title instead."
  );

  try {
    if (doDelete) {
      await apiDelete(`/api/calendar/events/${eventObj.id}`);
      eventsCache = eventsCache.filter((e) => e.id !== eventObj.id);
      renderGrid(currentWeekStart);
      return;
    }

    const updated = await apiPut(
      `/api/calendar/events/${eventObj.id}`,
      {
        summary: newTitle,
        start: eventObj.startDt.toISOString(),
        end: eventObj.endDt.toISOString(),
        description: eventObj.description || "",
        location: eventObj.location || "",
      }
    );

    const startVal = updated.start?.dateTime || updated.start;
    const endVal = updated.end?.dateTime || updated.end;

    const idx = eventsCache.findIndex((e) => e.id === eventObj.id);
    if (idx >= 0) {
      eventsCache[idx] = {
        ...updated,
        startDt: new Date(startVal),
        endDt: new Date(endVal),
      };
    }

    renderGrid(currentWeekStart);
  } catch (err) {
    console.error(err);
    alert("Failed to update or delete event.");
  }
}

function scrollToCurrentTimeIfThisWeek(weekStart) {
  const todayWeek = startOfWeek(new Date());
  if (todayWeek.getTime() !== weekStart.getTime()) return;

  const scroll = document.querySelector(".calendar-scroll");
  if (!scroll) return;

  const now = new Date();
  const hourHeight =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--hour-height"
      )
    ) || 48;

  scroll.scrollTop = Math.max(0, (now.getHours() - 1) * hourHeight);
}

// Controls
document.getElementById("prevWeek").addEventListener("click", () => {
  currentWeekStart = addDays(currentWeekStart, -7);
  loadEventsForWeek(currentWeekStart);
});

document.getElementById("nextWeek").addEventListener("click", () => {
  currentWeekStart = addDays(currentWeekStart, 7);
  loadEventsForWeek(currentWeekStart);
});

document.getElementById("todayBtn").addEventListener("click", () => {
  currentWeekStart = startOfWeek(new Date());
  loadEventsForWeek(currentWeekStart);
});

document.getElementById("syncBtn").addEventListener("click", () => {
  loadEventsForWeek(currentWeekStart);
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  window.location.href = "/auth/logout";
});

// Initial render
renderTimes();
loadUserAndEvents();
