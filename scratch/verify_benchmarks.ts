async function runBenchmarks() {
  const BASE = 'http://localhost:3000';

  console.log('--- RUNNING PERFORMANCE BENCHMARKS ---\n');

  const endpoints = [
    '/api/public/matches',
    '/api/public/teams',
    '/api/public/standings',
    '/api/public/statistics',
    '/api/public/knockout',
    '/api/public/announcements',
  ];

  for (const ep of endpoints) {
    const start = Date.now();
    const res = await fetch(`${BASE}${ep}`);
    const elapsed = Date.now() - start;
    const text = await res.text();
    const sizeKb = (Buffer.byteLength(text, 'utf8') / 1024).toFixed(2);
    console.log(`[${res.status}] ${ep}: ${elapsed}ms | Payload: ${sizeKb} KB`);

    // Test cached speed
    const start2 = Date.now();
    const res2 = await fetch(`${BASE}${ep}`);
    const elapsed2 = Date.now() - start2;
    console.log(`       ↳ Cached response: ${elapsed2}ms`);
  }

  // Check an individual logo route
  const logoStart = Date.now();
  const teamsRes = await fetch(`${BASE}/api/public/teams`);
  const teamsData = await teamsRes.json();
  if (teamsData.teams && teamsData.teams.length > 0) {
    const firstTeam = teamsData.teams[0];
    if (firstTeam.logo && firstTeam.logo.startsWith('/api/public/teams/')) {
      const logoRes = await fetch(`${BASE}${firstTeam.logo}`);
      const logoElapsed = Date.now() - logoStart;
      const logoBuf = await logoRes.arrayBuffer();
      console.log(`\n[${logoRes.status}] Binary Logo (${firstTeam.name}): ${logoElapsed}ms | Size: ${(logoBuf.byteLength / 1024).toFixed(2)} KB`);
      console.log(`       ↳ Content-Type: ${logoRes.headers.get('content-type')}`);
      console.log(`       ↳ Cache-Control: ${logoRes.headers.get('cache-control')}`);
    }
  }

  console.log('\n--- BENCHMARKS COMPLETE ---');
}

runBenchmarks().catch(console.error);
