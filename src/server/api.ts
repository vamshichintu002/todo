import express, { Request, Response, NextFunction } from 'express';
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
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
});

// Test endpoint
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ message: 'API is working' });
});

// Test database connection endpoint
app.get('/api/test-db', async (req: Request, res: Response) => {
  try {
    console.log('Testing database connection...');
    const result = await prisma.$queryRaw`SELECT current_timestamp`;
    console.log('Database connection test successful:', result);
    
    const userCount = await prisma.users.count();
    console.log('Total users in database:', userCount);
    
    return res.json({ 
      status: 'success',
      timestamp: result,
      userCount
    });
  } catch (error: any) {
    console.error('Database test failed:', {
      error: error.message,
      code: error?.code,
      meta: error?.meta
    });
    return res.status(500).json({
      status: 'error',
      message: error.message,
      code: error?.code
    });
  }
});

// Investment data endpoint
app.get('/api/investment/:clerkId', async (req: Request<{ clerkId: string }>, res: Response) => {
  const { clerkId } = req.params;
  
  try {
    console.log(`[${new Date().toISOString()}] Starting investment data fetch for clerkId:`, clerkId);
    
    if (!clerkId) {
      console.log('Missing clerkId parameter in request');
      return res.status(400).json({ message: 'Missing clerkId parameter' });
    }

    // Test database connection
    try {
      console.log('Testing database connection...');
      const result = await prisma.$queryRaw`SELECT current_timestamp`;
      console.log('Database connection successful:', result);
    } catch (error: any) {
      console.error('Database connection failed:', {
        error: error.message,
        code: error?.code,
        meta: error?.meta
      });
      return res.status(500).json({ 
        message: 'Database connection failed',
        error: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          code: error?.code
        } : 'Database error'
      });
    }

    const user = await prisma.users.findUnique({
      where: { clerkId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        debug: { clerkId }
      });
    }

    const formDetails = await prisma.form_details.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        api_out_json: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!formDetails?.api_out_json) {
      return res.status(404).json({ 
        message: 'No investment data found for user',
        debug: { 
          userId: user.id,
          clerkId: user.clerkId,
          formFound: !!formDetails
        }
      });
    }

    return res.json(formDetails.api_out_json);

  } catch (error: any) {
    console.error('Detailed error in /api/investment endpoint:', {
      error: error.message,
      code: error?.code,
      meta: error?.meta,
      stack: error.stack,
      clerkId,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error?.code,
        type: error.name,
        meta: error?.meta
      } : 'An error occurred'
    });
  }
});

// Check if user exists
app.get('/api/check-user/:clerkId', async (req: Request<{ clerkId: string }>, res: Response) => {
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
});

// Create or update user
app.post('/api/sync-user', async (req: Request<{ body: { clerkId: string, email: string } }>, res: Response) => {
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
});

// Submit form endpoint
app.post('/api/submit-form', async (req: Request<{ body: { clerkId: string, formData: any } }>, res: Response) => {
  try {
    const { clerkId, formData } = req.body;

    if (!clerkId || !formData) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Both clerkId and formData are required'
      });
    }

    console.log('Submitting form for user:', clerkId);

    // First, get the user by clerkId
    const user = await prisma.users.findUnique({
      where: { clerkId: clerkId }
    });

    if (!user) {
      console.error('User not found for clerkId:', clerkId);
      return res.status(404).json({ 
        error: 'User not found',
        details: `No user found with clerkId: ${clerkId}`
      });
    }

    // Create or update form details
    const transformedData = FormDataTransformer.transformToApiFormat(formData);
    
    // Analyze the portfolio using the external API
    let portfolioAnalysis = null;
    try {
      portfolioAnalysis = await analyzePortfolio(transformedData);
    } catch (error: any) {
      console.error('Error getting portfolio analysis:', error);
      // Continue with form submission even if analysis fails
    }

    const formDetails = await prisma.form_details.upsert({
      where: { userId: user.id },
      update: {
        name: formData.name,
        phone: formData.phone,
        age: parseInt(formData.age),
        employmentStatus: formData.employmentStatus,
        annualIncome: parseFloat(formData.annualIncome),
        maritalStatus: formData.maritalStatus,
        selectedGoals: formData.selectedGoals,
        investmentHorizon: formData.investmentHorizon,
        riskTolerance: formData.riskTolerance,
        riskComfortLevel: parseInt(formData.riskComfortLevel),
        monthlyIncome: parseFloat(formData.monthlyIncome),
        monthlyExpenses: parseFloat(formData.monthlyExpenses),
        selectedInvestments: formData.selectedInvestments,
        managementStyle: formData.managementStyle,
        json_data: transformedData,
        api_out_json: portfolioAnalysis
      },
      create: {
        userId: user.id,
        name: formData.name,
        phone: formData.phone,
        age: parseInt(formData.age),
        employmentStatus: formData.employmentStatus,
        annualIncome: parseFloat(formData.annualIncome),
        maritalStatus: formData.maritalStatus,
        selectedGoals: formData.selectedGoals,
        investmentHorizon: formData.investmentHorizon,
        riskTolerance: formData.riskTolerance,
        riskComfortLevel: parseInt(formData.riskComfortLevel),
        monthlyIncome: parseFloat(formData.monthlyIncome),
        monthlyExpenses: parseFloat(formData.monthlyExpenses),
        selectedInvestments: formData.selectedInvestments,
        managementStyle: formData.managementStyle,
        json_data: transformedData,
        api_out_json: portfolioAnalysis
      }
    });

    console.log('Form details saved:', formDetails);
    res.json({ success: true, formDetails });
  } catch (error: any) {
    console.error('Error in /api/submit-form:', error);
    res.status(500).json({
      error: 'Failed to submit form',
      details: error.message
    });
  }
});

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
