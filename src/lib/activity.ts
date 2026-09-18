import { prisma } from './prisma';

export async function logActivity(adminEmail: string, action: string, description: string) {
  try {
    await prisma.activityLog.create({
      data: {
        adminEmail,
        action,
        description,
      },
    });
  } catch (error) {
    console.error('Failed to log admin activity:', error);
  }
}
