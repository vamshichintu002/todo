import { InvestmentData, InvestmentDataSource } from '../types/investment';
import { defaultInvestmentData } from '../data/defaultInvestmentData';

class InvestmentDataService implements InvestmentDataSource {
  private data: InvestmentData;
  private subscribers: Set<(data: InvestmentData) => void>;

  constructor() {
    this.data = defaultInvestmentData;
    this.subscribers = new Set();

    // Watch for changes in the module
    if (import.meta.hot) {
      import.meta.hot.accept('../data/defaultInvestmentData', (newModule) => {
        if (newModule) {
          this.data = newModule.defaultInvestmentData;
          this.notifySubscribers();
        }
      });
    }
  }

  subscribe(callback: (data: InvestmentData) => void) {
    this.subscribers.add(callback);
    // Immediately call with current data
    callback(this.data);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.data));
  }

  async fetchInvestmentData(): Promise<InvestmentData> {
    return this.data;
  }

  async updateInvestmentData(newData: InvestmentData): Promise<InvestmentData> {
    if (!this.validateDataStructure(newData)) {
      throw new Error('Invalid data structure provided');
    }

    this.data = newData;
    this.notifySubscribers();
    return this.data;
  }

  private validateDataStructure(data: any): data is InvestmentData {
    return (
      data &&
      typeof data.explanation === 'string' &&
      Array.isArray(data.recommendations) &&
      data.recommendations.every((rec: any) =>
        typeof rec.investment_type === 'string' &&
        typeof rec.allocation_percentage === 'number' &&
        Array.isArray(rec.specific_suggestions)
      ) &&
      typeof data.market_analysis === 'object' &&
      typeof data.review_schedule === 'string' &&
      typeof data.disclaimer === 'string'
    );
  }
}

export const investmentDataService = new InvestmentDataService();