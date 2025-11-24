
import React from 'react';
import { Transaction, TransactionType, CustomCategory } from '../types';
import { CATEGORY_ICONS, CATEGORY_COLORS, AVAILABLE_CUSTOM_ICONS } from '../constants';
import { CreditCard, Banknote, ChevronRight } from 'lucide-react';

interface Props {
  transaction: Transaction;
  onClick: (t: Transaction) => void;
  customCategories?: CustomCategory[];
}

export const TransactionCard: React.FC<Props> = ({ transaction, onClick, customCategories = [] }) => {
  // Resolve Icon: Check standard map first, then custom categories
  let Icon = CATEGORY_ICONS[transaction.category];
  let color = CATEGORY_COLORS[transaction.category];

  if (!Icon) {
    const customCat = customCategories.find(c => c.name === transaction.category);
    if (customCat) {
      Icon = AVAILABLE_CUSTOM_ICONS[customCat.iconName] || CATEGORY_ICONS['Other'];
      color = customCat.color; // Use custom color if available, else fall back
    } else {
      Icon = CATEGORY_ICONS['Other'];
    }
  }
  
  // Fallback color if still undefined
  if (!color) color = '#ccc';

  const isExpense = transaction.type === TransactionType.EXPENSE;
  
  return (
    <div 
      onClick={() => onClick(transaction)}
      className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-3 hover:shadow-md transition-all cursor-pointer active:scale-[0.99] duration-100"
    >
      <div className="flex items-center gap-4">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm shrink-0"
          style={{ backgroundColor: color }}
        >
          <Icon size={20} />
        </div>
        <div className="overflow-hidden">
          <h4 className="font-semibold text-gray-800 dark:text-gray-100 truncate">{transaction.category}</h4>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-2">
            <span className="shrink-0">{new Date(transaction.date).toLocaleDateString()}</span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="shrink-0">{new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
          </div>
          <div className="flex items-center text-xs text-gray-400 dark:text-gray-500 gap-1 mt-0.5">
               {transaction.method === 'CARD' ? <CreditCard size={10} /> : <Banknote size={10} />}
               <span className="shrink-0">{transaction.method}</span>
               {transaction.note && (
                 <>
                   <span>•</span>
                   <span className="truncate max-w-[120px]">{transaction.note}</span>
                 </>
               )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 pl-2">
        <div className={`text-right font-bold whitespace-nowrap ${isExpense ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
          {isExpense ? '-' : '+'}₹{transaction.amount.toFixed(2)}
        </div>
        <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
      </div>
    </div>
  );
};
