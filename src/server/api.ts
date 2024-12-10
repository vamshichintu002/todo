import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import { prisma } from '../lib/database';
import { Prisma } from '@prisma/client';
import FormDataTransformer from '../lib/form-data-transformer'; 
import { analyzePortfolio } from '../utils/portfolioAnalyzer';

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
const testHandler: RequestHandler = (req, res) => {
  res.json({ message: 'API is working' });
};

app.get('/api/test', testHandler);

// Test database connection endpoint
const testDbHandler: RequestHandler = async (req, res, next) => {
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
    next(error);
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
  createdAt: Date;
  updatedAt: Date;
  json_data: any;
  api_out_json: any;
}

// Investment data endpoint
interface InvestmentParams { clerkId: string }
const getInvestmentHandler: RequestHandler<InvestmentParams> = async (req, res, next) => {
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
      where: { userId: user.id },
      select: {
        id: true,
        userId: true,
        name: true,
        phone: true,
        age: true,
        employmentStatus: true,
        annualIncome: true,
        maritalStatus: true,
        selectedGoals: true,
        investmentHorizon: true,
        riskTolerance: true,
        riskComfortLevel: true,
        monthlyIncome: true,
        monthlyExpenses: true,
        selectedInvestments: true,
        managementStyle: true,
        lifeChanges: true,
        comments: true,
        json_data: true,
        api_out_json: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({ user, formDetails });
  } catch (error) {
    next(error);
  }
};

app.get('/api/investment/:clerkId', getInvestmentHandler);

// Check if user exists
interface CheckUserParams { clerkId: string }
const checkUserHandler: RequestHandler<CheckUserParams> = async (req, res) => {
  try {
    console.log('=== Check User Request ===');
    console.log('Checking user existence for clerkId:', req.params.clerkId);
    
    const user = await prisma.users.findUnique({
      where: { clerkId: req.params.clerkId }
    });
    
    console.log('User check result:', user);
    res.json({ exists: !!user, user });
  } catch (error: any) {
    console.error('Error checking user:', error);
    res.status(500).json({ 
      error: 'Failed to check user', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

app.get('/api/check-user/:clerkId', checkUserHandler);

// Create or update user
interface SyncUserBody { clerkId: string, email: string }
const syncUserHandler: RequestHandler<{ clerkId: string }, any, SyncUserBody> = async (req, res) => {
  try {
    console.log('=== Sync User Request ===');
    const { clerkId, email } = req.body;
    
    if (!clerkId || !email) {
      console.error('Missing required fields:', { clerkId, email });
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'Both clerkId and email are required' 
      });
    }

    console.log('Attempting to sync user:', { clerkId, email });

    // First check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { clerkId }
    });

    console.log('Existing user check result:', existingUser);

    let user;
    if (!existingUser) {
      console.log('Creating new user...');
      try {
        user = await prisma.users.create({
          data: {
            clerkId,
            email,
          },
        });
        console.log('Successfully created user:', user);
      } catch (createError: any) {
        console.error('Error creating user:', createError);
        throw createError;
      }
    } else {
      console.log('Updating existing user...');
      try {
        user = await prisma.users.update({
          where: { clerkId },
          data: { email },
        });
        console.log('Successfully updated user:', user);
      } catch (updateError: any) {
        console.error('Error updating user:', updateError);
        throw updateError;
      }
    }

    res.json({ 
      success: true,
      user,
      exists: !!existingUser,
      message: existingUser ? 'User updated' : 'User created'
    });
  } catch (error: any) {
    console.error('Error in sync-user endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to sync user', 
      details: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

app.post('/api/sync-user', syncUserHandler);

// Submit form endpoint
interface SubmitFormBody { clerkId: string, formData: any }
const submitFormHandler: RequestHandler<{ clerkId: string }, any, SubmitFormBody> = async (req, res, next) => {
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
      name: formData.name,
      phone: formData.phone,
      age: formData.age,
      employmentStatus: formData.employmentStatus,
      annualIncome: formData.annualIncome,
      maritalStatus: formData.maritalStatus,
      selectedGoals: formData.selectedGoals,
      investmentHorizon: formData.investmentHorizon,
      riskTolerance: formData.riskTolerance,
      riskComfortLevel: formData.riskComfortLevel,
      monthlyIncome: formData.monthlyIncome,
      monthlyExpenses: formData.monthlyExpenses,
      selectedInvestments: formData.selectedInvestments,
      managementStyle: formData.managementStyle,
      lifeChanges: formData.lifeChanges,
      comments: formData.comments,
      json_data: formData
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
  }
};

app.post('/api/submit-form', submitFormHandler);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler caught:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
