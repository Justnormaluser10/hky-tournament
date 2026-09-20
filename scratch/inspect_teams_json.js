const http = require('http');

http.get('http://localhost:3000/api/public/teams', (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log('Total response bytes:', Buffer.byteLength(data));
    const json = JSON.parse(data);
    const t0 = json.teams[0];
    console.log('Team 0 name:', t0.name);
    console.log('Team 0 logo:', t0.logo);
    let playerPhotosLen = 0;
    for (const p of t0.players) {
      if (p.photo) playerPhotosLen += p.photo.length;
    }
    console.log('Team 0 total player photo chars:', playerPhotosLen);
    process.exit(0);
  });
}).on('error', err => {
  console.error(err);
  process.exit(1);
});
