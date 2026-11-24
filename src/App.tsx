import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { DashboardTab } from './components/dashboard/DashboardTab';
import { TransactionsTab } from './components/transactions/TransactionsTab';
import { SimulatorTab } from './components/simulator/SimulatorTab';
import { GoalsTab } from './components/goals/GoalsTab';
import { ProfileTab } from './components/profile/ProfileTab';
import { EditBalanceModal } from './components/common/EditBalanceModal';
import { TransactionWizardModal } from './components/transactions/TransactionWizardModal';
import { FloatingAddButton } from './components/common/FloatingAddButton';
import { ToastUndo } from './components/common/ToastUndo';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { AuthScreen } from './components/auth/AuthScreen';
import { ResetPasswordScreen } from './components/auth/ResetPasswordScreen';
import { TrendingUp, Loader2 } from 'lucide-react';

const MainAppLayout: React.FC = () => {
  const { user, isLoading, isPasswordRecovery, setIsPasswordRecovery } = useAuth();
  const {
    activeTab,
    currentBalance,
    setCurrentBalance,
    addTransaction,
  } = useFinance();

  const [isEditBalanceOpen, setIsEditBalanceOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Initial Auth Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/30 mb-4 animate-bounce">
          <TrendingUp size={36} className="stroke-[2.5]" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Horizonte</h2>
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
          <Loader2 size={13} className="animate-spin text-teal-600" />
          <span>Carregando suas finanças...</span>
        </p>
      </div>
    );
  }

  // Password Recovery Screen
  if (isPasswordRecovery) {
    return <ResetPasswordScreen onSuccess={() => setIsPasswordRecovery(false)} />;
  }

  // Not authenticated -> show Login / Signup / Forgot Password screens
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased selection:bg-teal-500 selection:text-white">
      {/* Top Header */}
      <Header onOpenNewTransaction={() => setIsWizardOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-4 pt-4 pb-28">
        {activeTab === 'inicio' && (
          <DashboardTab
            onEditBalance={() => setIsEditBalanceOpen(true)}
            onOpenNewTransaction={() => setIsWizardOpen(true)}
          />
        )}

        {activeTab === 'lancamentos' && <TransactionsTab />}

        {activeTab === 'simulador' && <SimulatorTab />}

        {activeTab === 'metas' && <GoalsTab />}

        {activeTab === 'perfil' && <ProfileTab />}
      </main>

      {/* Floating Action Button (Always visible on all screens) */}
      <FloatingAddButton onClick={() => setIsWizardOpen(true)} />

      {/* Floating Toast with Undo */}
      <ToastUndo />

      {/* Bottom 5-Tab Navigation */}
      <Navbar />

      {/* Step-by-Step Transaction Creation Wizard Modal */}
      <TransactionWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSave={(txData) => addTransaction(txData)}
      />

      {/* Edit Current Balance Modal */}
      <EditBalanceModal
        isOpen={isEditBalanceOpen}
        onClose={() => setIsEditBalanceOpen(false)}
        currentBalance={currentBalance}
        onSave={(newBal) => setCurrentBalance(newBal)}
      />

      {/* Onboarding & Guided Setup Modal */}
      <OnboardingModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <MainAppLayout />
      </FinanceProvider>
    </AuthProvider>
  );
}
