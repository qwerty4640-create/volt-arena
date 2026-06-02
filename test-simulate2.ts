import { getBlockForWeek, BlockType } from './src/constants/periodization';

const e1rm = 300;

for (let week = 7; week <= 10; week++) {
  const result = getBlockForWeek(week, 12, ['powerbuilding'], undefined);
  const block = result.block;
  
  const isFinalWeek = result.weekInBlock === block.durationWeeks;

  let baseIntensity = block.baseIntensity + (result.weekInBlock - 1) * block.intensityIncrementPerWeek;
  let adjustedIntensity = baseIntensity * 0.85; // medium impact
  
  let targetSetRpe = (isFinalWeek ? "9" : "8.5");
  if(block.type === BlockType.STRENGTH) {
      targetSetRpe = (isFinalWeek ? "9.5" : "9"); 
  }

  let dynamicReps = "8";
  if (adjustedIntensity < 0.75) {
    dynamicReps = "6-8";
  } else if (adjustedIntensity < 0.85) {
    dynamicReps = "4-6";
  } else {
    dynamicReps = "3-4";
  }

  const parsedMinReps = parseInt(dynamicReps.split('-')[0]) || 8;
  const targetRpeCeiling = parseFloat(targetSetRpe) || 8;

  let effectiveReps = parsedMinReps + (10 - targetRpeCeiling);
  let safeIntensityLimit = (37 - Math.min(effectiveReps, 12)) / 36;
  
  let finalIntensity = adjustedIntensity;
  if (finalIntensity > safeIntensityLimit) {
    finalIntensity = safeIntensityLimit + (finalIntensity - safeIntensityLimit) * 0.5;
  }
              
  const setWeight = Math.round((e1rm * finalIntensity)/5)*5;

  console.log(`Week ${week} medium impact - Adj: ${adjustedIntensity.toFixed(3)}, SafeLim: ${safeIntensityLimit.toFixed(3)}, Final: ${finalIntensity.toFixed(3)}, reps: ${dynamicReps}, targetRpe: ${targetSetRpe}, setWeight: ${setWeight}`);
}
