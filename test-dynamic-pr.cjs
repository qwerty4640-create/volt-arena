const fs = require('fs');

function calculateE1RM(weight, reps, rpe, exName) {
  if (weight <= 0 || reps <= 0) return 0;
  let rir = 0;
  if (rpe !== undefined && rpe > 0 && rpe < 10) {
    rir = 10 - rpe;
  }
  let rirMultiplier = 1.0;
  if (reps >= 12) rirMultiplier = 0.25;
  else if (reps >= 8) rirMultiplier = 0.5;

  let repMax = reps + (rir * rirMultiplier);
  let e1rm = weight * (36 / (37 - repMax));
  return e1rm;
}

const state = JSON.parse(fs.readFileSync('data/XkISu8M0QTbzpMHSb4g7YXpOPLv2/full_user_state_2026-07-04T03-18-43.052Z.json'));
const history = state.history || [];

const cleanName = (name) => name.replace(/\[?HEAVY PRIMARY\]?|\[?HYPERTROPHY\]?|\[?ACTIVE RECOVERY\]?|\[?MOVEMENT QUALITY\]?|\[?BLOOD FLOW\]?/gi, '').trim().toLowerCase();
const searchTargetName = cleanName("Bench Press");

const sessionsWithEx = history
  .filter((s) => s.exercises.some((ex) => ex.name && cleanName(ex.name) === searchTargetName))
  .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

let dynamicPR = 0;
if (sessionsWithEx.length > 0) {
  const chronologicalSessions = [...sessionsWithEx].reverse();
  chronologicalSessions.forEach(session => {
    const ex = session.exercises.find((e) => e.name && cleanName(e.name) === searchTargetName);
    if (!ex || !ex.sets) return;

    const sessionE1RMs = ex.sets.map((set) => calculateE1RM(
      parseFloat(set.weight) || 0,
      parseInt(set.reps) || 0,
      parseFloat(set.rpe || set.actualRpe || ""),
      ex.name
    )).filter(val => val > 0);

    if (sessionE1RMs.length > 0) {
      const sessionMaxE1RM = Math.max(...sessionE1RMs);
      if (sessionMaxE1RM > dynamicPR) {
        dynamicPR = sessionMaxE1RM;
      }
    }

    const workingSets = ex.sets.filter((s) => 
      !s.isWarmup && 
      s.isCompleted !== false && 
      s.completed !== false
    );
    if (workingSets.length > 0) {
      let maxMissedReps = 0;
      workingSets.forEach((set) => {
        const setTargetStr = set.baseReps || set.reps;
        const setTarget = (setTargetStr && typeof setTargetStr === "string")
          ? (parseInt(setTargetStr.split("-")[0]) || 5)
          : (parseInt(setTargetStr) || 5);
        const setActual = parseInt(set.reps) || 0;
        if (setActual < setTarget) {
          const missed = setTarget - setActual;
          if (missed > maxMissedReps) {
            maxMissedReps = missed;
          }
        }
      });

      if (maxMissedReps > 0) {
        dynamicPR = dynamicPR * (1 - maxMissedReps * 0.02);
      }
    }
  });
}
console.log("Dynamic PR:", dynamicPR);
console.log("55% of Dynamic PR:", Math.round(dynamicPR * 0.55 / 5) * 5);
