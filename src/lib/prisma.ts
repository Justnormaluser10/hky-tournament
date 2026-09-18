import dns from 'node:dns';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

if (typeof dns?.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const DEFAULT_TURSO_URL =
  'libsql://tournament-turso-upload-justnormaluser10.aws-ap-south-1.turso.io';
const DEFAULT_TURSO_AUTH_TOKEN =
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODk3NDA4NjEsImlkIjoiMDFhMGI0ZDgtYTQwMS03YjdiLWE3NjYtZTBjY2UyYzIxOWMzIiwia2lkIjoiOWtrZUk4aURtVXdKX3RlVHFaZTQzeGFhVXVUSkFOTV9Lb0pmRU02amh1RSIsInJpZCI6IjA0NTNjZjQ2LWNiN2QtNGZmNy04YTg4LWFiYTBjZmY4MTE0MSJ9.vVeKoMRR0MYhslzDm9HT_Exx4iAwNzmxGEYcTdpRvoBIlGUljGtMnXZKHrKQ8rncGV3BLw5OfiU8CIoXze9TCQ';

function createPrismaClient() {
  const tursoUrl =
    process.env.TURSO_DATABASE_URL ||
    (process.env.NODE_ENV === 'production' ? DEFAULT_TURSO_URL : undefined);
  const tursoAuthToken =
    process.env.TURSO_AUTH_TOKEN ||
    (process.env.NODE_ENV === 'production' ? DEFAULT_TURSO_AUTH_TOKEN : undefined);

  if (tursoUrl) {
    const libsql = createClient({
      url: tursoUrl,
      authToken: tursoAuthToken || DEFAULT_TURSO_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;

export default prisma;
