const appState = {
  plan:          {},          // { [weekKey]: dayArray }
  activeWeekKey: null,

  // Modal context
  modal: {
    mode:        null,        // "add" | "edit"
    targetDayId: null,
    targetExId:  null
  },

  // Day-name modal context
  dayModal: {
    targetDayId: null
  }
};

/* ---- Init ---- */

function init() {
  populateMuscleSelects();
  loadPlan();
  ensureWeek(appState.activeWeekKey);
  buildWeekSelect();
  renderAll();
  wireEvents();
}

/* ---- Plan persistence ---- */

function loadPlan() {
  appState.plan = loadLocalData(STORAGE_KEYS.PLAN, {});
  const savedKey = loadLocalData(STORAGE_KEYS.ACTIVE_WEEK, null);
  appState.activeWeekKey = savedKey || dateToWeekKey(new Date());
}

function savePlan() {
  saveLocalData(STORAGE_KEYS.PLAN, appState.plan);
  saveLocalData(STORAGE_KEYS.ACTIVE_WEEK, appState.activeWeekKey);
}

/**
 * Make sure the given weekKey exists in the plan.
 * Creates a blank week if it doesn't.
 */
function ensureWeek(weekKey) {
  if (!appState.plan[weekKey]) {
    appState.plan[weekKey] = createBlankWeek();
    savePlan();
  }
}

function currentDays() {
  return appState.plan[appState.activeWeekKey] || [];
}

function getDayObj(dayId) {
  return currentDays().find((d) => d.dayId === dayId) || null;
}

/* ---- Week selector ---- */

function buildWeekSelect() {
  const select = document.getElementById("week-select");
  select.innerHTML = "";

  // Collect all stored week keys + active one, sorted.
  const keys = new Set(Object.keys(appState.plan));
  keys.add(appState.activeWeekKey);
  const sorted = [...keys].sort();

  // Number from earliest week.
  sorted.forEach((key, idx) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = formatWeekLabel(key, idx + 1);
    if (key === appState.activeWeekKey) opt.selected = true;
    select.appendChild(opt);
  });
}

function switchWeek(weekKey) {
  appState.activeWeekKey = weekKey;
  ensureWeek(weekKey);
  savePlan();
  buildWeekSelect();
  renderAll();
}

/* ---- Muscle selects ---- */

function populateMuscleSelects() {
  const ids = ["ex-primary", "ex-secondary"];
  ids.forEach((id) => {
    const sel = document.getElementById(id);
    // Keep first placeholder option
    while (sel.options.length > 1) sel.remove(1);

    // Group by parent group
    MUSCLE_GROUPS.forEach((group) => {
      const optgroup = document.createElement("optgroup");
      optgroup.label = group.label;
      group.subMuscles.forEach((sub) => {
        const opt = document.createElement("option");
        opt.value = sub.id;
        opt.textContent = sub.label;
        optgroup.appendChild(opt);
      });
      sel.appendChild(optgroup);
    });
  });
}

/* ---- Render: full page ---- */

function renderAll() {
  renderDays();
  renderAnalytics();
}

/* ---- Render: days (left column) ---- */

