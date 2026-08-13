const tdeeState = {
  gender: "male",
  age: null,
  weight: null,       // always stored in kg internally
  height: null,        // always stored in cm internally
  weightUnit: "kg",     // "kg" | "lbs" — for display only
  heightUnit: "cm",      // "cm" | "ftin" — for display only
  activityLevel: null,
  bodyFatPercent: null,

  bmr: null,
  tdee: null,

  goal: null,          // "cut" | "maintain" | "bulk"
  cutAmount: null,      // 250 | 500 | 1000
  bulkAmount: null,     // 250 | 300
  dailyTarget: null
};

const LBS_TO_KG = 0.45359237;
const IN_TO_CM = 2.54;

/* ---------------- Body fat reference popup ---------------- */

document.getElementById("bodyfat-info-btn").addEventListener("click", () => {
  document.getElementById("bodyfat-popup-overlay").classList.remove("is-hidden");
});

document.getElementById("bodyfat-popup-close").addEventListener("click", () => {
  document.getElementById("bodyfat-popup-overlay").classList.add("is-hidden");
});

document.getElementById("bodyfat-popup-overlay").addEventListener("click", (e) => {
  if (e.target.id === "bodyfat-popup-overlay") {
    e.currentTarget.classList.add("is-hidden");
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.getElementById("bodyfat-popup-overlay").classList.add("is-hidden");
  }
});

/* ---------------- Gender toggle ---------------- */

document.getElementById("gender-toggle").addEventListener("click", (e) => {
  const btn = e.target.closest(".toggle-btn");
  if (!btn) return;
  setActiveToggle("gender-toggle", btn);
  tdeeState.gender = btn.dataset.value;
});

/* ---------------- Weight unit toggle ---------------- */

document.getElementById("weight-unit-toggle").addEventListener("click", (e) => {
  const btn = e.target.closest(".toggle-btn");
  if (!btn) return;
  setActiveToggle("weight-unit-toggle", btn);
  tdeeState.weightUnit = btn.dataset.value;
  document.getElementById("weight-suffix").textContent = tdeeState.weightUnit;

  const weightInput = document.getElementById("weight");
  if (tdeeState.weightUnit === "lbs") {
    weightInput.min = 66;
    weightInput.max = 660;
  } else {
    weightInput.min = 30;
    weightInput.max = 300;
  }
});

/* ---------------- Height unit toggle ---------------- */

document.getElementById("height-unit-toggle").addEventListener("click", (e) => {
  const btn = e.target.closest(".toggle-btn");
  if (!btn) return;
  setActiveToggle("height-unit-toggle", btn);
  tdeeState.heightUnit = btn.dataset.value;

  const isFtIn = tdeeState.heightUnit === "ftin";
  document.getElementById("height-cm-wrap").classList.toggle("is-hidden", isFtIn);
  document.getElementById("height-ftin-wrap").classList.toggle("is-hidden", !isFtIn);

  // Swap which fields are required so the browser doesn't block submit on a hidden field.
  document.getElementById("height-cm").required = !isFtIn;
  document.getElementById("height-ft").required = isFtIn;
});

/* ---------------- Goal toggle ---------------- */

document.getElementById("goal-toggle").addEventListener("click", (e) => {
  const btn = e.target.closest(".toggle-btn");
  if (!btn) return;
  setActiveToggle("goal-toggle", btn);
  tdeeState.goal = btn.dataset.value;
  showGoalOptions(tdeeState.goal);
  document.getElementById("steps-block").classList.remove("is-hidden");
  document.getElementById("goal-required-error").classList.add("is-hidden");
  recalculateGoalAndRender();
});

document.getElementById("cut-toggle").addEventListener("click", (e) => {
  const btn = e.target.closest(".toggle-btn");
  if (!btn) return;
  setActiveToggle("cut-toggle", btn);
  tdeeState.cutAmount = Number(btn.dataset.value);

  const warning = document.getElementById("aggressive-warning");
  warning.classList.toggle("is-hidden", tdeeState.cutAmount < 1000);

  recalculateGoalAndRender();
});

document.getElementById("bulk-toggle").addEventListener("click", (e) => {
  const btn = e.target.closest(".toggle-btn");
  if (!btn) return;
  setActiveToggle("bulk-toggle", btn);
  tdeeState.bulkAmount = Number(btn.dataset.value);
  recalculateGoalAndRender();
});

function showGoalOptions(goal) {
  document.getElementById("cut-options").classList.toggle("is-hidden", goal !== "cut");
  document.getElementById("maintain-options").classList.toggle("is-hidden", goal !== "maintain");
  document.getElementById("bulk-options").classList.toggle("is-hidden", goal !== "bulk");
}

/* ---------------- Unit conversion helpers ---------------- */

function readWeightInKg() {
  const raw = Number(document.getElementById("weight").value);
  return tdeeState.weightUnit === "lbs" ? raw * LBS_TO_KG : raw;
}

function readHeightInCm() {
  if (tdeeState.heightUnit === "ftin") {
    const feet = Number(document.getElementById("height-ft").value) || 0;
    const inches = Number(document.getElementById("height-in").value) || 0;
    return (feet * 12 + inches) * IN_TO_CM;
  }
  return Number(document.getElementById("height-cm").value);
}

