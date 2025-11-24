
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, TransactionType, FinancialSummary, PaymentMethod, BudgetLimit, CustomCategory, AppTheme } from './types';
import { Dashboard } from './views/Dashboard';
import { AddTransaction } from './views/AddTransaction';
import { Analytics } from './views/Analytics';
import { Advisor } from './views/Advisor';
import { Limits } from './views/Limits';
import { AllTransactions } from './views/AllTransactions';
import { Home, PieChart, Bot, Target, Plus, AlertTriangle } from 'lucide-react';
import { dbService } from './services/db';

type View = 'DASHBOARD' | 'ANALYTICS' | 'LIMITS' | 'ADVISOR' | 'ALL_TRANSACTIONS';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [isAdding, setIsAdding] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [limits, setLimits] = useState<BudgetLimit[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [theme, setTheme] = useState<AppTheme>('system');

  // Confirmation Modal State
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedTransactions, loadedLimits, loadedCustomCats, loadedTheme] = await Promise.all([
          dbService.getTransactions(),
          dbService.getLimits(),
          dbService.getCustomCategories(),
          dbService.getTheme()
        ]);
        
        setTransactions(loadedTransactions);
        setLimits(loadedLimits);
        setCustomCategories(loadedCustomCats);
        setTheme(loadedTheme);

      } catch (error) {
        console.error("Failed to load data from IndexedDB", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Theme Effect
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (t: AppTheme) => {
      if (t === 'dark') {
        root.classList.add('dark');
      } else if (t === 'light') {
        root.classList.remove('dark');
      } else {
        // System
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
           root.classList.add('dark');
        } else {
           root.classList.remove('dark');
        }
      }
    };
    applyTheme(theme);
    
    // If system, listen for changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const handleThemeChange = async (newTheme: AppTheme) => {
    setTheme(newTheme);
    await dbService.saveTheme(newTheme);
  };

  const saveTransaction = async (transactionData: Omit<Transaction, 'id'>, id?: string) => {
    let newTransaction: Transaction;

    if (id) {
      // Edit existing
      newTransaction = { ...transactionData, id };
      setTransactions(prev => prev.map(item => item.id === id ? newTransaction : item));
    } else {
      // Add new
      newTransaction = {
        ...transactionData,
        id: uuidv4(),
      };
      setTransactions(prev => [newTransaction, ...prev]);
    }
    
    await dbService.saveTransaction(newTransaction);
    setIsAdding(false);
    setEditingTransaction(null);
  };

  const deleteTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    await dbService.deleteTransaction(id);
    setIsAdding(false);
    setEditingTransaction(null);
  };

  const openEditModal = (t: Transaction) => {
    setEditingTransaction(t);
    setIsAdding(true);
  };

  const updateLimit = async (limit: BudgetLimit) => {
    setLimits(prev => {
      const exists = prev.find(l => l.category === limit.category);
      if (exists) {
        return prev.map(l => l.category === limit.category ? limit : l);
      }
      return [...prev, limit];
    });
    await dbService.saveLimit(limit);
  };

  const removeLimit = async (category: string) => {
    setLimits(prev => prev.filter(l => l.category !== category));
    await dbService.deleteLimit(category);
  };

  const addCustomCategory = async (cat: CustomCategory) => {
    setCustomCategories(prev => [...prev, cat]);
    await dbService.saveCustomCategory(cat);
  };

  const handleClearData = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = async () => {
    try {
      await dbService.clearAllData();
      
      // Clear state immediately instead of reloading page (which causes 404s in some envs)
      setTransactions([]);
      setLimits([]);
      setCustomCategories([]);
      setTheme('system');
      
      // Reset UI state
      setCurrentView('DASHBOARD');
      setEditingTransaction(null);
      setIsAdding(false);
      
      setShowResetConfirm(false);
    } catch (e) {
      console.error("Reset failed", e);
      alert("Failed to reset data. Please try again.");
      setShowResetConfirm(false);
    }
  };

  // Improved CSV Line Parser handling quotes
  const parseCSVLine = (text: string) => {
    const result = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        result.push(cur);
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur);
    return result.map(s => s.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
  };

  const handleImport = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      
      const lines = text.split('\n');
      const newTransactions: Transaction[] = [];
      
      // Skip header (index 0)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cols = parseCSVLine(line);
        if (cols.length >= 5) {
           let dateStr = cols[0];
           const typeStr = cols[1] as TransactionType;
           const category = cols[2];
           const amount = parseFloat(cols[3]);
           const methodStr = cols[4] as PaymentMethod;
           const noteRaw = cols[5] || '';

           // Fix date parsing for Safari/Older browsers if it lacks 'T'
           if (dateStr && dateStr.indexOf('T') === -1) {
              dateStr = dateStr.replace(' ', 'T');
           }

           const dateObj = new Date(dateStr);
           
           if (!isNaN(amount) && !isNaN(dateObj.getTime())) {
             const t: Transaction = {
               id: uuidv4(),
               date: dateObj.toISOString(),
               type: typeStr,
               category: category,
               amount: amount,
               method: methodStr,
               note: noteRaw
             };
             newTransactions.push(t);
             await dbService.saveTransaction(t);
           }
        }
      }
      
      if (newTransactions.length > 0) {
        setTransactions(prev => [...newTransactions, ...prev]);
        alert(`Successfully imported ${newTransactions.length} transactions.`);
      } else {
        alert("No valid transactions found to import. Please check if your CSV date format is YYYY-MM-DD HH:MM.");
      }
    };
    reader.readAsText(file);
  };

  const summary: FinancialSummary = transactions.reduce((acc, t) => {
    if (t.type === TransactionType.INCOME) {
      acc.totalIncome += t.amount;
      acc.totalBalance += t.amount;
      if (t.method === PaymentMethod.CASH) acc.cashBalance += t.amount;
      else acc.cardBalance += t.amount;
    } else {
      acc.totalExpense += t.amount;
      acc.totalBalance -= t.amount;
      if (t.method === PaymentMethod.CASH) acc.cashBalance -= t.amount;
      else acc.cardBalance -= t.amount;
    }
    return acc;
  }, {
    totalBalance: 0,
    cashBalance: 0,
    cardBalance: 0,
    totalIncome: 0,
    totalExpense: 0
  });

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
         <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin mb-4"></div>
         <p className="text-gray-400 font-medium animate-pulse">Loading Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto h-screen bg-gray-50 dark:bg-gray-900 relative shadow-2xl overflow-hidden flex flex-col transition-colors duration-200">
      
      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-700 animate-scale-up">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 mx-auto text-red-500">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Reset All Data?</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm text-center">
              This will permanently delete all your transactions, categories, and settings. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmReset}
                className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Content */}
      <main className="flex-1 overflow-hidden relative">
        {currentView === 'DASHBOARD' && (
          <Dashboard 
            transactions={transactions} 
            summary={summary} 
            onAddClick={() => { setEditingTransaction(null); setIsAdding(true); }}
            onEditClick={openEditModal}
            onImport={handleImport}
            onExport={() => {}}
            onClearData={handleClearData}
            onViewAll={() => setCurrentView('ALL_TRANSACTIONS')}
            customCategories={customCategories}
            currentTheme={theme}
            onThemeChange={handleThemeChange}
          />
        )}
        {currentView === 'ALL_TRANSACTIONS' && (
          <AllTransactions 
            transactions={transactions}
            onBack={() => setCurrentView('DASHBOARD')}
            onEditClick={openEditModal}
            customCategories={customCategories}
          />
        )}
        {currentView === 'ANALYTICS' && (
          <Analytics transactions={transactions} />
        )}
        {currentView === 'LIMITS' && (
          <Limits 
            transactions={transactions} 
            limits={limits} 
            onUpdateLimit={updateLimit}
            onRemoveLimit={removeLimit}
            customCategories={customCategories}
            onAddCustomCategory={addCustomCategory}
          />
        )}
        {currentView === 'ADVISOR' && (
          <Advisor transactions={transactions} />
        )}
      </main>

      {/* Add/Edit Transaction Modal Overlay */}
      {isAdding && (
        <AddTransaction 
          onSave={saveTransaction} 
          onDelete={deleteTransaction}
          onCancel={() => { setIsAdding(false); setEditingTransaction(null); }}
          existingTransaction={editingTransaction}
          summary={summary}
          customCategories={customCategories}
          onAddCustomCategory={addCustomCategory}
        />
      )}

      {/* Bottom Navigation Bar */}
      {currentView !== 'ALL_TRANSACTIONS' && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-around items-center z-40 rounded-t-3xl shadow-[0_-5px_10px_rgba(0,0,0,0.02)] shrink-0 absolute bottom-0 w-full transition-colors h-[72px]">
          <button 
            onClick={() => setCurrentView('DASHBOARD')}
            className={`flex flex-col items-center gap-1 p-2 w-14 transition-colors ${currentView === 'DASHBOARD' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}
          >
            <Home size={22} strokeWidth={currentView === 'DASHBOARD' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('ANALYTICS')}
            className={`flex flex-col items-center gap-1 p-2 w-14 transition-colors ${currentView === 'ANALYTICS' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}
          >
            <PieChart size={22} strokeWidth={currentView === 'ANALYTICS' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Analytics</span>
          </button>

          {/* Centered Floating Add Button */}
          <div className="relative -mt-6">
             <button 
               onClick={() => { setEditingTransaction(null); setIsAdding(true); }}
               className="bg-indigo-600 text-white w-14 h-14 rounded-full shadow-lg shadow-indigo-300 dark:shadow-indigo-900 flex items-center justify-center hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all border-4 border-gray-50 dark:border-gray-900"
             >
               <Plus size={28} />
             </button>
          </div>

          <button 
            onClick={() => setCurrentView('LIMITS')}
            className={`flex flex-col items-center gap-1 p-2 w-14 transition-colors ${currentView === 'LIMITS' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}
          >
            <Target size={22} strokeWidth={currentView === 'LIMITS' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Limits</span>
          </button>

          <button 
            onClick={() => setCurrentView('ADVISOR')}
            className={`flex flex-col items-center gap-1 p-2 w-14 transition-colors ${currentView === 'ADVISOR' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}
          >
            <Bot size={22} strokeWidth={currentView === 'ADVISOR' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Advisor</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