function renderDays() {
  const container = document.getElementById("days-container");
  const days = currentDays();
  const monday = weekKeyToMonday(appState.activeWeekKey);

  // Preserve open/closed state across re-renders.
  const openDays = new Set();
  container.querySelectorAll(".day-row.is-open").forEach((el) => {
    openDays.add(el.dataset.dayId);
  });

  container.innerHTML = "";

  days.forEach((day, idx) => {
    const isRest = !day.workoutName;
    const totalSets = day.exercises.reduce((s, e) => s + (e.sets || 0), 0);
    const isOpen = openDays.has(day.dayId);

    const row = document.createElement("div");
    row.className = `day-row${isOpen ? " is-open" : ""}`;
    row.dataset.dayId = day.dayId;

    const dayInfo = WEEK_DAYS.find((d) => d.id === day.dayId);
    const dateStr = formatDayDate(monday, idx);

    row.innerHTML = `
      <div class="day-row__head" data-toggle-day="${day.dayId}">
        <div class="day-row__meta">
          <div class="day-row__name">${dayInfo.label}</div>
          <div class="day-row__date">${dateStr}</div>
        </div>
        <div class="day-row__status">
          <span class="day-status-dot${isRest ? "" : " active"}"></span>
          <div>
            <div class="day-row__workout-name${isRest ? " rest" : ""}">${isRest ? "Rest Day" : escHtml(day.workoutName)}</div>
            ${!isRest ? `<div class="day-row__stats">${day.exercises.length} exercise${day.exercises.length !== 1 ? "s" : ""} &middot; ${totalSets} working set${totalSets !== 1 ? "s" : ""}</div>` : ""}
          </div>
        </div>
        <div class="day-row__actions">
          ${isRest
            ? `<button class="btn btn--slim btn--secondary" data-action="add-workout" data-day="${day.dayId}">+ Add Workout</button>`
            : `<button class="btn btn--slim btn--primary" data-action="add-exercise" data-day="${day.dayId}">+ Add Exercise</button>
               <button class="btn--icon" data-action="edit-day" data-day="${day.dayId}" title="Rename day">&#9998;</button>
               <button class="btn--icon danger" data-action="clear-day" data-day="${day.dayId}" title="Clear day">&#128465;</button>`
          }
          <span class="chevron">${chevronSvg()}</span>
        </div>
      </div>
      ${isRest ? renderRestBody(day.dayId) : renderDayBody(day)}
    `;

    container.appendChild(row);
  });
}

function renderRestBody(dayId) {
  return `
    <div class="day-row__body">
      <div class="rest-body">
        <p>No workout planned.</p>
      </div>
    </div>`;
}

function renderDayBody(day) {
  let exRows = "";
  day.exercises.forEach((ex, idx) => {
    const primary = findMuscleTarget(ex.primaryMuscle);
    const secondary = ex.secondaryMuscle ? findMuscleTarget(ex.secondaryMuscle) : null;
    exRows += `
      <tr draggable="true" data-ex-id="${ex.id}" data-day-id="${day.dayId}">
        <td class="ex-num">${idx + 1}.</td>
        <td>
          <span class="drag-handle" title="Drag to reorder">&#8942;&#8942;</span>
        </td>
        <td>
          <div class="ex-name">${escHtml(ex.name || "—")}</div>
          <div class="ex-muscles">
            ${primary ? `<span class="muscle-badge">${primary.label}</span>` : ""}
            ${secondary ? `<span class="muscle-badge muscle-badge--secondary">${secondary.label}</span>` : ""}
          </div>
        </td>
        <td class="ex-sets">${ex.sets} sets</td>
        <td class="ex-reps">${escHtml(ex.reps || "—")}</td>
        <td class="ex-rest">${escHtml(ex.rest || "")}</td>
        <td class="ex-actions">
          <button class="btn--icon" data-action="edit-exercise" data-day="${day.dayId}" data-ex="${ex.id}" title="Edit">&#9998;</button>
          <button class="btn--icon danger" data-action="remove-exercise" data-day="${day.dayId}" data-ex="${ex.id}" title="Remove">&times;</button>
        </td>
      </tr>`;
  });

  return `
    <div class="day-row__body">
      ${day.exercises.length > 0 ? `
        <table class="exercise-table">
          <thead>
            <tr>
              <th style="width:24px"></th>
              <th style="width:18px"></th>
              <th>Exercise</th>
              <th>Sets</th>
              <th>Reps</th>
              <th>Rest</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${exRows}</tbody>
        </table>` : `<p class="field-note" style="margin:12px 0 8px">No exercises yet.</p>`}
    </div>`;
}

function chevronSvg() {
  return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 5L7 9L11 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

/* ---- Render: analytics (right column) ---- */

function renderAnalytics() {
  const days = currentDays();
  const vol = calculateWeeklyVolume(days);
  renderVolumeTable(vol);
  renderBreakdownList(vol);
}

function renderVolumeTable(vol) {
  const tbody = document.getElementById("volume-tbody");
  tbody.innerHTML = "";

  MUSCLE_GROUPS.forEach((group) => {
    const data = vol[group.id];
    const direct = data.directSets;
    const status = classifyVolume(direct, group);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${group.label}</td>
      <td><strong>${direct} set${direct !== 1 ? "s" : ""}</strong></td>
      <td style="color:var(--color-text-muted)">${group.suggestedMin}–${group.suggestedMax}</td>
      <td><span class="status-badge ${STATUS_CSS[status]}">${STATUS_LABELS[status]}</span></td>
      <td style="width:16px;text-align:right;color:var(--color-text-muted);font-size:11px">
        ${data.secondarySets > 0 ? `<span title="${data.secondarySets} indirect set${data.secondarySets !== 1 ? "s" : ""}">+${data.secondarySets}&#x1d4a;*</span>` : ""}
      </td>`;
    tbody.appendChild(tr);
  });
}

function renderBreakdownList(vol) {
  const container = document.getElementById("breakdown-list");

  // Preserve open state
  const openGroups = new Set();
  container.querySelectorAll(".breakdown-item.is-open").forEach((el) => {
    openGroups.add(el.dataset.groupId);
  });

  container.innerHTML = "";

  MUSCLE_GROUPS.forEach((group) => {
    const data = vol[group.id];
    const direct = data.directSets;
    const hasActivity = direct > 0 || data.secondarySets > 0;
    const isOpen = openGroups.has(group.id);

    const item = document.createElement("div");
    item.className = `breakdown-item${isOpen ? " is-open" : ""}`;
    item.dataset.groupId = group.id;

    // Sub-muscle rows
    let subRows = "";
    let maxSets = Math.max(1, ...group.subMuscles.map((s) => data.bySubMuscle[s.id] || 0));
    group.subMuscles.forEach((sub) => {
      const sets = data.bySubMuscle[sub.id] || 0;
      const pct = direct > 0 ? Math.round((sets / direct) * 100) : 0;
      const barPct = Math.round((sets / maxSets) * 100);
      subRows += `
        <tr>
          <td>${sub.label}</td>
          <td>${sets} set${sets !== 1 ? "s" : ""}</td>
          <td>${direct > 0 ? pct + "%" : "—"}</td>
          <td>
            <div class="sub-bar-wrap">
              <div class="sub-bar-fill" style="width:${barPct}%"></div>
            </div>
          </td>
        </tr>`;
    });

    const secNote = data.secondarySets > 0
      ? `<p class="secondary-note">+ ${data.secondarySets} indirect/secondary set${data.secondarySets !== 1 ? "s" : ""} (not counted in direct total)</p>`
      : "";

    item.innerHTML = `
      <div class="breakdown-item__head" data-group="${group.id}">
        <span class="breakdown-dot${hasActivity ? "" : " breakdown-dot--empty"}"></span>
        <span class="breakdown-item__name">${group.label}</span>
        <span class="breakdown-item__sets">${direct} direct set${direct !== 1 ? "s" : ""}</span>
        <span class="breakdown-chevron">&#9660;</span>
      </div>
      <div class="breakdown-item__detail">
        ${group.subMuscles.length > 1 ? `
          <table class="sub-muscle-table">
            <thead>
              <tr><th>Muscle (Primary)</th><th>Direct Sets</th><th>% of ${group.label}</th><th>Visual</th></tr>
            </thead>
            <tbody>${subRows}</tbody>
            <tfoot>
              <tr><td>Total</td><td>${direct} sets</td><td>${direct > 0 ? "100%" : "—"}</td><td></td></tr>
            </tfoot>
          </table>` : `<p class="field-note" style="margin:4px 0">${direct} direct set${direct !== 1 ? "s" : ""} this week.</p>`}
        ${secNote}
      </div>`;

    container.appendChild(item);
  });
}

/* ---- Event wiring ---- */

function wireEvents() {
  // Week navigation
  document.getElementById("week-select").addEventListener("change", (e) => switchWeek(e.target.value));
  document.getElementById("prev-week-btn").addEventListener("click", () => switchWeek(prevWeekKey(appState.activeWeekKey)));
  document.getElementById("next-week-btn").addEventListener("click", () => switchWeek(nextWeekKey(appState.activeWeekKey)));

  // Days container (event delegation)
  document.getElementById("days-container").addEventListener("click", handleDaysClick);

  // Breakdown list (event delegation)
  document.getElementById("breakdown-list").addEventListener("click", (e) => {
    const head = e.target.closest(".breakdown-item__head");
    if (!head) return;
    const item = head.closest(".breakdown-item");
    if (item) item.classList.toggle("is-open");
  });

  // Modal
  document.getElementById("modal-close-btn").addEventListener("click", closeExerciseModal);
  document.getElementById("modal-cancel-btn").addEventListener("click", closeExerciseModal);
  document.getElementById("modal-save-btn").addEventListener("click", saveExercise);
  document.getElementById("exercise-modal-overlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeExerciseModal();
  });

  // Day-name modal
  document.getElementById("day-modal-close").addEventListener("click", closeDayModal);
  document.getElementById("day-modal-cancel").addEventListener("click", closeDayModal);
  document.getElementById("day-modal-save").addEventListener("click", saveDayName);
  document.getElementById("day-modal-overlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeDayModal();
  });

  // Keyboard close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeExerciseModal(); closeDayModal(); }
  });

  // Footer actions
  document.getElementById("reset-week-btn").addEventListener("click", () => {
    if (!confirm("Reset this week? All exercises for the current week will be removed.")) return;
    appState.plan[appState.activeWeekKey] = createBlankWeek();
    savePlan();
    renderAll();
  });

  document.getElementById("clear-all-btn").addEventListener("click", () => {
    if (!confirm("Clear ALL workout data? This removes every week's plan and cannot be undone.")) return;
    clearAllWorkoutData();
    appState.plan = {};
    appState.activeWeekKey = dateToWeekKey(new Date());
    ensureWeek(appState.activeWeekKey);
    buildWeekSelect();
    renderAll();
  });
}

/* ---- Days container click handler ---- */

function handleDaysClick(e) {
  // If a button with data-action was clicked, handle it — don't toggle
  const btn = e.target.closest("[data-action]");
  if (btn) {
    const action = btn.dataset.action;
    const dayId  = btn.dataset.day;
    const exId   = btn.dataset.ex;

    switch (action) {
      case "add-workout":
        openDayModal(dayId, "");
        break;
      case "edit-day":
        openDayModal(dayId, getDayObj(dayId)?.workoutName || "");
        break;
      case "clear-day":
        if (!confirm("Remove this day's workout and all its exercises?")) return;
        clearDay(dayId);
        break;
      case "add-exercise":
        openExerciseModal("add", dayId, null);
        document.querySelectorAll(`.day-row[data-day-id="${dayId}"]`).forEach((r) => r.classList.add("is-open"));
        break;
      case "edit-exercise":
        openExerciseModal("edit", dayId, exId);
        break;
      case "remove-exercise":
        removeExercise(dayId, exId);
        break;
    }
    return; // don't fall through to toggle
  }

  // Toggle open/close when clicking the head area (not a button)
  const head = e.target.closest("[data-toggle-day]");
  if (head) {
    const row = head.closest(".day-row");
    if (row) row.classList.toggle("is-open");
  }
}

/* ---- Day operations ---- */

function clearDay(dayId) {
  const day = getDayObj(dayId);
  if (!day) return;
  day.workoutName = "";
  day.exercises = [];
  savePlan();
  renderAll();
}

/* ---- Day name modal ---- */

function openDayModal(dayId, currentName) {
  appState.dayModal.targetDayId = dayId;
  document.getElementById("day-name-input").value = currentName;
  document.getElementById("day-modal-title").textContent = currentName ? "Rename Workout" : "Add Workout";
  document.getElementById("day-modal-overlay").classList.remove("is-hidden");
  document.getElementById("day-name-input").focus();
}

function closeDayModal() {
  document.getElementById("day-modal-overlay").classList.add("is-hidden");
  appState.dayModal.targetDayId = null;
}

function saveDayName() {
  const name = document.getElementById("day-name-input").value.trim();
  if (!name) { document.getElementById("day-name-input").focus(); return; }

  const dayId = appState.dayModal.targetDayId;
  const day = getDayObj(dayId);
  if (day) {
    day.workoutName = name;
    // Open the row after naming
    savePlan();
    closeDayModal();
    renderAll();
    // Re-open
    setTimeout(() => {
      document.querySelectorAll(`.day-row[data-day-id="${dayId}"]`).forEach((r) => r.classList.add("is-open"));
    }, 0);
  }
}

/* ---- Exercise modal ---- */

function openExerciseModal(mode, dayId, exId) {
  appState.modal.mode = mode;
  appState.modal.targetDayId = dayId;
  appState.modal.targetExId = exId;

  const title = document.getElementById("modal-title");
  const saveBtn = document.getElementById("modal-save-btn");

  if (mode === "edit") {
    const day = getDayObj(dayId);
    const ex = day?.exercises.find((e) => e.id === exId);
    if (!ex) return;

    title.textContent = "Edit Exercise";
    saveBtn.textContent = "Save Changes";

    document.getElementById("ex-name").value = ex.name || "";
    document.getElementById("ex-primary").value = ex.primaryMuscle || "";
    document.getElementById("ex-secondary").value = ex.secondaryMuscle || "";
    document.getElementById("ex-sets").value = ex.sets || 3;
    document.getElementById("ex-reps").value = ex.reps || "";
    document.getElementById("ex-rest").value = ex.rest || "";
  } else {
    title.textContent = "Add Exercise";
    saveBtn.textContent = "Add Exercise";

    document.getElementById("ex-name").value = "";
    document.getElementById("ex-primary").value = "";
    document.getElementById("ex-secondary").value = "";
    document.getElementById("ex-sets").value = 3;
    document.getElementById("ex-reps").value = "8–12";
    document.getElementById("ex-rest").value = "";
  }

  document.getElementById("exercise-modal-overlay").classList.remove("is-hidden");
  document.getElementById("ex-name").focus();
}

function closeExerciseModal() {
  document.getElementById("exercise-modal-overlay").classList.add("is-hidden");
}

function saveExercise() {
  const name    = document.getElementById("ex-name").value.trim();
  const primary = document.getElementById("ex-primary").value;
  const secondary = document.getElementById("ex-secondary").value || "";
  const sets    = parseInt(document.getElementById("ex-sets").value, 10) || 1;
  const reps    = document.getElementById("ex-reps").value.trim();
  const rest    = document.getElementById("ex-rest").value.trim();

  if (!primary) {
    document.getElementById("ex-primary").focus();
    return;
  }

  const { mode, targetDayId, targetExId } = appState.modal;
  const day = getDayObj(targetDayId);
  if (!day) return;

  if (mode === "add") {
    day.exercises.push({
      id: newId(),
      name,
      primaryMuscle: primary,
      secondaryMuscle: secondary || null,
      sets,
      reps,
      rest
    });
  } else {
    const ex = day.exercises.find((e) => e.id === targetExId);
    if (ex) {
      ex.name = name;
      ex.primaryMuscle = primary;
      ex.secondaryMuscle = secondary || null;
      ex.sets = sets;
      ex.reps = reps;
      ex.rest = rest;
    }
  }

  savePlan();
  closeExerciseModal();
  renderAll();
  // Keep the edited day open
  setTimeout(() => {
    document.querySelectorAll(`.day-row[data-day-id="${targetDayId}"]`).forEach((r) => r.classList.add("is-open"));
  }, 0);
}

function removeExercise(dayId, exId) {
  const day = getDayObj(dayId);
  if (!day) return;
  day.exercises = day.exercises.filter((e) => e.id !== exId);
  savePlan();
  renderAll();
  setTimeout(() => {
    document.querySelectorAll(`.day-row[data-day-id="${dayId}"]`).forEach((r) => r.classList.add("is-open"));
  }, 0);
}

/* ---- Drag-and-drop reordering ---- */

let dragSrcDayId  = null;
let dragSrcExId   = null;

document.addEventListener("dragstart", (e) => {
  const tr = e.target.closest("tr[data-ex-id]");
  if (!tr) return;
  dragSrcDayId = tr.dataset.dayId;
  dragSrcExId  = tr.dataset.exId;
  tr.style.opacity = "0.5";
});

document.addEventListener("dragend", (e) => {
  const tr = e.target.closest("tr[data-ex-id]");
  if (tr) tr.style.opacity = "";
  document.querySelectorAll("tr.drag-over").forEach((r) => r.classList.remove("drag-over"));
});

document.addEventListener("dragover", (e) => {
  if (!dragSrcExId) return;           // no drag in progress
  e.preventDefault();                 // always allow drop
  const tr = e.target.closest("tr[data-ex-id]");
  if (!tr || tr.dataset.dayId !== dragSrcDayId) return;
  document.querySelectorAll("tr.drag-over").forEach((r) => r.classList.remove("drag-over"));
  tr.classList.add("drag-over");
});

document.addEventListener("drop", (e) => {
  const tr = e.target.closest("tr[data-ex-id]");
  if (!tr || tr.dataset.dayId !== dragSrcDayId || tr.dataset.exId === dragSrcExId) return;
  e.preventDefault();

  const day = getDayObj(dragSrcDayId);
  if (!day) return;

  const fromIdx = day.exercises.findIndex((ex) => ex.id === dragSrcExId);
  const toIdx   = day.exercises.findIndex((ex) => ex.id === tr.dataset.exId);
  if (fromIdx === -1 || toIdx === -1) return;

  const [moved] = day.exercises.splice(fromIdx, 1);
  day.exercises.splice(toIdx, 0, moved);

  savePlan();
  renderAll();
  setTimeout(() => {
    document.querySelectorAll(`.day-row[data-day-id="${dragSrcDayId}"]`).forEach((r) => r.classList.add("is-open"));
  }, 0);
});

/* ---- Utility ---- */

function escHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

/* ---- Boot ---- */
init();