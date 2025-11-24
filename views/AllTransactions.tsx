
import React, { useMemo } from 'react';
import { Transaction, CustomCategory } from '../types';
import { TransactionCard } from '../components/TransactionCard';
import { ArrowLeft, Calendar } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  onBack: () => void;
  onEditClick: (t: Transaction) => void;
  customCategories?: CustomCategory[];
}

export const AllTransactions: React.FC<Props> = ({ transactions, onBack, onEditClick, customCategories = [] }) => {
  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const grouped: Record<string, Transaction[]> = {};
    
    // Sort descending first
    const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sorted.forEach(t => {
      const dateKey = new Date(t.date).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(t);
    });
    return grouped;
  }, [transactions]);

  const getDayHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 animate-fade-in transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-4 shadow-sm flex items-center gap-4 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700 transition-colors">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">All Transactions</h2>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
        {Object.keys(groupedTransactions).length === 0 ? (
           <div className="text-center py-20 text-gray-400 dark:text-gray-600">
             <Calendar size={48} className="mx-auto mb-3 opacity-20" />
             <p>No transactions found.</p>
           </div>
        ) : (
          Object.keys(groupedTransactions).map(dateKey => (
            <div key={dateKey} className="mb-6">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 ml-2 sticky top-0">
                {getDayHeader(dateKey)}
              </h3>
              {groupedTransactions[dateKey].map(t => (
                <TransactionCard 
                  key={t.id} 
                  transaction={t} 
                  onClick={onEditClick}
                  customCategories={customCategories}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
