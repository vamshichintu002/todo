import React, { useState } from 'react';
import clsx from 'clsx';
import { Card } from '../features/components/ui/Card';
import { AllocationPieChart } from '../features/components/charts/AllocationPieChart';
import { MarketAnalysisCard } from '../features/components/MarketAnalysisCard';
import { DetailedAnalysisCard } from '../features/components/DetailedAnalysisCard';
import { InvestmentTable } from '../features/components/InvestmentTable';
import { RecommendedInvestments } from '../features/components/RecommendedInvestments';
import { TextBasedView } from '../features/components/TextBasedView';
import { ThemeToggle } from '../features/components/ThemeToggle';
import { useTheme, ThemeProvider } from '../features/contexts/ThemeContext';
import { Sidebar } from '../features/components/Sidebar';
import { useInvestmentData } from '../features/hooks/useInvestmentData';
import { LoadingSpinner } from '../features/components/ui/LoadingSpinner';
import { ErrorMessage } from '../features/components/ui/ErrorMessage';
import { ChatWidget } from '../features/components/ChatWidget';
import { DashboardHeader } from '../features/components/DashboardHeader';
import { OtherInvestments } from '../features/pages/OtherInvestments';

const DashboardContent: React.FC = () => {
  const [viewMode, setViewMode] = useState<'visual' | 'text'>('visual');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<'portfolio' | 'other'>('portfolio');
  const { theme } = useTheme();
  const { data, loading, error } = useInvestmentData();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !data) {
    return <ErrorMessage error={error} />;
  }

  const allocationData = data.recommendations.map(rec => ({
    name: rec.investment_type.replace('_', ' '),
    value: rec.allocation_percentage
  }));

  return (
    <div className="min-h-screen transition-colors bg-gradient-to-br from-background via-background to-background/95">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
      
      <main className={clsx(
        'w-full transition-all duration-300',
        sidebarOpen && 'sm:pl-64'
      )}>
        {currentPage === 'portfolio' ? (
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <DashboardHeader 
                viewMode={viewMode} 
                setViewMode={setViewMode}
                explanation={data.explanation}
              />

              {viewMode === 'visual' ? (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card variant="gradient" className="lg:sticky lg:top-6">
                      <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Portfolio Allocation
                      </h2>
                      <AllocationPieChart data={allocationData} />
                    </Card>
                    <MarketAnalysisCard marketAnalysis={data.market_analysis} />
                  </div>

                  <InvestmentTable recommendations={data.recommendations} />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {Object.entries(data.market_analysis).map(([type, analysis]) => (
                      <DetailedAnalysisCard key={type} type={type} analysis={analysis} />
                    ))}
                  </div>

                  <RecommendedInvestments recommendations={data.recommendations} />

                  <Card className="bg-opacity-50">
                    <p className="text-xs sm:text-sm text-secondary italic leading-relaxed">
                      {data.disclaimer}
                    </p>
                  </Card>
                </>
              ) : (
                <TextBasedView data={data} />
              )}
            </div>
          </div>
        ) : (
          <OtherInvestments />
        )}
      </main>

      <ChatWidget />
    </div>
  );
};

const DashboardPage: React.FC = () => {
  return (
    <ThemeProvider>
      <DashboardContent />
    </ThemeProvider>
  );
};

export default DashboardPage;
