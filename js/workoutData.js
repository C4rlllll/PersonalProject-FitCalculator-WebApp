const MUSCLE_GROUPS = [
  {
    id: "chest",
    label: "Chest",
    suggestedMin: 8, suggestedMax: 10,
    subMuscles: [
      { id: "upper_chest",  label: "Upper Chest" },
      { id: "mid_chest",    label: "Mid Chest" },
      { id: "lower_chest",  label: "Lower Chest" }
    ]
  },
  {
    id: "back",
    label: "Back",
    suggestedMin: 8, suggestedMax: 12,
    subMuscles: [
      { id: "lats",         label: "Lats" },
      { id: "upper_back",   label: "Upper Back" },
      { id: "traps",        label: "Traps" }
    ]
  },
  {
    id: "shoulders",
    label: "Shoulders",
    suggestedMin: 8, suggestedMax: 12,
    subMuscles: [
      { id: "front_delts",  label: "Front Delts" },
      { id: "side_delts",   label: "Side Delts" },
      { id: "rear_delts",   label: "Rear Delts" }
    ]
  },
  {
    id: "biceps",
    label: "Biceps",
    suggestedMin: 6, suggestedMax: 10,
    subMuscles: [
      { id: "biceps",       label: "Biceps" }
    ]
  },
  {
    id: "triceps",
    label: "Triceps",
    suggestedMin: 6, suggestedMax: 10,
    subMuscles: [
      { id: "triceps",      label: "Triceps" }
    ]
  },
  {
    id: "forearms",
    label: "Forearms",
    suggestedMin: 4, suggestedMax: 8,
    subMuscles: [
      { id: "forearm_flexors",   label: "Forearm Flexors" },
      { id: "forearm_extensors", label: "Forearm Extensors" }
    ]
  },
  {
    id: "quads",
    label: "Quads",
    suggestedMin: 8, suggestedMax: 12,
    subMuscles: [
      { id: "quads",        label: "Quads" }
    ]
  },
  {
    id: "hamstrings",
    label: "Hamstrings",
    suggestedMin: 6, suggestedMax: 10,
    subMuscles: [
      { id: "hamstrings",   label: "Hamstrings" }
    ]
  },
  {
    id: "glutes",
    label: "Glutes",
    suggestedMin: 6, suggestedMax: 10,
    subMuscles: [
      { id: "glutes",       label: "Glutes" }
    ]
  },
  {
    id: "calves",
    label: "Calves",
    suggestedMin: 6, suggestedMax: 10,
    subMuscles: [
      { id: "calves",       label: "Calves" }
    ]
  },
  {
    id: "abs",
    label: "Abs / Core",
    suggestedMin: 0, suggestedMax: 16,
    subMuscles: [
      { id: "abs",          label: "Abs / Core" }
    ]
  }
];

/**
 * ALL_MUSCLE_TARGETS: flat list of every selectable sub-muscle target,
 * with a pointer back to its parent group. Used to populate <select> menus.
 */
const ALL_MUSCLE_TARGETS = MUSCLE_GROUPS.flatMap((group) =>
  group.subMuscles.map((sub) => ({
    id: sub.id,
    label: sub.label,
    groupId: group.id,
    groupLabel: group.label
  }))
);

/** Look up a sub-muscle target by id. Returns null if not found. */
function findMuscleTarget(id) {
  return ALL_MUSCLE_TARGETS.find((m) => m.id === id) || null;
}

/** Look up a group by its id. Returns null if not found. */
function findMuscleGroup(id) {
  return MUSCLE_GROUPS.find((g) => g.id === id) || null;
}

/**
 * Given a sub-muscle id, return the parent group id.
 */
function getGroupId(subMuscleId) {
  const target = findMuscleTarget(subMuscleId);
  return target ? target.groupId : null;
}

/**
 * DAYS: the canonical 7-day structure for a week.
 */
const WEEK_DAYS = [
  { id: "mon", label: "Monday",    short: "MON" },
  { id: "tue", label: "Tuesday",   short: "TUE" },
  { id: "wed", label: "Wednesday", short: "WED" },
  { id: "thu", label: "Thursday",  short: "THU" },
  { id: "fri", label: "Friday",    short: "FRI" },
  { id: "sat", label: "Saturday",  short: "SAT" },
  { id: "sun", label: "Sunday",    short: "SUN" }
];

/** Generate an id string for a new exercise entry. */
function newId() {
  return `ex_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}


function createBlankWeek() {
  return WEEK_DAYS.map((d) => ({
    dayId:       d.id,
    workoutName: "",     // empty = rest day
    exercises:   []
  }));
}