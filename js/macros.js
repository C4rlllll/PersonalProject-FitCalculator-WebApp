const MACRO_PRESETS = {
  balanced:      { protein: 30, carbs: 40, fat: 30 },
  high_protein:  { protein: 40, carbs: 30, fat: 30 },
  high_carb:     { protein: 25, carbs: 50, fat: 25 },
  high_fat:      { protein: 25, carbs: 30, fat: 45 }
};

const macroState = {
  protein: 30,
  carbs: 40,
  fat: 30
};

/* ---------------- Preset buttons ---------------- */

document.getElementById("macro-preset-toggle").addEventListener("click", (e) => {
  const btn = e.target.closest(".toggle-btn");
  if (!btn) return;

  setActiveToggle("macro-preset-toggle", btn);
  const preset = MACRO_PRESETS[btn.dataset.value];
  if (!preset) return;

  macroState.protein = preset.protein;
  macroState.carbs = preset.carbs;
  macroState.fat = preset.fat;

  syncSlidersFromState();
  updateMacroDistribution();
});

/* ---------------- Manual sliders ---------------- */

["protein", "carbs", "fat"].forEach((macro) => {
  document.getElementById(`${macro}-pct`).addEventListener("input", (e) => {
    macroState[macro] = Number(e.target.value);
    document.getElementById(`${macro}-pct-label`).textContent = `${macroState[macro]}%`;

    // Deselect any active preset since the user is now customizing manually.
    clearActiveToggle("macro-preset-toggle");

    enforceMacroTotal(macro);
    updateMacroDistribution();
  });
});

function syncSlidersFromState() {
  ["protein", "carbs", "fat"].forEach((macro) => {
    document.getElementById(`${macro}-pct`).value = macroState[macro];
    document.getElementById(`${macro}-pct-label`).textContent = `${macroState[macro]}%`;
  });
}

/**
 * Keep protein + carbs + fat exactly at 100% after the user drags one slider.
 * TODO (student implementation): decide how the remaining two macros should
 * absorb the difference (e.g. proportionally split between the other two,
 * or take it entirely from carbs). A simple starting approach is provided
 * below — feel free to replace it.
 */
function enforceMacroTotal(changedMacro) {
  const others = ["protein", "carbs", "fat"].filter((m) => m !== changedMacro);
  const othersTotal = others.reduce((sum, m) => sum + macroState[m], 0);
  const maxAllowed = 100 - othersTotal;

  if (macroState[changedMacro] > maxAllowed) {
    macroState[changedMacro] = maxAllowed;
    document.getElementById(`${changedMacro}-pct`).value = maxAllowed;
    document.getElementById(`${changedMacro}-pct-label`).textContent = `${maxAllowed}%`;
  }
}

/* ---------------- Grams + calories per macro ---------------- */

/**
 * Convert the current macro percentages into grams and per-macro calories,
 * based on the daily calorie target calculated in tdee.js.
 *
 * TODO (student implementation):
 *   Protein: 4 kcal/g
 *   Carbohydrates: 4 kcal/g
 *   Fat: 9 kcal/g
 *
 *   grams = (dailyTarget * percent / 100) / kcalPerGram
 */
const LBS_PER_KG = 1 / 0.45359237;

function calculateMacros() {
  const target = tdeeState.dailyTarget;
  if (target == null || tdeeState.weight == null) {
    return { proteinGrams: null, carbsGrams: null, fatGrams: null };
  }

  const weightLbs = tdeeState.weight * LBS_PER_KG;

  // 0.8–1g protein per lb bodyweight — using 1g/lb (top of range, common default).
  // Lower toward 0.8 for a more conservative target if you'd rather adjust it.
  const PROTEIN_G_PER_LB = 1;
  const proteinGrams = Math.round(weightLbs * PROTEIN_G_PER_LB);
  const proteinCalories = proteinGrams * 4;

  // Remaining calories after protein are split between carbs/fat using
  // whatever ratio the carb/fat sliders are currently set to.
  const remainingCalories = Math.max(target - proteinCalories, 0);
  const carbFatTotalPct = macroState.carbs + macroState.fat || 1; // avoid divide-by-zero
  const carbsGrams = Math.round((remainingCalories * (macroState.carbs / carbFatTotalPct)) / 4);
  const fatGrams = Math.round((remainingCalories * (macroState.fat / carbFatTotalPct)) / 9);

  return { proteinGrams, carbsGrams, fatGrams };
}

function updateMacroDistribution() {
  // Update the visual distribution bar regardless of whether a calorie
  // target exists yet, since percentages alone are enough for the bar.
  const total = macroState.protein + macroState.carbs + macroState.fat;
  document.getElementById("macro-total-hint").textContent = `Total: ${total}%`;
  document.getElementById("bar-protein").style.width = `${macroState.protein}%`;
  document.getElementById("bar-carbs").style.width = `${macroState.carbs}%`;
  document.getElementById("bar-fat").style.width = `${macroState.fat}%`;

  document.getElementById("macro-protein-pct").textContent = `${macroState.protein}%`;
  document.getElementById("macro-carbs-pct").textContent = `${macroState.carbs}%`;
  document.getElementById("macro-fat-pct").textContent = `${macroState.fat}%`;

  const macros = calculateMacros();

  document.getElementById("macro-protein-grams").textContent =
    macros.proteinGrams != null ? `${macros.proteinGrams} g` : "— g";
  document.getElementById("macro-carbs-grams").textContent =
    macros.carbsGrams != null ? `${macros.carbsGrams} g` : "— g";
  document.getElementById("macro-fat-grams").textContent =
    macros.fatGrams != null ? `${macros.fatGrams} g` : "— g";

  saveLocalData(STORAGE_KEYS.MACROS, macroState);
}

function clampToTwoDecimals(e) {
  if (e.target.value === "") return;
  e.target.value = Number(e.target.value).toFixed(2);
}
["weight", "height-cm", "height-in", "bodyfat"].forEach((id) => {
  document.getElementById(id).addEventListener("blur", clampToTwoDecimals);
});