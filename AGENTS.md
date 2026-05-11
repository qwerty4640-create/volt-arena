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
