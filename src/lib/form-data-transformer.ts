interface FormData {
  name: string;
  phone: string;
  age: number;
  employmentStatus: string;
  annualIncome: number;
  maritalStatus: string;
  dependents: string;
  selectedGoals: string[];
  otherGoalDescription: string;
  investmentHorizon: string;
  riskTolerance: string;
  riskComfortLevel: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  hasDebts: boolean;
  debtDetails: string;
  hasEmergencyFund: boolean;
  emergencyFundMonths: number;
  selectedInvestments: string[];
  otherInvestmentDescription: string;
  managementStyle: string;
  hasEthicalPreferences: boolean;
  ethicalPreferences: string;
  interestedInTaxAdvantaged: boolean;
  needsLiquidity: boolean;
  liquidityTimeframe: string;
  investmentKnowledge: string;
  hasInvestmentExperience: boolean;
  investmentExperience: string;
  planningLifeChanges: boolean;
  lifeChangesDetails: string;
  investmentInvolvement: string;
  additionalComments: string;
}

interface FinancialGoal {
  goal_type: string;
  target_amount: number;
  timeline_years: number;
}

interface ApiRequestData {
  age: number;
  employment_status: string;
  annual_income: number;
  marital_status: string;
  dependents: number;
  financial_goals: FinancialGoal[];
  investment_horizon: string;
  risk_tolerance: string;
  risk_comfort_level: number;
  monthly_income: number;
  monthly_expenses: number;
  has_debts: boolean;
  debt_details: string;
  has_emergency_fund: boolean;
  emergency_fund_months: number;
  selected_investments: string[];
  management_style: string;
  has_ethical_preferences: boolean;
  ethical_preferences: string;
  interested_in_tax_advantaged: boolean;
  needs_liquidity: boolean;
  liquidity_timeframe: string;
  investment_knowledge: string;
  has_investment_experience: boolean;
  investment_experience: string;
  planning_life_changes: boolean;
  life_changes_details: string;
  investment_involvement: string;
  additional_comments: string;
}

export default class FormDataTransformer {
  private formData: FormData;

  constructor(formData: FormData) {
    this.formData = formData;
  }

  transform(): ApiRequestData {
    return {
      age: this.formData.age,
      employment_status: this.formData.employmentStatus,
      annual_income: this.formData.annualIncome,
      marital_status: this.formData.maritalStatus,
      dependents: parseInt(this.formData.dependents, 10),
      financial_goals: this.transformGoals(),
      investment_horizon: this.formData.investmentHorizon,
      risk_tolerance: this.formData.riskTolerance,
      risk_comfort_level: this.formData.riskComfortLevel,
      monthly_income: this.formData.monthlyIncome,
      monthly_expenses: this.formData.monthlyExpenses,
      has_debts: this.formData.hasDebts,
      debt_details: this.formData.debtDetails,
      has_emergency_fund: this.formData.hasEmergencyFund,
      emergency_fund_months: this.formData.emergencyFundMonths,
      selected_investments: this.formData.selectedInvestments,
      management_style: this.formData.managementStyle,
      has_ethical_preferences: this.formData.hasEthicalPreferences,
      ethical_preferences: this.formData.ethicalPreferences,
      interested_in_tax_advantaged: this.formData.interestedInTaxAdvantaged,
      needs_liquidity: this.formData.needsLiquidity,
      liquidity_timeframe: this.formData.liquidityTimeframe,
      investment_knowledge: this.formData.investmentKnowledge,
      has_investment_experience: this.formData.hasInvestmentExperience,
      investment_experience: this.formData.investmentExperience,
      planning_life_changes: this.formData.planningLifeChanges,
      life_changes_details: this.formData.lifeChangesDetails,
      investment_involvement: this.formData.investmentInvolvement,
      additional_comments: this.formData.additionalComments
    };
  }

  private transformGoals(): FinancialGoal[] {
    return this.formData.selectedGoals.map(goal => ({
      goal_type: goal,
      target_amount: 0, // You might want to add these fields to your form
      timeline_years: 5 // Default value, adjust as needed
    }));
  }
}
