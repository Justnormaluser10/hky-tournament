import { prisma } from '../src/lib/prisma';

async function main() {
  const teams = await prisma.team.findMany({
    include: {
      players: true,
    },
  });

  console.log('Total teams:', teams.length);
  for (const t of teams) {
    console.log(`Team: ${t.name}`);
    console.log('  logo length:', t.logo?.length || 0);
    console.log('  description length:', t.description?.length || 0);
    console.log('  players count:', t.players.length);
    let playerPhotoBytes = 0;
    for (const p of t.players) {
      if (p.photo) {
        playerPhotoBytes += p.photo.length;
      }
    }
    console.log('  total player photo bytes for team:', playerPhotoBytes);
  }
}

main().catch(console.error);
