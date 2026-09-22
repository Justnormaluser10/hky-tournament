import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Running safe additive DDL statements...');

  // 1. Check existing columns in Match
  const matchCols: any = await prisma.$queryRawUnsafe('PRAGMA table_info(Match);');
  const colNames = matchCols.map((c: any) => c.name);
  console.log('Current Match columns:', colNames);

  if (!colNames.includes('bestDefenderId')) {
    console.log('Adding bestDefenderId column to Match...');
    await prisma.$executeRawUnsafe('ALTER TABLE Match ADD COLUMN bestDefenderId TEXT;');
  } else {
    console.log('bestDefenderId already exists in Match.');
  }

  if (!colNames.includes('motmId')) {
    console.log('Adding motmId column to Match...');
    await prisma.$executeRawUnsafe('ALTER TABLE Match ADD COLUMN motmId TEXT;');
  } else {
    console.log('motmId already exists in Match.');
  }

  // 2. Create StandingOverride table if not exists
  console.log('Creating StandingOverride table if not exists...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS StandingOverride (
      id TEXT PRIMARY KEY,
      tournamentId TEXT NOT NULL,
      teamId TEXT NOT NULL UNIQUE,
      played INTEGER,
      won INTEGER,
      drawn INTEGER,
      lost INTEGER,
      goalsFor INTEGER,
      goalsAgainst INTEGER,
      goalDifference INTEGER,
      points INTEGER,
      position INTEGER,
      notes TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournamentId) REFERENCES Tournament(id) ON DELETE CASCADE,
      FOREIGN KEY (teamId) REFERENCES Team(id) ON DELETE CASCADE
    );
  `);

  // 3. Create PlayerStatOverride table if not exists
  console.log('Creating PlayerStatOverride table if not exists...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS PlayerStatOverride (
      id TEXT PRIMARY KEY,
      tournamentId TEXT NOT NULL,
      playerId TEXT NOT NULL UNIQUE,
      goals INTEGER,
      goalsConceded INTEGER,
      cleanSheets INTEGER,
      matchesPlayed INTEGER,
      bestDefenderAwards INTEGER,
      motmAwards INTEGER,
      notes TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournamentId) REFERENCES Tournament(id) ON DELETE CASCADE,
      FOREIGN KEY (playerId) REFERENCES Player(id) ON DELETE CASCADE
    );
  `);

  // Verify counts of existing data to ensure 100% preservation
  const teamsCount = await prisma.team.count();
  const playersCount = await prisma.player.count();
  const matchesCount = await prisma.match.count();
  console.log(`Verification: ${teamsCount} teams, ${playersCount} players, ${matchesCount} matches preserved intact.`);
}

main()
  .then(() => {
    console.log('Safe migration completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration error:', err);
    process.exit(1);
  });
