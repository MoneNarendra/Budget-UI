
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, BudgetLimit, Category, TransactionType, CustomCategory } from '../types';
import { CATEGORY_ICONS, AVAILABLE_CUSTOM_ICONS, CATEGORY_COLORS } from '../constants';
import { Plus, Target, X, Trash2, Check } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  limits: BudgetLimit[];
  onUpdateLimit: (limit: BudgetLimit) => void;
  onRemoveLimit: (category: string) => void;
  customCategories?: CustomCategory[];
  onAddCustomCategory: (cat: CustomCategory) => void;
}

export const Limits: React.FC<Props> = ({ transactions, limits, onUpdateLimit, onRemoveLimit, customCategories = [], onAddCustomCategory }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [limitAmount, setLimitAmount] = useState<string>('');

  // Custom Category State inside Limits
  const [isAddingCustomCat, setIsAddingCustomCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Star');

  // Calculate spending per category (Current Month)
  const currentMonthSpending = transactions
    .filter(t => {
       const now = new Date();
       const tDate = new Date(t.date);
       return t.type === TransactionType.EXPENSE && 
              tDate.getMonth() === now.getMonth() && 
              tDate.getFullYear() === now.getFullYear();
    })
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !limitAmount) return;
    onUpdateLimit({ category: selectedCategory, limit: parseFloat(limitAmount) });
    setIsAdding(false);
    setSelectedCategory('');
    setLimitAmount('');
  };

  const handleSaveCustomCategory = () => {
      if (!newCatName.trim()) return;
      const newCat: CustomCategory = {
        id: uuidv4(),
        name: newCatName.trim(),
        iconName: newCatIcon,
        color: '#A0AEC0' // Default greyish
      };
      onAddCustomCategory(newCat);
      setSelectedCategory(newCat.name); // Auto select
      setIsAddingCustomCat(false);
      setNewCatName('');
  };

  const defaultCategories = Object.values(Category);
  
  // Combine all categories
  const allCategoryNames = [
    ...defaultCategories,
    ...customCategories.map(c => c.name)
  ];
  
  // Filter out categories that already have limits if adding new, but keep selected one visible if set
  const availableCategories = allCategoryNames.filter(c => !limits.find(l => l.category === c) || c === selectedCategory);

  const getIcon = (catName: string) => {
    const custom = customCategories.find(c => c.name === catName);
    if (custom) {
      return AVAILABLE_CUSTOM_ICONS[custom.iconName] || AVAILABLE_CUSTOM_ICONS['Other'];
    }
    return CATEGORY_ICONS[catName] || CATEGORY_ICONS['Other'];
  };

  return (
    <div className="pt-8 pb-24 px-6 h-full overflow-y-auto animate-fade-in relative bg-gray-50 dark:bg-gray-900 transition-colors">
       <style>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>

       {/* Add Custom Category Modal (Same as AddTransaction) */}
      {isAddingCustomCat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Add Custom Category</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1">Name</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-indigo-500 outline-none text-gray-800 dark:text-white"
                  placeholder="e.g. Netflix, Gym"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-2">Icon</label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.keys(AVAILABLE_CUSTOM_ICONS).map(iconKey => {
                    const Icon = AVAILABLE_CUSTOM_ICONS[iconKey];
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setNewCatIcon(iconKey)}
                        className={`p-2 rounded-lg flex items-center justify-center transition-colors ${newCatIcon === iconKey ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}
                      >
                        <Icon size={18} />
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setIsAddingCustomCat(false)} className="flex-1 py-3 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">Cancel</button>
                <button onClick={handleSaveCustomCategory} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-colors">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Monthly Limits</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
        >
          <Plus size={24} />
        </button>
      </div>

      {limits.length === 0 && !isAdding && (
         <div className="text-center py-10 text-gray-400 dark:text-gray-600">
           <Target size={48} className="mx-auto mb-2 opacity-20" />
           <p>Set budget limits to track your spending.</p>
         </div>
      )}

      {/* Adding Form */}
      {isAdding && (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-lg border border-indigo-100 dark:border-indigo-900/50 mb-6 animate-slide-down transition-colors">
           <div className="flex justify-between mb-4">
             <h3 className="font-bold text-gray-800 dark:text-white">Set New Limit</h3>
             <button onClick={() => setIsAdding(false)}><X size={18} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"/></button>
           </div>
           <form onSubmit={handleSave} className="space-y-5">
             <div>
               <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase block mb-2">Select Category</label>
               
                 <div className="grid grid-cols-3 gap-2">
                   {availableCategories.map(c => {
                      const Icon = getIcon(c);
                      const isSelected = selectedCategory === c;
                      return (
                        <button
                           key={c}
                           type="button"
                           onClick={() => setSelectedCategory(c)}
                           className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all border ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-600 hover:border-indigo-200 dark:hover:border-indigo-700'}`}
                        >
                           <Icon size={16} className="mb-1" />
                           <span className="text-[10px] font-medium truncate w-full">{c}</span>
                        </button>
                      );
                   })}
                   {/* Add Custom Category Button */}
                    <button
                        type="button"
                        onClick={() => setIsAddingCustomCat(true)}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 border border-dashed border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                        <Plus size={16} className="mb-1" />
                        <span className="text-[10px] font-medium">Add New</span>
                    </button>
                 </div>
               
             </div>
             
             <div>
               <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase block mb-1">Monthly Limit (₹)</label>
               <div className="relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-bold">₹</span>
                 <input 
                   type="number"
                   value={limitAmount}
                   onChange={(e) => setLimitAmount(e.target.value)}
                   className="w-full pl-8 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none font-bold text-gray-800 dark:text-white transition-colors"
                   placeholder="0.00"
                 />
               </div>
             </div>

             <button 
               type="submit" 
               disabled={!selectedCategory || !limitAmount}
               className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-colors"
             >
               <Check size={18} />
               Save Limit
             </button>
           </form>
        </div>
      )}

      {/* List Limits */}
      <div className="space-y-4">
        {limits.map(l => {
          const spent = currentMonthSpending[l.category] || 0;
          const percentage = Math.min((spent / l.limit) * 100, 100);
          const isOver = spent > l.limit;
          const remaining = l.limit - spent;
          const Icon = getIcon(l.category);

          return (
            <div key={l.category} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
              <div className="flex justify-between items-start mb-3">
                 <div className="flex items-center gap-3">
                   <div 
                     className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm"
                     style={{ backgroundColor: CATEGORY_COLORS[l.category] || '#ccc' }}
                   >
                     <Icon size={18} />
                   </div>
                   <div>
                     <h4 className="font-bold text-gray-800 dark:text-gray-100">{l.category}</h4>
                     <p className="text-xs text-gray-400">
                       {remaining < 0 ? `Over by ₹${Math.abs(remaining).toFixed(0)}` : `₹${remaining.toFixed(0)} left`}
                     </p>
                   </div>
                 </div>
                 <button onClick={() => onRemoveLimit(l.category)} className="text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 transition-colors">
                   <Trash2 size={16} />
                 </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mb-1 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-indigo-500'}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className={isOver ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'}>₹{spent.toFixed(0)}</span>
                <span className="text-gray-400 dark:text-gray-500">Limit: ₹{l.limit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
