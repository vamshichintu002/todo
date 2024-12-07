import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FormStep } from './components/FormStep';
import { ProgressBar } from './components/ProgressBar';
import { NavigationButtons } from './components/NavigationButtons';
import { PersonalInfo } from './components/PersonalInfo';
import { FinancialGoals } from './components/FinancialGoals';
import { RiskAssessment } from './components/RiskAssessment';
import { CurrentFinances } from './components/CurrentFinances';
import { InvestmentPreferences } from './components/InvestmentPreferences';
import { AdditionalInfo } from './components/AdditionalInfo';
import { STEP_TITLES } from './constants';
import { FormData } from './types/form';
import { initialFormData } from './utils/initialState';
import { validateText, validateAmount, validateNumber, validatePhone, validateName } from './utils/validation';

function App() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let error = '';

    if (name === 'name') {
      error = validateName(value) || '';
    } else if (name === 'phone') {
      error = validatePhone(value) || '';
    } else if (['employmentStatus', 'maritalStatus', 'lifeChangesDetails'].includes(name)) {
      error = validateText(value) || '';
    } else if (['annualIncome', 'monthlyIncome', 'monthlyExpenses'].includes(name)) {
      error = validateAmount(value) || '';
    } else if (name === 'riskComfortLevel') {
      error = validateNumber(value, 1, 10) || '';
    }

    setErrors(prev => ({
      ...prev,
      [name]: error
    }));

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      selectedGoals: prev.selectedGoals.includes(goal)
        ? prev.selectedGoals.filter(g => g !== goal)
        : [...prev.selectedGoals, goal]
    }));
  };

  const handleInvestmentToggle = (investment: string) => {
    setFormData(prev => ({
      ...prev,
      selectedInvestments: prev.selectedInvestments.includes(investment)
        ? prev.selectedInvestments.filter(i => i !== investment)
        : [...prev.selectedInvestments, investment]
    }));
  };

  const handleToggle = (field: keyof FormData) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return !!(
          formData.name &&
          formData.phone &&
          formData.age &&
          formData.employmentStatus &&
          formData.annualIncome &&
          formData.maritalStatus &&
          !errors.name &&
          !errors.phone &&
          !errors.age
        );
      case 2:
        return formData.selectedGoals.length > 0 && !!formData.investmentHorizon;
      case 3:
        return !!formData.riskTolerance && !!formData.riskComfortLevel;
      case 4:
        return !!(formData.monthlyIncome && formData.monthlyExpenses);
      case 5:
        return formData.selectedInvestments.length > 0 && !!formData.managementStyle;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, STEP_TITLES.length));
    } else {
      alert('Please fill in all required fields correctly before proceeding.');
    }
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
  
  const handleSubmit = () => {
    if (validateStep(step)) {
      console.log('Form submitted:', formData);
    } else {
      alert('Please fill in all required fields correctly before submitting.');
    }
  };

  return (
    <div className="min-h-screen bg-dark p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-card rounded-2xl shadow-xl p-6 md:p-8 border border-dark-border"
        >
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-2"
            >
              Investment Profile Questionnaire
            </motion.h1>
            
            <ProgressBar
              currentStep={step}
              totalSteps={STEP_TITLES.length}
              stepTitles={STEP_TITLES}
            />
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <FormStep isVisible={step === 1}>
              <PersonalInfo 
                formData={formData} 
                onChange={handleInputChange}
              />
            </FormStep>

            <FormStep isVisible={step === 2}>
              <FinancialGoals
                formData={formData}
                onGoalChange={handleGoalToggle}
                onInputChange={handleInputChange}
                onHorizonChange={(value) => setFormData(prev => ({ ...prev, investmentHorizon: value }))}
              />
            </FormStep>

            <FormStep isVisible={step === 3}>
              <RiskAssessment
                formData={formData}
                onRiskToleranceChange={(value) => setFormData(prev => ({ ...prev, riskTolerance: value as typeof prev.riskTolerance }))}
                onInputChange={handleInputChange}
              />
            </FormStep>

            <FormStep isVisible={step === 4}>
              <CurrentFinances
                formData={formData}
                onChange={handleInputChange}
                onToggle={handleToggle}
              />
            </FormStep>

            <FormStep isVisible={step === 5}>
              <InvestmentPreferences
                formData={formData}
                onInvestmentChange={handleInvestmentToggle}
                onInputChange={handleInputChange}
                onStyleChange={(value) => setFormData(prev => ({ ...prev, managementStyle: value as typeof prev.managementStyle }))}
                onToggle={handleToggle}
              />
            </FormStep>

            <FormStep isVisible={step === 6}>
              <AdditionalInfo
                formData={formData}
                onChange={handleInputChange}
                onToggle={handleToggle}
                onInvolvementChange={(value) => setFormData(prev => ({ ...prev, investmentInvolvement: value as typeof prev.investmentInvolvement }))}
              />
            </FormStep>

            <NavigationButtons
              currentStep={step}
              totalSteps={STEP_TITLES.length}
              onPrevious={prevStep}
              onNext={nextStep}
              onSubmit={handleSubmit}
            />
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default App;