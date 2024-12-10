import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { prisma, cleanupConnections } from '../src/lib/database.js';
import { Prisma } from '@prisma/client';
import FormDataTransformer from '../src/lib/form-data-transformer.js';
import { analyzePortfolio } from '../src/utils/portfolioAnalyzer.js';

// CORS configuration with environment-based origins
const allowedOrigins = [
  'https://todo-three-lyart-41.vercel.app',
  'http://localhost:5173'
].filter(Boolean);

const corsOptions = {
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

// Debug middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
});

// Test endpoint
app.get('/api/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ message: 'API is working' });
  } catch (error) {
    next(error);
  } finally {
    await cleanupConnections();
  }
});

// Test database connection
app.get('/api/test-db', async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Testing database connection...');
    const result = await prisma.$queryRaw`SELECT current_timestamp`;
    console.log('Database connection test successful:', result);
    
    const userCount = await prisma.users.count();
    console.log('Total users in database:', userCount);
    
    res.json({ 
      status: 'success',
      message: 'Database connection successful',
      timestamp: result,
      userCount
    });
  } catch (error) {
    console.error('Database test error:', error);
    next(error);
  } finally {
    await cleanupConnections();
  }
});

// Get user form details
app.get('/api/user-form/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const formDetails = await prisma.form_details.findUnique({
      where: { userId }
    });
    res.json(formDetails);
  } catch (error) {
    next(error);
  } finally {
    await cleanupConnections();
  }
});

// Submit form handler
app.post('/api/submit-form', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const formData = req.body;
    const transformer = new FormDataTransformer();
    const transformedData = transformer.transformToApiFormat(formData);
    
    const analysis = await analyzePortfolio(transformedData);
    
    const result = await prisma.form_details.create({
      data: {
        ...transformedData,
        api_out_json: analysis
      }
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  } finally {
    await cleanupConnections();
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error in request:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message,
    details: process.env.NODE_ENV === 'production' 
      ? undefined 
      : err.stack
  });
});

export default app;
