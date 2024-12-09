import { useState, useEffect } from 'react';
import { InvestmentData } from '../types/investment';
import { investmentDataService } from '../services/investmentDataService';

export function useInvestmentData() {
  const [data, setData] = useState<InvestmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = investmentDataService.subscribe((newData) => {
      setData(newData);
      setLoading(false);
      setError(null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const updateData = async (newData: InvestmentData) => {
    try {
      setLoading(true);
      const updated = await investmentDataService.updateInvestmentData(newData);
      return updated;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update data');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { 
    data, 
    loading, 
    error, 
    updateData,
    refreshData: () => investmentDataService.fetchInvestmentData()
  };
}