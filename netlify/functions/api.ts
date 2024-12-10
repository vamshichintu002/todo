import { Handler } from '@netlify/functions';
import { prisma } from '../../src/lib/prisma';
import FormDataTransformer from '../../src/lib/form-data-transformer';
import { analyzePortfolio } from '../../src/utils/portfolioAnalyzer';

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

  const path = event.path.replace('/.netlify/functions/api', '');
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    // Route handling
    switch (path) {
      case '/api/test': {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'API is working!' })
        };
      }

      case '/api/sync-user': {
        const { clerkId, email } = body;
        console.log('=== Sync User Request ===', { clerkId, email });
        
        if (!clerkId || !email) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing required fields' })
          };
        }

        const user = await prisma.user.upsert({
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

      case '/api/submit-form': {
        const { clerkId, formData } = body;
        
        if (!clerkId || !formData) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing required fields' })
          };
        }

        const transformer = new FormDataTransformer(formData);
        const transformedData = transformer.transform();

        const investment = await prisma.investment.create({
          data: {
            userId: clerkId,
            ...transformedData
          }
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(investment)
        };
      }

      case '/api/get-investment-data': {
        const { clerkId } = body;
        
        if (!clerkId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing clerkId' })
          };
        }

        const investments = await prisma.investment.findMany({
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
          body: JSON.stringify({ error: 'Not Found' })
        };
    }
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
    };
  }
};
