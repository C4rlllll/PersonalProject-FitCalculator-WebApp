# FitCalc

A lightweight, client-side fitness utility. No accounts. No tracking. No backend required.

FitCalc has two tools:

- **TDEE Calculator** — estimates your BMR, TDEE, daily calorie target, and macros based on your stats and goal.
- **Workout Planner** — lets you build a weekly training plan by day and tracks your weekly muscle volume against general resistance-training guidelines.

## Project Structure

```
fitcalc/
│
├── index.html              # TDEE Calculator page
├── workout.html            # Workout Planner page
│
├── css/
│   ├── style.css           # Base styles shared across all pages
│   ├── tdee.css            # TDEE Calculator page styles
│   └── workout.css         # Workout Planner page styles
│
├── js/
│   ├── storage.js          # localStorage helpers + ISO week-key utilities
│   ├── ui.js               # Shared UI helpers (toggle buttons, show/hide)
│   ├── tdee.js             # TDEE form, state, BMR/TDEE calculation
│   ├── macros.js           # Macro preset selection, sliders, gram calculation
│   ├── workoutData.js      # Static reference data: muscle groups, sub-muscles, guidelines
│   ├── analytics.js        # Weekly volume aggregation and status classification
│   └── workout.js          # Workout Planner main controller
│
└── image/
    └── bodyfatRef.jpg      # Body fat % reference chart (used in TDEE popup)
```
## TDEE Calculator

### How it works

1. Enter your gender, age, weight, height, and activity level.
2. Optionally enter your body fat percentage.
3. Select a goal — **Cut**, **Maintain**, or **Bulk** — and a calorie adjustment amount.
4. Hit **Calculate**.

BMR is calculated using the **Mifflin-St Jeor formula**:

```
Men:    BMR = (10 × weight kg) + (6.25 × height cm) − (5 × age) + 5
Women:  BMR = (10 × weight kg) + (6.25 × height cm) − (5 × age) − 161
TDEE    = BMR × activity multiplier
```

The daily calorie target is then adjusted based on the selected goal and deficit/surplus amount.

### Macros

Macro splits are calculated from the daily calorie target using preset ratios (Balanced, High Protein, High Carb, High Fat) or fully customizable sliders. Protein is anchored to bodyweight (1 g/lb), and remaining calories are split between carbs and fat proportionally.

## Workout Planner

### How it works

The planner is organized by **week**. Each week has 7 independent day slots. Days are either a **rest day** or a named workout (e.g. Push, Pull, Legs).

For each workout day you can add exercises with:

| Field | Description |
|---|---|
| Exercise Name | Free text, e.g. "Barbell Bench Press" |
| Primary Muscle Target | The main muscle being trained (direct sets) |
| Secondary Muscle Target | Optional — indirect/secondary volume, not counted as direct sets |
| Working Sets | Hard sets only — warm-up sets excluded |
| Rep Range | e.g. 8–12 |
| Rest Time | Optional, e.g. 2–3 min |

Exercises within a day can be **drag-and-drop reordered**.

### Muscle target system

Larger muscle groups are broken into specific sub-targets:

| Group | Sub-targets |
|---|---|
| Chest | Upper Chest, Mid Chest, Lower Chest |
| Back | Lats, Upper Back, Traps |
| Shoulders | Front Delts, Side Delts, Rear Delts |
| Biceps | Biceps |
| Triceps | Triceps |
| Quads | Quads |
| Hamstrings | Hamstrings |
| Glutes | Glutes |
| Calves | Calves |
| Abs / Core | Abs / Core |

### Weekly Analytics

The right-hand panel updates in real time as you build your plan.

**Weekly Muscle Volume table** shows, for each group:
- Total direct sets this week
- Suggested starting range
- Status: `Below Range` / `Within Range` / `Above Range`
- Secondary/indirect sets shown separately — never added to the direct total

**Muscle Breakdown** lets you expand any group to see how your direct sets are distributed across its sub-targets, with a proportional bar for each. For example, expanding Shoulders shows how many sets went to Front Delts vs. Side Delts vs. Rear Delts — useful for spotting imbalances.

### Suggested weekly set ranges

These are general starting points based on commonly cited resistance-training volume research. They are not universal prescriptions — adjust based on your recovery, experience level, and goals.

| Muscle Group | Suggested Range |
|---|---|
| Chest | 8–10 sets/week |
| Back | 8–12 sets/week |
| Shoulders | 8–12 sets/week |
| Biceps | 6–10 sets/week |
| Triceps | 6–10 sets/week |
| Quads | 8–12 sets/week |
| Hamstrings | 6–10 sets/week |
| Glutes | 6–10 sets/week |
| Calves | 6–10 sets/week |

## Data & Privacy

All data is saved to **localStorage** in the browser. Nothing is sent to any server.

Stored keys:

| Key | Contents |
|---|---|
| `fitcalc_tdee_inputs` | Last TDEE form inputs |
| `fitcalc_goal` | Selected goal |
| `fitcalc_macros` | Macro slider state |
| `fitcalc_workout_plan` | Full weekly workout plan (all weeks) |
| `fitcalc_active_week` | Currently selected week key |

Use **Reset Week** to clear the current week's exercises, or **Clear All Data** to wipe everything. Both require confirmation.

Notes

- Calorie and macro estimates are for educational and planning purposes only. Individual needs vary.
- Volume guidelines reflect general research summaries, not personalized medical or coaching advice.