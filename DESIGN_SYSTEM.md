# Design System Documentation: Volt Arena

## 1. Visual Identity & Mood
- **Core Aesthetic**: Cyberpunk, Tactical, Brutalist, Rigorous Sports Science.
- **Philosophy**: "Hardware over Software." Interfaces should look like military-grade biometric monitors or high-performance ECU readouts.
- **Key Traits**: 
  - Zero border-radius (Hard edges only).
  - High contrast (Neon on Void).
  - Heavy usage of skewed/italic transformations.
  - Layered "HUD" (Heads-Up Display) elements.

## 2. Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `void` | `#0D0F0B` | Primary background. |
| `surface` | `#131313` | Secondary panels, container background. |
| `volt` | `#00b6ff` | Primary action (blue-cyan), functional highlights. |
| `yellow-500` | `#EAB308` | Warming up, secondary highlights. |
| `crimson` | `#FF8D7A` | Alerts, high stress, destructive actions. |
| `zinc-900` | `#18181B` | Neutral background for items. |

## 3. Typography
- **Primary Font**: `Inter` (sans-serif).
- **Styling Rules**:
  - **Headlines**: `font-black italic uppercase tracking-tighter`.
  - **Data/Technical**: `font-mono uppercase tracking-widest`.
  - **Captions**: `text-[10px] font-bold text-zinc-500 uppercase tracking-widest`.
- **Text Shadows**: Usage of `text-glow-volt` for high-importance metrics.

## 4. UI Components & Patterns
### Structure
- **Borders**: Standard is `1px solid var(--theme-zinc-800)`.
- **Shadows**: Large, soft glows (`bolt-glow`) or sharp hard shadows. No standard web-default shadows.
- **Glassmorphism**: `.glass-panel` for blurred overlays (40px blur).

### Interactions
- **Tap/Click**: `scale-[0.97]` for active states.
- **Hover**: Subtle brightness increase, border-color shifts to `volt`.
- **Motion**: 
  - `motion/react` for entry/exit animations.
  - Staggered children transitions.
  - "Tactical Pulse" for alerting elements.

### Button Styles
| Tier | Context | Tailwind Classes |
|------|---------|------------------|
| **Primary** | Major actions (Start Mission, Commit) | `bg-volt text-void font-black uppercase italic tracking-[0.2em] hover:bg-white shadow-[0_0_20px_rgba(0,182,255,0.4)] transition-all` |
| **Secondary** | Supportive actions (Log Activity) | `bg-void/40 border border-white/10 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/5 transition-all` |
| **Tertiary** | View logs, details | `bg-white/10 text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:bg-volt hover:text-void transition-all px-6 py-3 backdrop-blur-sm` |

### Specific Elements
- **Hardware Decor**: Corner brackets (border-t/l-2), tick marks (1px lines), sensor labels (e.g., `Ref_System_V4.2`).
- **Sliders**: Custom range inputs with explicit value readouts and track glows.

## 5. Layout Constants
- **Max Width**: `1600px` (ultra-wide ready).
- **Responsive Gutter**: `1rem` (mobile), `1.5rem` (tablet), `2rem` (desktop).
- **Notch Support**: Included via `env(safe-area-inset-top)`.
