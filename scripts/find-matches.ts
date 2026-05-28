import * as fs from 'fs';
import { EXERCISE_DATABASE } from '../src/constants/exercises';

// A simple Levenshtein distance implementation
function getLevenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[a.length][b.length];
}

function getSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1.0;
  return (longer.length - getLevenshteinDistance(longer, shorter)) / longer.length;
}

async function findMatches() {
  const remoteUrl = 'https://raw.githubusercontent.com/bootstrapping-lab/exercisedb-api/main/src/data/exercises.json';
  const res = await fetch(remoteUrl);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  const remoteExercises = await res.json() as any[];

  const missing = EXERCISE_DATABASE.filter((ex: any) => !ex.gifUrl);
  
  console.log(`Matching ${missing.length} missing exercises against ${remoteExercises.length} remote exercises...\n`);
  const matches: { local: string, remote: string, score: number }[] = [];

  for (const ex of missing) {
    let bestMatch = { name: 'None found', score: 0 };
    const localName = ex.name.toLowerCase().trim();

    for (const remote of remoteExercises) {
      const remoteName = remote.name.toLowerCase().trim();
      const score = getSimilarity(localName, remoteName);
      if (score > bestMatch.score) {
        bestMatch = { name: remote.name, score };
      }
    }

    if (bestMatch.score > 0.6) {
      matches.push({ local: ex.name, remote: bestMatch.name, score: bestMatch.score });
    }
  }

  matches.sort((a, b) => b.score - a.score);

  console.log('| Current Exercise Name | Best Remote Match | Similarity |');
  console.log('|-----------------------|-------------------|------------|');
  
  for (const match of matches) {
    console.log(`| ${match.local} | ${match.remote} | ${(match.score * 100).toFixed(1)}% |`);
  }
}

findMatches().catch(console.error);
