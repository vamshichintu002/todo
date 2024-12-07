import { prisma } from '@/lib/db';
const API_URL = 'http://localhost:3001';

export async function syncUser(clerkId: string, email: string) {
  try {
    const response = await fetch(`${API_URL}/api/sync-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clerkId, email }),
    });

    if (!response.ok) {
      throw new Error('Failed to sync user');
    }

    const user = await response.json();
    return user;
  } catch (error) {
    console.error('Error syncing user:', error);
    throw error;
  }
}
