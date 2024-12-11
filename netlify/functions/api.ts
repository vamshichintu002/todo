import { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';
import FormDataTransformer from '../../src/lib/form-data-transformer';
import { analyzePortfolio } from '../../src/utils/portfolioAnalyzer';

// Initialize Prisma Client
const prisma = new PrismaClient();

const headers = {
  'Access-Control-Allow-Origin': 'https://investoaitest.netlify.app',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json'
};

export const handler: Handler = async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Extract the base path and parameters
  const path = event.path.replace('/.netlify/functions/api', '');
  const segments = path.split('/').filter(Boolean);
  const endpoint = segments[0];
  const param = segments[1];
  
  console.log('Request details:', {
    path,
    segments,
    endpoint,
    param,
    method: event.httpMethod,
    body: event.body
  });

  try {
    const body = event.body ? JSON.parse(event.body) : {};

    // Route handling
    switch (true) {
      case endpoint === 'test' && event.httpMethod === 'GET': {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'API is working!' })
        };
      }

      case endpoint === 'sync-user' && event.httpMethod === 'POST': {
        const { clerkId, email } = body;
        console.log('=== Sync User Request ===', { clerkId, email });
        
        if (!clerkId || !email) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing required fields' })
          };
        }

        const user = await prisma.users.upsert({
          where: { clerkId },
          update: { email },
          create: { clerkId, email }
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(user)
        };
      }

      case endpoint === 'investment' && event.httpMethod === 'GET': {
        const clerkId = param;
        console.log('Fetching investment data for clerkId:', clerkId);
        
        if (!clerkId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing clerkId parameter' })
          };
        }

        // First get the user
        const user = await prisma.users.findUnique({
          where: { clerkId }
        });

        console.log('Found user:', user);

        if (!user) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: 'User not found' })
          };
        }

        // Then get their form details
        const formDetails = await prisma.form_details.findUnique({
          where: { userId: user.id },
          select: {
            api_out_json: true
          }
        });

        console.log('Found form details:', formDetails);

        if (!formDetails?.api_out_json) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: 'No investment data found for user' })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(formDetails.api_out_json)
        };
      }

      case endpoint === 'submit-form' && event.httpMethod === 'POST': {
        const { clerkId, formData } = body;
        
        if (!clerkId || !formData) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing required fields' })
          };
        }

        // Get the user first
        const user = await prisma.users.findUnique({
          where: { clerkId }
        });

        if (!user) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'User not found' })
          };
        }

        const transformer = new FormDataTransformer(formData);
        const transformedData = transformer.transform();

        // Create or update form details
        const formDetails = await prisma.form_details.upsert({
          where: { userId: user.id },
          update: {
            name: formData.name,
            phone: formData.phone,
            age: Number(formData.age),
            employmentStatus: formData.employmentStatus,
            annualIncome: Number(formData.annualIncome),
            maritalStatus: formData.maritalStatus,
            selectedGoals: Array.isArray(formData.selectedGoals) ? formData.selectedGoals : [],
            investmentHorizon: formData.investmentHorizon,
            riskTolerance: formData.riskTolerance,
            riskComfortLevel: Number(formData.riskComfortLevel),
            monthlyIncome: Number(formData.monthlyIncome),
            monthlyExpenses: Number(formData.monthlyExpenses),
            selectedInvestments: Array.isArray(formData.selectedInvestments) ? formData.selectedInvestments : [],
            managementStyle: formData.managementStyle,
            lifeChangesDetails: formData.lifeChangesDetails || "",
            comments: formData.additionalComments || "",
            api_out_json: transformedData,
            updatedAt: new Date()
          },
          create: {
            userId: user.id,
            name: formData.name,
            phone: formData.phone,
            age: Number(formData.age),
            employmentStatus: formData.employmentStatus,
            annualIncome: Number(formData.annualIncome),
            maritalStatus: formData.maritalStatus,
            selectedGoals: Array.isArray(formData.selectedGoals) ? formData.selectedGoals : [],
            investmentHorizon: formData.investmentHorizon,
            riskTolerance: formData.riskTolerance,
            riskComfortLevel: Number(formData.riskComfortLevel),
            monthlyIncome: Number(formData.monthlyIncome),
            monthlyExpenses: Number(formData.monthlyExpenses),
            selectedInvestments: Array.isArray(formData.selectedInvestments) ? formData.selectedInvestments : [],
            managementStyle: formData.managementStyle,
            lifeChangesDetails: formData.lifeChangesDetails || "",
            comments: formData.additionalComments || "",
            api_out_json: transformedData
          }
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(formDetails)
        };
      }

      case endpoint === 'get-investment-data' && event.httpMethod === 'POST': {
        const { clerkId } = body;
        
        if (!clerkId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing clerkId' })
          };
        }

        const investments = await prisma.investments.findMany({
          where: { userId: clerkId }
        });

        const analysis = investments.length > 0 ? await analyzePortfolio(investments) : null;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ investments, analysis })
        };
      }

      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            error: 'Not Found', 
            path: event.path,
            endpoint,
            method: event.httpMethod 
          })
        };
    }
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  } finally {
    await prisma.$disconnect();
  }
};
