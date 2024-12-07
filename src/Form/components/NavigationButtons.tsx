import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
}) => {
  return (
    <div className="flex justify-between pt-6">
      {currentStep > 1 && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onPrevious}
          className="flex items-center px-6 py-3 text-gray-300 bg-dark-card border border-dark-border rounded-lg hover:bg-opacity-80 transition-all hover:scale-105"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Previous
        </motion.button>
      )}
      {currentStep < totalSteps ? (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onNext}
          className="flex items-center ml-auto px-6 py-3 text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg hover:opacity-90 transition-all hover:scale-105"
        >
          Next
          <ArrowRight className="h-5 w-5 ml-2" />
        </motion.button>
      ) : (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onSubmit}
          className="flex items-center ml-auto px-6 py-3 text-white bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg hover:opacity-90 transition-all hover:scale-105"
        >
          Submit
          <ArrowRight className="h-5 w-5 ml-2" />
        </motion.button>
      )}
    </div>
  );
};