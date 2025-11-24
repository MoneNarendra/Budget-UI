
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, TransactionType, PaymentMethod, Category, FinancialSummary, CustomCategory } from '../types';
import { X, Check, Trash2, AlertCircle, Plus, Calendar, Clock } from 'lucide-react';
import { CATEGORY_ICONS, AVAILABLE_CUSTOM_ICONS, CATEGORY_COLORS } from '../constants';

interface Props {
  onSave: (t: Omit<Transaction, 'id'>, id?: string) => void;
  onDelete?: (id: string) => void;
  onCancel: () => void;
  existingTransaction?: Transaction | null;
  summary: FinancialSummary;
  customCategories: CustomCategory[];
  onAddCustomCategory: (cat: CustomCategory) => void;
}

export const AddTransaction: React.FC<Props> = ({ 
  onSave, 
  onDelete, 
  onCancel, 
  existingTransaction, 
  summary,
  customCategories,
  onAddCustomCategory
}) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [category, setCategory] = useState<string>('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(''); // ISO-like string for input (YYYY-MM-DDThh:mm)
  
  const [error, setError] = useState<string | null>(null);

  // Custom Category State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Star');

  // Initialize form
  useEffect(() => {
    if (existingTransaction) {
      setAmount(existingTransaction.amount.toString());
      setType(existingTransaction.type);
      setMethod(existingTransaction.method);
      setCategory(existingTransaction.category);
      setNote(existingTransaction.note);
      
      // Convert UTC ISO string to local datetime-local format
      const d = new Date(existingTransaction.date);
      const offset = d.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
      setDate(localISOTime);
    } else {
      // Default to current time
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
      setDate(localISOTime);
    }
  }, [existingTransaction]);

  const validate = (): boolean => {
    setError(null);
    const numAmount = parseFloat(amount);

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return false;
    }

    if (!category) {
      setError("Please select a category.");
      return false;
    }

    if (!date) {
      setError("Please select a date and time.");
      return false;
    }

    // Balance check logic
    if (type === TransactionType.EXPENSE) {
      let availableBalance = method === PaymentMethod.CASH ? summary.cashBalance : summary.cardBalance;
      
      // If editing, refund original amount for check
      if (existingTransaction && existingTransaction.type === TransactionType.EXPENSE && existingTransaction.method === method) {
        availableBalance += existingTransaction.amount;
      }

      if (numAmount > availableBalance) {
        setError(`Insufficient funds in ${method}. Available: ₹${availableBalance.toFixed(2)}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    // Convert local time back to ISO String
    const finalDate = new Date(date).toISOString();

    onSave({
      amount: parseFloat(amount),
      type,
      method,
      category,
      note,
      date: finalDate
    }, existingTransaction?.id);
  };

  const handleDelete = () => {
    if (existingTransaction && onDelete) {
        onDelete(existingTransaction.id);
    }
  };

  const handleSaveCustomCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: CustomCategory = {
      id: uuidv4(),
      name: newCatName.trim(),
      iconName: newCatIcon,
      color: '#A0AEC0' // Default greyish, could be randomized
    };
    onAddCustomCategory(newCat);
    setCategory(newCat.name); // Auto select
    setIsAddingCategory(false);
    setNewCatName('');
  };

  const defaultCategories = Object.values(Category);
  
  // Combine default and custom categories
  const allCategories = [
    ...defaultCategories.map(c => ({ name: c, icon: CATEGORY_ICONS[c] || CATEGORY_ICONS['Other'], isCustom: false })),
    ...customCategories.map(c => ({ name: c.name, icon: AVAILABLE_CUSTOM_ICONS[c.iconName] || AVAILABLE_CUSTOM_ICONS['Other'], isCustom: true }))
  ];

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 z-50 overflow-y-auto pb-10 transition-colors">
      <style>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
        /* Custom date picker dark mode support */
        input[type="datetime-local"] {
            color-scheme: light; 
        }
        .dark input[type="datetime-local"] {
            color-scheme: dark;
        }
      `}</style>

      {/* Add Custom Category Modal */}
      {isAddingCategory && (
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
                <button onClick={() => setIsAddingCategory(false)} className="flex-1 py-3 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">Cancel</button>
                <button onClick={handleSaveCustomCategory} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-colors">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 flex justify-between items-center mb-6 z-10 transition-colors">
        <button onClick={onCancel} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{existingTransaction ? 'Edit Transaction' : 'New Transaction'}</h2>
        <div className="w-9" /> 
      </div>

      <form onSubmit={handleSubmit} className="px-6 space-y-6 animate-slide-up">
        
        {/* Type Switcher */}
        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <button
            type="button"
            className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${type === TransactionType.EXPENSE ? 'bg-white dark:bg-gray-700 shadow-sm text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}
            onClick={() => setType(TransactionType.EXPENSE)}
          >
            Expense
          </button>
          <button
            type="button"
            className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${type === TransactionType.INCOME ? 'bg-white dark:bg-gray-700 shadow-sm text-green-500 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}
            onClick={() => setType(TransactionType.INCOME)}
          >
            Income
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400 dark:text-gray-500">₹</span>
            <input 
              type="number" 
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              className="w-full bg-white dark:bg-gray-800 border-none outline-none text-4xl font-bold text-gray-800 dark:text-white pl-12 py-4 focus:ring-0 focus:outline-none placeholder-gray-200 dark:placeholder-gray-700 rounded-xl transition-colors"
              placeholder="0.00"
              autoFocus={!existingTransaction}
            />
          </div>
        </div>

        {/* Date Input */}
        <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Date & Time</label>
            <div className="relative">
                <input 
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 focus:outline-none focus:border-indigo-500 text-gray-800 dark:text-white font-medium"
                />
            </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl flex items-center gap-2 text-sm border border-red-100 dark:border-red-800/50">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Method Selector */}
        <div>
           <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Payment Method</label>
           <div className="grid grid-cols-2 gap-4">
             <button
                type="button"
                onClick={() => setMethod(PaymentMethod.CASH)}
                className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${method === PaymentMethod.CASH ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
             >
                Cash
             </button>
             <button
                type="button"
                onClick={() => setMethod(PaymentMethod.CARD)}
                className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${method === PaymentMethod.CARD ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
             >
                Card
             </button>
           </div>
        </div>

        {/* Categories Grid */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Category</label>
          <div className="grid grid-cols-3 gap-3">
            {allCategories.map(cat => {
               const Icon = cat.icon;
               const isSelected = category === cat.name;
               return (
                 <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800'}`}
                 >
                    <Icon size={20} className="mb-2" />
                    <span className="text-xs font-medium truncate w-full text-center">{cat.name}</span>
                 </button>
               )
            })}
            {/* Add Custom Category Button */}
            <button
               type="button"
               onClick={() => setIsAddingCategory(true)}
               className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 border border-dashed border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
               <Plus size={20} className="mb-2" />
               <span className="text-xs font-medium">Add New</span>
            </button>
          </div>
        </div>

        {/* Note */}
        <div>
           <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Note (Optional)</label>
           <input 
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 focus:outline-none focus:border-indigo-500 text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 transition-colors"
              placeholder="What was this for?"
           />
        </div>

        <div className="flex gap-3 pt-4 pb-8">
           {existingTransaction && (
              <button 
                type="button"
                onClick={handleDelete}
                className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 font-bold py-4 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-95 transition-all flex items-center justify-center gap-2 border border-transparent hover:border-red-200 dark:hover:border-red-800"
              >
                <Trash2 size={20} />
                Delete
              </button>
           )}
            <button 
              type="submit"
              className={`flex-[2] bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 ${!existingTransaction ? 'w-full' : ''}`}
            >
              <Check size={20} />
              {existingTransaction ? 'Update' : 'Save'}
            </button>
        </div>

      </form>
    </div>
  );
};
