import { InvestmentData, InvestmentDataSource } from '../types/investment';
import { getDefaultInvestmentData, fallbackDefaultInvestmentData } from '../data/defaultInvestmentData';
import { API_URL } from '../../config';

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
      // First sync the user
      const syncResponse = await fetch(`${API_URL}/api/sync-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clerkId: this.clerkId,
          email: 'user@example.com' // This should come from Clerk
        })
      });

      console.log('Sync response status:', syncResponse.status);
      const syncData = await syncResponse.json();
      console.log('Sync response data:', syncData);

      if (!syncResponse.ok) {
        throw new Error(syncData.error || 'Failed to sync user');
      }

      // Then get investment data
      const data = await getDefaultInvestmentData(this.clerkId);
      
      // 404 is expected for new users, use fallback data
      if (data === fallbackDefaultInvestmentData) {
        this.updateState({
          data,
          isLoading: false,
          error: null
        });
        return;
      }

      this.updateState({
        data,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to initialize investment data:', error);
      // Use fallback data instead of showing error
      this.updateState({
        data: fallbackDefaultInvestmentData,
        isLoading: false,
        error: null
      });
    }
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
      // Use fallback data instead of showing error
      const fallbackData = fallbackDefaultInvestmentData;
      this.updateState({
        data: fallbackData,
        isLoading: false,
        error: null
      });
      return fallbackData;
    }
  }

  subscribe(callback: (state: InvestmentDataState) => void) {
    this.subscribers.add(callback);
    callback(this.state);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private updateState(newState: InvestmentDataState) {
    this.state = newState;
    this.subscribers.forEach(callback => callback(newState));
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