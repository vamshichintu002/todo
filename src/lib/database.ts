import { Pool } from 'pg';
import { PrismaClient, Prisma } from '@prisma/client';

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
  max: 1, // Limit connections for serverless
  idleTimeoutMillis: 30000
});

// Initialize Prisma Client with logging in development
const prismaClientOptions: Prisma.PrismaClientOptions = {
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
};

declare global {
  var prisma: PrismaClient | undefined;
}

// Function to create Prisma client with connection retry
async function createPrismaClient() {
  const client = new PrismaClient(prismaClientOptions);
  
  try {
    // Test the connection
    await client.$connect();
    console.log('Prisma connection established successfully');
    return client;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}

// Initialize Prisma client with connection handling
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient(prismaClientOptions);
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient(prismaClientOptions);
  }
  prisma = global.prisma;
}

// Listen for Prisma events
(prisma as any).$on('error', (e: Prisma.LogEvent) => {
  console.error('Prisma Error:', e);
});

(prisma as any).$on('warn', (e: Prisma.LogEvent) => {
  console.warn('Prisma Warning:', e);
});

// Helper function to get database connection with retry
export async function getDbConnection(retries = 3) {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log('Database connection established successfully');
      return client;
    } catch (error) {
      console.error(`Failed to connect to database (attempt ${i + 1}/${retries}):`, error);
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i))); // Exponential backoff
    }
  }
  
  throw lastError;
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

// Cleanup function for serverless environment
export async function cleanupConnections() {
  try {
    await prisma.$disconnect();
    await pool.end();
    console.log('Database connections cleaned up');
  } catch (error) {
    console.error('Error cleaning up database connections:', error);
  }
}

export { prisma, pool };
