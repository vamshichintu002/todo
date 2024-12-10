import { Pool } from 'pg';
import { PrismaClient, Prisma } from '@prisma/client';

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
});

// Initialize Prisma Client with logging in development
const prismaClientOptions: Prisma.PrismaClientOptions = {
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' }
  ],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
};

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Create Prisma client with connection retry logic
async function createPrismaClient(): Promise<PrismaClient> {
  const client = new PrismaClient(prismaClientOptions);

  try {
    // Test the connection
    await client.$connect();
    console.log('Database connection established successfully');
    return client;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}

// Initialize the client
export const prisma = globalForPrisma.prisma ?? (() => {
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }
  return client;
})();

// Listen for Prisma events
prisma.$on('error', (e: Prisma.LogEvent) => {
  console.error('Prisma Error:', e);
});

prisma.$on('warn', (e: Prisma.LogEvent) => {
  console.warn('Prisma Warning:', e);
});

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
  operation: (prisma: PrismaClient) => Promise<T>,
  retries = 3
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation(prisma);
    } catch (error: any) {
      lastError = error;
      console.error(`Database operation failed (attempt ${attempt}/${retries}):`, {
        error: error.message,
        code: error.code,
        meta: error.meta
      });
      
      if (attempt < retries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError;
}

export { pool };
