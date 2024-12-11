import { InvestmentData, InvestmentDataSource } from '../types/investment';
import { getDefaultInvestmentData, fallbackDefaultInvestmentData } from '../data/defaultInvestmentData';

export type InvestmentDataState = {
  data: InvestmentData | null;
  isLoading: boolean;
  error: string | null;
};

class InvestmentDataService implements InvestmentDataSource {
  private state: InvestmentDataState;
  private subscribers: Set<(state: InvestmentDataState) => void>;
  private clerkId: string | null;

  constructor() {
    this.state = {
      data: null,
      isLoading: true,
      error: null
    };
    this.subscribers = new Set();
    this.clerkId = null;
  }

  setUser(clerkId: string) {
    this.clerkId = clerkId;
    if (!clerkId) {
      this.updateState({
        data: null,
        isLoading: false,
        error: null
      });
    } else {
      this.updateState({
        ...this.state,
        isLoading: true,
        error: null
      });
      this.initializeData();
    }
  }

  private async initializeData() {
    if (!this.clerkId) {
      console.log('No user set, using null data');
      this.updateState({
        data: null,
        isLoading: false,
        error: null
      });
      return;
    }

    try {
      const data = await getDefaultInvestmentData(this.clerkId);
      this.updateState({
        data,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to initialize investment data:', error);
      // Use fallback data for new users instead of reloading
      this.updateState({
        data: fallbackDefaultInvestmentData,
        isLoading: false,
        error: null
      });
    }
  }

  subscribe(callback: (state: InvestmentDataState) => void) {
    this.subscribers.add(callback);
    // Immediately call with current state
    callback(this.state);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private updateState(newState: InvestmentDataState) {
    this.state = newState;
    this.notifySubscribers();
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.state));
  }

  async fetchInvestmentData(): Promise<InvestmentData | null> {
    if (!this.clerkId) {
      console.log('No user set, returning null');
      return null;
    }

    try {
      this.updateState({
        ...this.state,
        isLoading: true,
        error: null
      });

      const data = await getDefaultInvestmentData(this.clerkId);
      this.updateState({
        data,
        isLoading: false,
        error: null
      });
      return data;
    } catch (error) {
      console.error('Failed to fetch investment data:', error);
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      return null;
    }
  }

  async updateInvestmentData(newData: InvestmentData): Promise<InvestmentData> {
    this.updateState({
      data: newData,
      isLoading: false,
      error: null
    });
    return newData;
  }
}

export const investmentDataService = new InvestmentDataService();