function setActiveToggle(groupId, activeBtn) {
  const group = document.getElementById(groupId);
  group.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn === activeBtn);
  });
}

function clearActiveToggle(groupId) {
  const group = document.getElementById(groupId);
  group.querySelectorAll(".toggle-btn").forEach((btn) => btn.classList.remove("is-active"));
}

function revealSection(sectionId) {
  document.getElementById(sectionId).classList.remove("is-hidden");
}

function hideSection(sectionId) {
  document.getElementById(sectionId).classList.add("is-hidden");
}

function renderCalorieResult() {
  document.getElementById("result-bmr").textContent =
    tdeeState.bmr != null ? `${Math.round(tdeeState.bmr)} kcal/day` : "—";

  document.getElementById("result-tdee").textContent =
    tdeeState.tdee != null ? `${Math.round(tdeeState.tdee)} kcal/day` : "—";

  const goalLabels = { cut: "Cut", maintain: "Maintain", bulk: "Bulk" };
  document.getElementById("result-goal").textContent = goalLabels[tdeeState.goal] || "—";

  let adjustmentText = "—";
  if (tdeeState.goal === "cut" && tdeeState.cutAmount) {
    adjustmentText = `-${tdeeState.cutAmount} kcal`;
  } else if (tdeeState.goal === "bulk" && tdeeState.bulkAmount) {
    adjustmentText = `+${tdeeState.bulkAmount} kcal`;
  } else if (tdeeState.goal === "maintain") {
    adjustmentText = "None";
  }
  document.getElementById("result-adjustment").textContent = adjustmentText;

  document.getElementById("result-target").textContent =
    tdeeState.dailyTarget != null ? `${Math.round(tdeeState.dailyTarget)} kcal/day` : "— kcal/day";
}