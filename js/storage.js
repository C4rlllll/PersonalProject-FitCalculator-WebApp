const STORAGE_KEYS = {
  PLAN:         "fitcalc_workout_plan",
  ACTIVE_WEEK:  "fitcalc_active_week",
  TDEE_INPUTS:  "fitcalc_tdee_inputs",
  GOAL:         "fitcalc_goal",
  MACROS:       "fitcalc_macros"
};

function saveLocalData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("FitCalc: localStorage write failed", err);
    alert("Could not save your data — storage may be full. Try clearing old weeks.");
  }
}

function loadLocalData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("FitCalc: localStorage read failed", err);
    return fallback;
  }
}

function clearAllWorkoutData() {
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
}

/* ---- Week-key helpers ---- */

/**
 * Return the ISO week key for a Date: "YYYY-WNN" (Monday-based).
 */
function dateToWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7; // make Sunday = 7
  d.setUTCDate(d.getUTCDate() + 4 - day); // nearest Thursday
  const year = d.getUTCFullYear();
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const weekNum = Math.ceil((((d - startOfYear) / 86400000) + 1) / 7);
  return `${year}-W${String(weekNum).padStart(2, "0")}`;
}

/**
 * Return the Monday Date for a given "YYYY-WNN" key.
 */
function weekKeyToMonday(weekKey) {
  const [year, wPart] = weekKey.split("-W");
  const y = parseInt(year, 10);
  const w = parseInt(wPart, 10);
  // Jan 4 is always in week 1
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1) + (w - 1) * 7);
  return monday;
}

/**
 * Format a week key into a human label: "Week N (Mon DD MMM – Sun DD MMM)".
 * We number weeks starting from the earliest stored key or the current week.
 */
function formatWeekLabel(weekKey, weekNumber) {
  const monday = weekKeyToMonday(weekKey);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `Week ${weekNumber} (${fmt(monday)} – ${fmt(sunday)})`;
}

function prevWeekKey(weekKey) {
  const monday = weekKeyToMonday(weekKey);
  monday.setUTCDate(monday.getUTCDate() - 7);
  return dateToWeekKey(monday);
}

function nextWeekKey(weekKey) {
  const monday = weekKeyToMonday(weekKey);
  monday.setUTCDate(monday.getUTCDate() + 7);
  return dateToWeekKey(monday);
}

/** Format a date as "Mon DD" e.g. "May 19". */
function formatDayDate(monday, dayIndex) {
  const d = new Date(monday);
  d.setUTCDate(monday.getUTCDate() + dayIndex);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}