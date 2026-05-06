// src/data/trainingTerms.ts
export const TRAINING_TERMS = {
  RPE: {
    title: "RPE",
    short: "Rate of Perceived Exertion (1-10 scale).",
    long: "A subjective measure of intensity. RPE 10 is max effort (0 reps left). RPE 8 means you could have done 2 more reps.",
  },
  sRPE: {
    title: "sRPE",
    short: "Session RPE (Total Workout Load).",
    long: "Calculated as Intensity x Duration. Tracks neurological and physical fatigue to optimize recovery protocols.",
  },
  CNS: {
    title: "CNS Load",
    short: "Central Nervous System fatigue levels.",
    long: "Heavy lifting drains your neural 'battery.' High CNS load requires lower intensity or longer rest to prevent burnout.",
  },
  "1RM": {
    title: "1RM %",
    short: "Percentage of your One-Rep Max.",
    long: "The baseline for your training blocks. Percentages (e.g., 70%) are calculated from your heaviest verified lift.",
  },
  Volume: {
    title: "Volume",
    short: "Total tonnage moved (Sets x Reps x Weight).",
    long: "A primary driver for hypertrophy. Tracking weekly accumulation helps manage progressive overload without overtraining.",
  },
  Readiness: {
    title: "Readiness",
    short: "Your physical and psychological preparedeness for training.",
    long: "Calculated based on recent volume, CNS load, and sleep data. A high Readiness score (80%+) suggests you are primed for high-intensity work.",
  },
  Sleep: {
    title: "Sleep Quality",
    short: "The foundation of systemic recovery.",
    long: "Deep sleep cycles are where hormonal regulation and tissue repair occur. Poor sleep quality directly reduces neurological drive and force production capability.",
  },
  Stress: {
    title: "Allostatic Load",
    short: "Non-training stressors impacting recovery.",
    long: "Life stress (work, psychological) competes for the same adaptive resources as training. High allostatic load reduces your recovery ceiling and increases injury risk.",
  },
  ACWR: {
    title: "Acute:Chronic Workload Ratio",
    short: "Ratio of current training load to chronic average.",
    long: "Tracks training intensity trends. A ratio between 0.8 and 1.3 is generally 'optimal'. Higher values may indicate elevated injury risk, lower values may indicate detraining.",
  },
  Percentile: {
    title: "Population Percentile",
    short: "Your relative strength compared to the general population.",
    long: "Calculated using ExRx.net's strength standards, which consider your gender, age, body weight, and total payload for the main lifts (Squat, Bench, Deadlift).",
  },
  ProgramImpact: {
    title: "Program Impact",
    short: "Interference effects from non-program activity.",
    long: "mTOR Interference: High-intensity aerobic work competes with hypertrophy pathways, potentially blunting maximum strength gains if programmed too closely together.",
  },
  jointStress: {
    title: "Joint Stress Balance",
    short: "Ratio of high-impact work to low-impact recovery.",
    long: "Tracks the structural cost of your training. Maintaining a balance between high-intensity loading and low-impact restoration is critical for long-term joint health and longevity.",
  }
} as const;

export type TermKey = keyof typeof TRAINING_TERMS;
