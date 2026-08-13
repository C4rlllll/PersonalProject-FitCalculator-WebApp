function calculateWeeklyVolume(days) {
  // Initialize every group and its sub-muscles to zero.
  const result = {};
  MUSCLE_GROUPS.forEach((group) => {
    result[group.id] = {
      directSets: 0,
      secondarySets: 0,
      bySubMuscle: {}
    };
    group.subMuscles.forEach((sub) => {
      result[group.id].bySubMuscle[sub.id] = 0;
    });
  });

  days.forEach((day) => {
    day.exercises.forEach((ex) => {
      const sets = ex.sets || 0;

      // Primary target → direct sets
      if (ex.primaryMuscle) {
        const groupId = getGroupId(ex.primaryMuscle);
        if (groupId && result[groupId]) {
          result[groupId].directSets += sets;
          if (result[groupId].bySubMuscle[ex.primaryMuscle] !== undefined) {
            result[groupId].bySubMuscle[ex.primaryMuscle] += sets;
          }
        }
      }

      // Secondary target → secondary/indirect sets only (not added to directSets)
      if (ex.secondaryMuscle) {
        const secGroupId = getGroupId(ex.secondaryMuscle);
        if (secGroupId && result[secGroupId]) {
          result[secGroupId].secondarySets += sets;
        }
      }
    });
  });

  return result;
}

/**
 * Classify a group's direct set count against its suggested range.
 * Returns "none" | "below" | "within" | "above"
 */
function classifyVolume(directSets, group) {
  if (directSets === 0) return "none";
  if (directSets < group.suggestedMin) return "below";
  if (directSets <= group.suggestedMax) return "within";
  return "above";
}

const STATUS_LABELS = {
  none:   "Not Trained",
  below:  "Below Range",
  within: "Within Range",
  above:  "Above Range"
};

const STATUS_CSS = {
  none:   "status-badge--none",
  below:  "status-badge--below",
  within: "status-badge--within",
  above:  "status-badge--above"
};