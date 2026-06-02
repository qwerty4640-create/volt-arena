import { calculateE1RM, calculateWeightFromE1RM } from './src/utils/workoutUtils';

const e1rm = 540;

const simulateOriginal = (estimated1RM: number, blockIntensity: number) => {
  let adjustedIntensity = blockIntensity;
  let dynamicReps;
  if (adjustedIntensity < 0.78) {
    dynamicReps = "8-10";
  } else if (adjustedIntensity < 0.83) {
    dynamicReps = "6-8";
  } else {
    dynamicReps = "4-6";
  }
  return Math.round((estimated1RM * adjustedIntensity) / 5) * 5;
}

console.log("W7 (0.76):", simulateOriginal(e1rm, 0.76));
console.log("W8 (0.78):", simulateOriginal(e1rm, 0.78));
console.log("W9 (0.78):", simulateOriginal(e1rm, 0.78));
console.log("W10(0.805):", simulateOriginal(e1rm, 0.805));