/* ---------------- Form submit ---------------- */

document.getElementById("tdee-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  // A goal is required before any output is shown.
  if (!tdeeState.goal) {
    document.getElementById("goal-required-error").classList.remove("is-hidden");
    document.getElementById("goal-toggle").scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  document.getElementById("goal-required-error").classList.add("is-hidden");

  tdeeState.age = Number(document.getElementById("age").value);
  tdeeState.weight = readWeightInKg();
  tdeeState.height = readHeightInCm();
  tdeeState.activityLevel = document.getElementById("activity").value;

  const bodyFatInput = document.getElementById("bodyfat").value;
  tdeeState.bodyFatPercent = bodyFatInput ? Number(bodyFatInput) : null;

  const calculateBtn = document.getElementById("calculate-btn");
  calculateBtn.disabled = true;
  calculateBtn.textContent = "Calculating...";

  try {
    await calculateTDEE();
    saveLocalData(STORAGE_KEYS.TDEE_INPUTS, {
      gender: tdeeState.gender,
      age: tdeeState.age,
      weight: tdeeState.weight,
      height: tdeeState.height,
      activityLevel: tdeeState.activityLevel,
      bodyFatPercent: tdeeState.bodyFatPercent
    });

    revealSection("result-section");
    revealSection("macro-section");
    document.getElementById("results-placeholder").classList.add("is-hidden");

    calculateCalories();
    renderCalorieResult();
    updateMacroDistribution();
    renderStepsTarget();
  } catch (err) {
    console.error("FitCalc: TDEE calculation failed", err);
    alert("Something went wrong calculating your TDEE. Check the console for details.");
  } finally {
    calculateBtn.disabled = false;
    calculateBtn.textContent = "Calculate";
  }
});

/* ---------------- Calculation functions ---------------- */

/**
 * Calculates BMR + TDEE for the current form inputs, entirely in the
 * browser (no backend call). This replaces the earlier version that
 * POSTed to a Java server — the Java backend is parked for now and can
 * be swapped back in later (see api.js / TDEEController.java, both still
 * in the project, just unused for the moment).
 *
 * Formula: Mifflin-St Jeor
 *   Men:   BMR = 10*weight + 6.25*height - 5*age + 5
 *   Women: BMR = 10*weight + 6.25*height - 5*age - 161
 *   TDEE = BMR * activity multiplier
 */
async function calculateTDEE() {
  const { gender, age, weight, height, activityLevel } = tdeeState;

  const bmr = gender === "male"
    ? (10 * weight) + (6.25 * height) - (5 * age) + 5
    : (10 * weight) + (6.25 * height) - (5 * age) - 161;

  const ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;

  tdeeState.bmr = bmr;
  tdeeState.tdee = bmr * multiplier;
}

/**
 * Calculate BMI from the current weight/height in state.
 * TODO (student implementation): implement the BMI formula.
 * Formula reminder: BMI = weight(kg) / (height(m)^2)
 */
function calculateBMI() {
  // TODO: Student implementation
  // return tdeeState.weight / Math.pow(tdeeState.height / 100, 2);
}

/**
 * Apply the selected goal (cut / maintain / bulk) and adjustment amount to
 * TDEE, producing the final daily calorie target.
 *
 * TODO (student implementation):
 *   - if goal === "maintain": target = tdee
 *   - if goal === "cut": target = tdee - cutAmount
 *   - if goal === "bulk": target = tdee + bulkAmount
 */
function calculateCalories() {
  if (tdeeState.tdee == null || !tdeeState.goal) {
    tdeeState.dailyTarget = null;
    return;
  }

  if (tdeeState.goal === "maintain") {
    tdeeState.dailyTarget = tdeeState.tdee;
  } else if (tdeeState.goal === "cut") {
    tdeeState.dailyTarget = tdeeState.tdee - (tdeeState.cutAmount || 0);
  } else if (tdeeState.goal === "bulk") {
    tdeeState.dailyTarget = tdeeState.tdee + (tdeeState.bulkAmount || 0);
  }
}

function recalculateGoalAndRender() {
  calculateCalories();
  renderCalorieResult();
  updateMacroDistribution();
  renderStepsTarget();
}

/* ---------------- Steps recommendation ---------------- */

/**
 * Determine a practical daily step target based on the selected goal.
 * TODO (student implementation): adjust the target depending on goal.
 *   - cut: lean toward the higher end of the range (more activity can help
 *     support the deficit)
 *   - bulk: avoid pushing an unnecessarily high step count
 *   - maintain: use a reasonable baseline (e.g. 10,000)
 */
function calculateStepsTarget() {
  if (!tdeeState.goal) return null;

  if (tdeeState.goal === "cut") {
    if (tdeeState.cutAmount === 1000) return 12000;
    if (tdeeState.cutAmount === 500) return 11000;
    if (tdeeState.cutAmount === 250) return 10000;
    return 10000; // goal picked but no deficit size chosen yet
  }

  if (tdeeState.goal === "bulk") return 8000;

  return 10000; // maintain
}

function renderStepsTarget() {
  const target = calculateStepsTarget();
  document.getElementById("steps-target").textContent =
    target ? `${target.toLocaleString()} steps/day` : "— steps/day";
}