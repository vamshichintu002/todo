import { API_CONFIG, getApiUrl, handleApiError } from '../lib/api-config';
import type { FormData } from '../types';

export const submitForm = async (formData: FormData, clerkId: string) => {
  try {
    // Convert string values to numbers for numeric fields
    const processedData = {
      ...formData,
      age: parseInt(formData.age),
      annualIncome: parseFloat(formData.annualIncome),
      riskComfortLevel: parseInt(formData.riskComfortLevel),
      monthlyIncome: parseFloat(formData.monthlyIncome),
      monthlyExpenses: parseFloat(formData.monthlyExpenses),
      emergencyFundMonths: parseInt(formData.emergencyFundMonths || '0'),
    };

    const response = await fetch(getApiUrl('/api/submit-form'), {
      method: 'POST',
      headers: API_CONFIG.headers,
      credentials: 'include',
      body: JSON.stringify({
        clerkId: clerkId,
        formData: processedData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    const result = await response.json();
    return result;
  } catch (error) {
    const handledError = handleApiError(error);
    console.error('Error submitting form:', handledError);
    throw handledError;
  }
};
