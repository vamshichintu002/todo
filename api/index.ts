import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma, cleanupConnections } from '../src/lib/database';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    console.log('API request received:', {
      method: req.method,
      url: req.url,
      query: req.query,
      body: req.body
    });

    // Test database connection
    const result = await prisma.$queryRaw`SELECT current_timestamp`;
    console.log('Database connection test successful:', result);
    
    res.status(200).json({ 
      status: 'success',
      message: 'API is working',
      timestamp: result
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await cleanupConnections();
  }
}
