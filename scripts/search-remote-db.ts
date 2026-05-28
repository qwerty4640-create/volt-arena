async function searchRemoteDb() {
  const remoteUrl = 'https://raw.githubusercontent.com/bootstrapping-lab/exercisedb-api/main/src/data/exercises.json';
  console.log(`Fetching remote DB from ${remoteUrl}...`);
  
  try {
    const res = await fetch(remoteUrl);
    if (!res.ok) throw new Error(`Failed to fetch remote DB: ${res.status}`);
    const remoteExercises = await res.json() as any[];

    const queries = ["barbell squat", "back squat", "squat"];
    console.log(`\nSearching for: ${queries.join(', ')}\n`);

    const results = remoteExercises.filter(ex => {
      const name = ex.name.toLowerCase();
      return queries.some(q => name.includes(q.toLowerCase()));
    });

    console.log(`Found ${results.length} matches:`);
    results.forEach(ex => {
      console.log(`- ${ex.name} (ID: ${ex.exerciseId})`);
    });
  } catch (err: any) {
    console.error("Error searching remote DB:", err);
  }
}

searchRemoteDb();
