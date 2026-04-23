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
  }
} as const;

export type TermKey = keyof typeof TRAINING_TERMS;
