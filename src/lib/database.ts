import { Pool } from 'pg';
import { PrismaClient, Prisma } from '@prisma/client';

console.log('Starting database initialization...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('DIRECT_URL:', process.env.DIRECT_URL ? 'Set' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV);

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
  max: 1,
  idleTimeoutMillis: 30000
});

// Initialize Prisma Client with logging
const prismaClientOptions: Prisma.PrismaClientOptions = {
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
  ],
  errorFormat: 'pretty',
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
  console.log('Creating new Prisma client...');
  const client = new PrismaClient(prismaClientOptions);
  
  try {
    console.log('Attempting to connect to database...');
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
  console.log('Initializing Prisma client in production mode');
  prisma = new PrismaClient(prismaClientOptions);
} else {
  console.log('Initializing Prisma client in development mode');
  if (!global.prisma) {
    console.log('Creating new global Prisma instance');
    global.prisma = new PrismaClient(prismaClientOptions);
  } else {
    console.log('Using existing global Prisma instance');
  }
  prisma = global.prisma;
}

// Listen for Prisma events
prisma.$on('error' as never, (e: any) => {
  console.error('Prisma Error Event:', e);
});

prisma.$on('warn' as never, (e: any) => {
  console.warn('Prisma Warning Event:', e);
});

prisma.$on('info' as never, (e: any) => {
  console.info('Prisma Info Event:', e);
});

prisma.$on('query' as never, (e: any) => {
  console.log('Prisma Query Event:', {
    query: e.query,
    params: e.params,
    duration: e.duration
  });
});

// Test database connection on startup
async function testDatabaseConnection() {
  try {
    console.log('Testing initial database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('Initial database connection test successful');
  } catch (error) {
    console.error('Initial database connection test failed:', error);
    throw error;
  }
}

// Run initial connection test
testDatabaseConnection()
  .catch(console.error);

// Helper function to get database connection with retry
export async function getDbConnection(retries = 3) {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting database connection (attempt ${i + 1}/${retries})...`);
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
    console.log('Starting database connection cleanup...');
    await prisma.$disconnect();
    await pool.end();
    console.log('Database connections cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up database connections:', error);
    throw error;
  }
}

export { prisma, pool };
