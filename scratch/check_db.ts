import { prisma } from '../src/lib/prisma';

async function main() {
  const tables: any = await prisma.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table';");
  console.log('Tables:', tables.map((t: any) => t.name));
  const matchCols: any = await prisma.$queryRawUnsafe('PRAGMA table_info(Match);');
  console.log('Match columns:', matchCols.map((c: any) => c.name));
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
