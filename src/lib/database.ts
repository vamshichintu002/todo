import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
});

// Initialize Prisma Client with logging in development
const prismaClientOptions = process.env.NODE_ENV === 'development' 
  ? { log: ['query', 'info', 'warn', 'error'] }
  : {};

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaClientOptions);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { pool };

// Helper function to get database connection
export async function getDbConnection() {
  const client = await pool.connect();
  return client;
}

// Error handling wrapper for database operations
export async function withDbClient<T>(
  operation: (client: any) => Promise<T>
): Promise<T> {
  const client = await getDbConnection();
  try {
    return await operation(client);
  } catch (error) {
    console.error('Database operation failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Error handling wrapper for Prisma operations
export async function withPrisma<T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  try {
    return await operation(prisma);
  } catch (error) {
    console.error('Database operation failed:', error);
    throw error;
  }
}
