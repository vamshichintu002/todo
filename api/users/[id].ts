import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma, cleanupConnections } from '../../src/lib/database';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { id } = req.query;
  
  try {
    console.log('User endpoint called:', {
      method: req.method,
      id: id
    });

    switch (req.method) {
      case 'GET':
        const user = await prisma.users.findUnique({
          where: { id: id as string },
          include: { form_details: true }
        });
        
        if (!user) {
          res.status(404).json({ error: 'User not found' });
          return;
        }
        
        res.status(200).json(user);
        break;

      default:
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('User endpoint error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await cleanupConnections();
  }
}
