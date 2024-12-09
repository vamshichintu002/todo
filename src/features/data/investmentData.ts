import { InvestmentData } from '../types/investment';

export const investmentData: InvestmentData = {
  "explanation": "Based on your Conservative risk profile and current market conditions, we have prepared a personalized investment portfolio recommendation. The allocation considers your investment horizon of Medium-term and comfort with fluctuations level of 5.",
  "recommendations": [
    {
      "investment_type": "Bonds",
      "allocation_percentage": 40.0,
      "details": "Recommended allocation for bonds",
      "specific_suggestions": [
        {
          "name": "Treasury Bonds",
          "ticker": "Various",
          "rationale": "Low-risk government securities"
        },
        {
          "name": "Investment Grade Corporate Bonds",
          "ticker": "Various",
          "rationale": "Stable income with moderate risk"
        }
      ],
      "entry_strategy": "Implement a bond ladder strategy with varying maturities",
      "exit_strategy": "Hold to maturity unless significant changes in interest rates",
      "risk_mitigation": "Diversify across different bond types and maturities"
    },
    {
      "investment_type": "Mutual_Funds",
      "allocation_percentage": 30.0,
      "details": "Recommended allocation for mutual funds",
      "specific_suggestions": [
        {
          "name": "Bond Funds",
          "ticker": "Various",
          "rationale": "Professional management of fixed income"
        },
        {
          "name": "Dividend Growth Funds",
          "ticker": "Various",
          "rationale": "Steady income and potential growth"
        }
      ],
      "entry_strategy": "Use dollar-cost averaging for regular investments",
      "exit_strategy": "Review and rebalance annually",
      "risk_mitigation": "Choose funds with different investment styles and asset classes"
    },
    {
      "investment_type": "Stocks",
      "allocation_percentage": 20.0,
      "details": "Recommended allocation for stocks",
      "specific_suggestions": [
        {
          "name": "Dividend Aristocrats ETF",
          "ticker": "NOBL",
          "rationale": "Companies with consistent dividend growth"
        },
        {
          "name": "Defensive Sector Stocks",
          "ticker": "Various",
          "rationale": "Stable companies in utilities and consumer staples"
        }
      ],
      "entry_strategy": "Gradual position building through limit orders",
      "exit_strategy": "Set conservative stop-loss orders",
      "risk_mitigation": "Focus on low-volatility, high-quality stocks"
    },
    {
      "investment_type": "Cash_Equivalents",
      "allocation_percentage": 10.0,
      "details": "Recommended allocation for cash equivalents",
      "specific_suggestions": [
        {
          "name": "High-Yield Savings Account",
          "ticker": "N/A",
          "rationale": "Liquid and safe short-term savings"
        },
        {
          "name": "Money Market Funds",
          "ticker": "Various",
          "rationale": "Low-risk, short-term investments"
        }
      ],
      "entry_strategy": "Maintain a consistent emergency fund",
      "exit_strategy": "Use as needed for short-term liquidity",
      "risk_mitigation": "Spread across multiple FDIC-insured accounts"
    }
  ],
  "market_analysis": {
    "Bonds": {
      "current_trend": "Stable returns in low interest rate environment",
      "outlook": "Modest yield expectations with potential rate hikes",
      "key_factors": [
        "Federal Reserve policies",
        "Inflation expectations"
      ],
      "risks": [
        "Interest rate risk",
        "Inflation risk"
      ],
      "specific_suggestions": [
        {
          "name": "Treasury Bonds",
          "ticker": "Various",
          "rationale": "Low-risk government securities"
        },
        {
          "name": "Investment Grade Corporate Bonds",
          "ticker": "Various",
          "rationale": "Stable income with moderate risk"
        }
      ]
    },
    "Mutual_Funds": {
      "current_trend": "Increasing interest in passive and ESG funds",
      "outlook": "Positive for cost-conscious investors",
      "key_factors": [
        "Fee compression",
        "Regulatory changes"
      ],
      "risks": [
        "Underperformance risk",
        "Liquidity risk in specialized funds"
      ],
      "specific_suggestions": [
        {
          "name": "Bond Funds",
          "ticker": "Various",
          "rationale": "Professional management of fixed income"
        },
        {
          "name": "Dividend Growth Funds",
          "ticker": "Various",
          "rationale": "Steady income and potential growth"
        }
      ]
    },
    "Stocks": {
      "current_trend": "Recovery from recent market volatility",
      "outlook": "Cautiously optimistic with focus on quality",
      "key_factors": [
        "Economic recovery pace",
        "Corporate earnings growth"
      ],
      "risks": [
        "Market corrections",
        "Sector rotation"
      ],
      "specific_suggestions": [
        {
          "name": "Dividend Aristocrats ETF",
          "ticker": "NOBL",
          "rationale": "Companies with consistent dividend growth"
        },
        {
          "name": "Defensive Sector Stocks",
          "ticker": "Various",
          "rationale": "Stable companies in utilities and consumer staples"
        }
      ]
    },
    "Cash_Equivalents": {
      "current_trend": "Low yields but high liquidity",
      "outlook": "Potential for yield improvement with rate hikes",
      "key_factors": [
        "Central bank policies",
        "Short-term interest rates"
      ],
      "risks": [
        "Opportunity cost in rising markets",
        "Purchasing power erosion due to inflation"
      ],
      "specific_suggestions": [
        {
          "name": "High-Yield Savings Account",
          "ticker": "N/A",
          "rationale": "Liquid and safe short-term savings"
        },
        {
          "name": "Money Market Funds",
          "ticker": "Various",
          "rationale": "Low-risk, short-term investments"
        }
      ]
    }
  },
  "review_schedule": "Quarterly",
  "disclaimer": "This recommendation is based on current market conditions and your profile. Past performance is not indicative of future results. Please consult with a financial advisor before making investment decisions."
};