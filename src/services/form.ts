import { FormData } from '../Form/types/form';

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

    const response = await fetch('http://localhost:3001/api/submit-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    console.error('Error submitting form:', error);
    throw error;
  }
};
