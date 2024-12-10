import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import { prisma, cleanupConnections } from '../lib/database.js';
import { Prisma } from '@prisma/client';
import FormDataTransformer from '../lib/form-data-transformer.js'; 
import { analyzePortfolio } from '../utils/portfolioAnalyzer.js';

const app = express();

// CORS configuration with environment-based origins
const allowedOrigins = [
  'https://todo-three-lyart-41.vercel.app',
  'http://localhost:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
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
}));

app.use(express.json());

// Debug middleware to log all requests
const debugMiddleware: RequestHandler = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
};

app.use(debugMiddleware);

// Test endpoint
const testHandler: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    res.json({ message: 'API is working' });
  } catch (error) {
    next(error);
  } finally {
    await cleanupConnections();
  }
};

app.get('/api/test', testHandler);

// Test database connection endpoint
const testDbHandler: RequestHandler = async (req, res, next): Promise<void> => {
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
};

app.get('/api/test-db', testDbHandler);

interface User {
  id: string;
  clerkId: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FormDetails {
  id: string;
  userId: string;
  name: string;
  phone: string;
  age: number;
  employmentStatus: string;
  annualIncome: number;
  maritalStatus: string;
  selectedGoals: string[];
  investmentHorizon: string;
  riskTolerance: string;
  riskComfortLevel: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  selectedInvestments: string[];
  managementStyle: string;
  lifeChanges: string;
  comments: string;
  json_data: any;
  api_out_json: any;
  createdAt: Date;
  updatedAt: Date;
}

// Investment data endpoint
interface InvestmentParams { clerkId: string }
const getInvestmentHandler: RequestHandler<InvestmentParams> = async (req, res, next): Promise<void> => {
  try {
    const { clerkId } = req.params;
    
    const user = await prisma.users.findUnique({
      where: { clerkId }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const formDetails = await prisma.form_details.findFirst({
      where: { userId: user.id }
    });

    res.json({ user, formDetails });
  } catch (error) {
    next(error);
  } finally {
    await cleanupConnections();
  }
};

app.get('/api/investment/:clerkId', getInvestmentHandler);

// Check if user exists
interface CheckUserParams {
  clerkId: string;
}

const checkUserHandler: RequestHandler<CheckUserParams> = async (req, res, next): Promise<void> => {
  try {
    const { clerkId } = req.params;
    const user = await prisma.users.findUnique({
      where: { clerkId }
    });
    res.json({ exists: !!user });
  } catch (error) {
    next(error);
  } finally {
    await cleanupConnections();
  }
};

app.get('/api/check-user/:clerkId', checkUserHandler);

// Create or update user
interface SyncUserBody {
  clerkId: string;
  email: string;
}

const syncUserHandler: RequestHandler<{ clerkId: string }, any, SyncUserBody> = async (req, res, next): Promise<void> => {
  try {
    const { clerkId, email } = req.body;

    const user = await prisma.users.upsert({
      where: { clerkId },
      update: { email },
      create: { clerkId, email }
    });

    res.json(user);
  } catch (error) {
    next(error);
  } finally {
    await cleanupConnections();
  }
};

app.post('/api/sync-user', syncUserHandler);

// Submit form endpoint
interface SubmitFormBody {
  clerkId: string;
  formData: any;
}

const submitFormHandler: RequestHandler<{ clerkId: string }, any, SubmitFormBody> = async (req, res, next): Promise<void> => {
  try {
    const { clerkId, formData } = req.body;
    
    // First get the user
    const user = await prisma.users.findUnique({
      where: { clerkId }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update existing form data
    const existingForm = await prisma.form_details.findFirst({
      where: { userId: user.id }
    });

    const formDataToSave = {
      userId: user.id,
      name: formData.name || '',
      phone: formData.phone || '',
      age: Number(formData.age) || 0,
      employmentStatus: formData.employmentStatus || '',
      annualIncome: Number(formData.annualIncome) || 0,
      maritalStatus: formData.maritalStatus || '',
      selectedGoals: formData.selectedGoals || [],
      investmentHorizon: formData.investmentHorizon || '',
      riskTolerance: formData.riskTolerance || '',
      riskComfortLevel: Number(formData.riskComfortLevel) || 0,
      monthlyIncome: Number(formData.monthlyIncome) || 0,
      monthlyExpenses: Number(formData.monthlyExpenses) || 0,
      selectedInvestments: formData.selectedInvestments || [],
      managementStyle: formData.managementStyle || '',
      json_data: JSON.stringify(formData)  // Convert to string for storage
    };

    if (existingForm) {
      const updatedForm = await prisma.form_details.update({
        where: { id: existingForm.id },
        data: formDataToSave
      });
      res.json(updatedForm);
    } else {
      // Create new form data
      const newForm = await prisma.form_details.create({
        data: formDataToSave
      });
      res.json(newForm);
    }
  } catch (error) {
    next(error);
  } finally {
    await cleanupConnections();
  }
};

app.post('/api/submit-form', submitFormHandler);

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

// Cleanup middleware
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await cleanupConnections();
  } catch (error) {
    console.error('Error cleaning up connections:', error);
  }
  next();
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
