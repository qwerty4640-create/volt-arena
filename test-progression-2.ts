import { calculateSystemReadiness } from './src/logic/recoveryEngine';
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./data/XkISu8M0QTbzpMHSb4g7YXpOPLv2/full_user_state_2026-07-03T14-57-39.349Z.json', 'utf8'));
const history = data.history || [];
const recoveryHistory = data.recoveryHistory || [];
const subjectiveReadiness = data.subjectiveReadiness || null;

const sessionCompletionTime = 1783031304497;
const currentTime = 1783090671000; // July 3, 2026 07:57:51-07:00
const hoursPassed = (currentTime - sessionCompletionTime) / (1000 * 60 * 60);

global.Date.now = () => sessionCompletionTime;
const resultAtEnd = calculateSystemReadiness(history, recoveryHistory, subjectiveReadiness, undefined, 'imperial', 200);

global.Date.now = () => currentTime;
const resultNow = calculateSystemReadiness(history, recoveryHistory, subjectiveReadiness, undefined, 'imperial', 200);

console.log('Hours Passed:', hoursPassed);
console.log('Readiness At End:', resultAtEnd.readinessScore);
console.log('Fatigue Penalty At End:', resultAtEnd.fatiguePenalty);
console.log('Readiness Now:', resultNow.readinessScore);
console.log('Fatigue Penalty Now:', resultNow.fatiguePenalty);

