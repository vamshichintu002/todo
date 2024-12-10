import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma, cleanupConnections } from '../src/lib/database';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    console.log('Test endpoint called');
    
    // Test database connection
    const result = await prisma.$queryRaw`SELECT current_timestamp`;
    const userCount = await prisma.users.count();
    
    console.log('Database test successful:', {
      timestamp: result,
      userCount: userCount
    });
    
    res.status(200).json({ 
      status: 'success',
      message: 'Database connection successful',
      timestamp: result,
      userCount: userCount
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await cleanupConnections();
  }
}
