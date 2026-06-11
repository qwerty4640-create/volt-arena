# Project Persistence Rules

## Design Principles
- **Aesthetic**: Tactical.
- **Rules**:
  - NEVER use rounded corners (`border-radius: 0 !important`).
  - ALWAYS use `Inter` with heavy /uppercase styling for primary headings.
  - USE `volt` (#00b6ff) for primary cyan highlights.
  - REFER to `DESIGN_SYSTEM.md` and `design-system.json` for detailed tokens and patterns.
  - **Button Hierarchy**:
    - PRIMARY: `btn-primary` (Volt background, Void text, Heavy tracking).
    - SECONDARY: `btn-secondary` (Dimmed background, Thin border, White text).
    - TERTIARY: `btn-tertiary` (Subtle background, Ghost button feel).

## Performance & State
- **Readiness Formula**: Use the "Sum of Drains" scientific model (Readiness = 100 - Sleep_Deficit - Fatigue - Stress).
- **Decay**: Fatigue and Stress decay exponentially toward baseline (1.0).
- **Recovery**: Sessions accelerate the decay rate rather than adding fixed points.

## Weight Prescription & Autoregulation Rules (!important)
- **Primary Main Lift Prescription Formula**:
  - For primary main lifts on Day 1, Day 2, and Day 3 (D1 Squat, D2 Bench Press, D3 Deadlift), the target top set prescription and working sets use the dynamic estimated 1RM (`estimated1RM`) multiplied by the **periodization block intensity** (`blockIntensity`).
  - **Readiness Interference**: These primary lifts on D1, D2, and D3 **MUST** be scaled dynamically by transient readiness, recovery, fatigue, and aerobic interference modifiers, but **ONLY AFTER** the user has entered the Readiness Check (HMS). The background tracking must not continuously update previews; updates occur reactively when the session is officially started.
- **Dynamic E1RM Anchoring Priority**:
  - The periodization engine **MUST** prioritize the dynamic estimated 1RM (`dynamicPR` or `dynamicPR > 0 ? dynamicPR : profilePR`) over the static profile PR. The dynamic E1RM is autoregulated and represents the user's high-rep performance baselines dynamically. DO NOT bypass `dynamicPR` to anchor to static profile PRs when `dynamicPR` is available.
