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
  EWMA: {
    title: "Exponentially Weighted Moving Average",
    short: "Ratio of acute (7-day) to chronic (28-day) training load.",
    long: "Calculates the training load ratio, prioritizing recent workloads. A ratio between 0.8 and 1.3 is optimal. Higher values indicate elevated risk.",
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
  },
  DeploymentObjectives: {
    title: "Deployment Objectives",
    short: "The primary goals of your training sequence.",
    long: "Pure Strength: Max force. Powerbuilding: Strength & size. Hypertrophy: Muscle growth. Longevity: Health & durability. Tactical: Field-ready fitness. Explosiveness: Power. Endurance: Stamina. Prehab: Injury prevention.",
  },
  HeavyPrimary: {
    title: "Heavy Primary",
    short: "High-intensity compound lift designed for maximum strength development.",
    long: "Heavy Primary exercises constitute the cornerstone of your strength session. They are heavy compound movements (like Squats, Bench Press, and Deadlifts) performed at high intensity with lower reps and higher rest intervals to maximize neurological drive and force production.",
  },
  Hypertrophy: {
    title: "Hypertrophy",
    short: "Moderate intensity, moderate rep range work designed for muscle growth (size).",
    long: "Hypertrophy training focuses on maximizing mechanical tension and metabolic stress. Typically performed with moderate loads (68% - 80% 1RM) in the 8 to 15 repetition range, it triggers muscle cell enlargement and size adaptation.",
  },
  BloodFlow: {
    title: "Blood Flow",
    short: "High repetition, low impact recovery or pump training.",
    long: "Blood Flow training leverages extremely high repetitions (15-25+) with lighter, non-taxing loads to flush oxygenated blood and essential nutrients into fatigued muscle tissue and connective tendons, speeding up recovery and tissue repair while minimizing joint stress.",
  },
  Mission: {
    title: "Mission",
    short: "Your scheduled workouts, defined as targeted 'missions'.",
    long: "We use the term 'Mission' to emphasize that your workout isn't just exercise—it's a tactical engagement with specific objectives. Every mission has a clear purpose, defined parameters, and a measurable outcome required for operational success.",
  },
  Deployment: {
    title: "Deployment",
    short: "Your ongoing long-term training program.",
    long: "A 'Deployment' represents a sustained training cycle or program. Just as a deployment in the field has a defined roadmap, start/end dates, and strategic goals, your training deployment structures your weekly missions to reach a specific, high-level operational objective over the long term.",
  }
} as const;

export type TermKey = keyof typeof TRAINING_TERMS;
