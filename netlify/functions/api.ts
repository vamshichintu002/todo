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
  const segments = path.split('/');
  const endpoint = segments[1];
  const param = segments[2];
  
  console.log('Request details:', {
    path,
    segments,
    endpoint,
    param,
    method: event.httpMethod
  });

  const body = event.body ? JSON.parse(event.body) : {};

  try {
    // Route handling
    switch (true) {
      case endpoint === 'test': {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'API is working!' })
        };
      }

      case endpoint === 'sync-user': {
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

      case endpoint === 'investment' && !!param: {
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

      case endpoint === 'submit-form': {
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
            ...transformedData,
            updatedAt: new Date()
          },
          create: {
            userId: user.id,
            ...transformedData
          }
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(formDetails)
        };
      }

      case endpoint === 'get-investment-data': {
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
        console.log('No matching route found for:', path);
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Not Found', path })
        };
    }
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal Server Error', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  } finally {
    await prisma.$disconnect();
  }
};
