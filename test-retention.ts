import { calculateRetentionProtocol } from './src/logic/retentionEngine';
const profile = { trainingFrequency: 3, missionPeriod: "3" };
console.log(calculateRetentionProtocol(null, 'powerbuilding', 12, profile));
