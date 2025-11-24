
import React, { useState, useMemo, useRef } from 'react';
import { Transaction, FinancialSummary, CustomCategory, AppTheme } from '../types';
import { TransactionCard } from '../components/TransactionCard';
import { Wallet, CreditCard, TrendingUp, TrendingDown, Menu, FileSpreadsheet, X, ChevronLeft, ChevronRight, Calendar, ArrowRight, Download, Trash2, Moon, Sun, Monitor } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  summary: FinancialSummary;
  onAddClick: () => void;
  onEditClick: (t: Transaction) => void;
  onImport: (file: File) => void;
  onExport: () => void;
  onClearData: () => void;
  onViewAll: () => void;
  customCategories?: CustomCategory[];
  currentTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
}

export const Dashboard: React.FC<Props> = ({ 
  transactions, 
  summary, 
  onAddClick, 
  onEditClick, 
  onImport, 
  onExport: propsOnExport, 
  onClearData,
  onViewAll, 
  customCategories = [],
  currentTheme,
  onThemeChange
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Date Navigation Logic
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    return new Date(d.setDate(diff));
  };

  const getEndOfWeek = (date: Date) => {
    const start = getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
  };

  const startOfWeek = getStartOfWeek(currentDate);
  const endOfWeek = getEndOfWeek(currentDate);

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // Filter transactions for current week
  const weeklyTransactions = useMemo(() => {
    const start = new Date(startOfWeek);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endOfWeek);
    end.setHours(23, 59, 59, 999);

    return transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return tDate >= start && tDate <= end;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, startOfWeek, endOfWeek]);

  // Format Date Range Display
  const dateRangeString = `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  const isCurrentWeek = new Date().getTime() >= startOfWeek.getTime() && new Date().getTime() <= endOfWeek.getTime();

  const handleExport = () => {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Method', 'Note'];
    const csvRows = [
      headers.join(','),
      ...transactions.map(t => {
        // Format date as YYYY-MM-DD HH:MM
        // We use a custom string builder to ensure zero-padding and consistent ordering
        const d = new Date(t.date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        // This format YYYY-MM-DD HH:MM is standard and human readable
        const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}`;
        
        const note = (t.note || '').replace(/"/g, '""');
        // Quote all fields to be safe
        return [`"${formattedDate}"`, `"${t.type}"`, `"${t.category}"`, `${t.amount}`, `"${t.method}"`, `"${note}"`].join(',');
      })
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `uni_budget_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsMenuOpen(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
    setIsMenuOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
    }
    // Reset
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="h-full flex flex-col animate-fade-in relative bg-gray-50 dark:bg-gray-900 transition-colors">
      <input 
        type="file" 
        accept=".csv" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
      />

      {/* Side Drawer Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className="absolute top-0 right-0 h-full w-3/4 max-w-xs bg-white dark:bg-gray-800 shadow-2xl animate-slide-in-right flex flex-col transition-colors">
             <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-indigo-600 dark:bg-indigo-800">
                <span className="font-bold text-white text-lg">UniBudget</span>
                <button onClick={() => setIsMenuOpen(false)} className="text-white/80 hover:text-white transition-colors">
                  <X size={24}/>
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto py-2">
               {/* Appearance Section */}
               <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-700">
                 <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-3">Appearance</h4>
                 <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                    <button 
                      onClick={() => onThemeChange('light')}
                      className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all ${currentTheme === 'light' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-400'}`}
                    >
                      <Sun size={18} />
                    </button>
                    <button 
                      onClick={() => onThemeChange('dark')}
                      className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all ${currentTheme === 'dark' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-400'}`}
                    >
                      <Moon size={18} />
                    </button>
                    <button 
                      onClick={() => onThemeChange('system')}
                      className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all ${currentTheme === 'system' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-400'}`}
                    >
                      <Monitor size={18} />
                    </button>
                 </div>
               </div>

               <div className="px-4 py-4">
                  <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Data Management</h4>
                   <button 
                     onClick={handleExport}
                     className="w-full px-4 py-4 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-700 rounded-xl flex items-center gap-3 transition-colors mb-2"
                   >
                     <FileSpreadsheet size={20} />
                     <span className="font-medium">Export CSV</span>
                   </button>
                   <button 
                     onClick={handleImportClick}
                     className="w-full px-4 py-4 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-700 rounded-xl flex items-center gap-3 transition-colors"
                   >
                     <Download size={20} />
                     <span className="font-medium">Import CSV</span>
                   </button>
               </div>
               
               <div className="px-4 py-2 mt-4 border-t border-gray-100 dark:border-gray-700">
                 <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Danger Zone</h4>
                 <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      onClearData();
                    }}
                    className="w-full px-4 py-4 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex items-center gap-3 transition-colors"
                  >
                    <Trash2 size={20} />
                    <span className="font-medium">Reset All Data</span>
                  </button>
               </div>
             </div>

             <div className="p-6 border-t border-gray-100 dark:border-gray-700 text-center">
               <p className="text-xs text-gray-400">Version 1.0.2</p>
             </div>
          </div>
        </div>
      )}

      {/* Top Section (Fixed) */}
      <div className="flex-shrink-0 relative z-10">
        {/* Top Right Menu Button */}
        <div className="absolute top-6 right-6 z-30">
          <button 
            onClick={() => setIsMenuOpen(true)} 
            className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Header Widget */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-b-[40px] pt-8 pb-10 px-6 shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Wallet size={120} />
          </div>
          
          <div className="relative z-10 mt-8">
            <h2 className="text-indigo-100 text-sm font-medium mb-1">Total Balance</h2>
            <h1 className="text-4xl font-bold mb-6">₹{summary.totalBalance.toFixed(2)}</h1>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
                <div className="flex items-center gap-2 mb-1 text-indigo-100 text-xs">
                  <Wallet size={12} /> Cash
                </div>
                <p className="font-semibold text-lg">₹{summary.cashBalance.toFixed(2)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
                <div className="flex items-center gap-2 mb-1 text-indigo-100 text-xs">
                  <CreditCard size={12} /> Card
                </div>
                <p className="font-semibold text-lg">₹{summary.cardBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions / Stats */}
        <div className="px-6 -mt-6 relative z-20 mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 flex justify-between items-center transition-colors">
            <div className="text-center w-1/2 border-r border-gray-100 dark:border-gray-700">
              <div className="flex justify-center text-green-500 mb-1"><TrendingUp size={20} /></div>
              <p className="text-xs text-gray-400">Income</p>
              <p className="font-bold text-gray-800 dark:text-gray-100">₹{summary.totalIncome.toFixed(2)}</p>
            </div>
            <div className="text-center w-1/2">
              <div className="flex justify-center text-red-500 mb-1"><TrendingDown size={20} /></div>
              <p className="text-xs text-gray-400">Expense</p>
              <p className="font-bold text-gray-800 dark:text-gray-100">₹{summary.totalExpense.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Weekly Navigation */}
        <div className="px-6">
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm mb-4 transition-colors">
             <button onClick={handlePrevWeek} className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg">
               <ChevronLeft size={20} />
             </button>
             <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-medium text-sm">
               <Calendar size={16} className="text-indigo-400" />
               {isCurrentWeek ? "This Week" : dateRangeString}
             </div>
             <button onClick={handleNextWeek} className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg">
               <ChevronRight size={20} />
             </button>
          </div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-800 dark:text-white text-lg">Transactions</h3>
            <button 
              onClick={onViewAll}
              className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-50 dark:hover:bg-gray-800 px-2 py-1 rounded-lg transition-colors"
            >
              View All <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Transaction List */}
      <div className="flex-1 overflow-y-auto px-6 pb-24">
        {weeklyTransactions.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-gray-600">
            <p>No transactions for this week.</p>
          </div>
        ) : (
          weeklyTransactions.map(t => (
            <TransactionCard 
              key={t.id} 
              transaction={t} 
              onClick={onEditClick}
              customCategories={customCategories}
            />
          ))
        )}
      </div>
    </div>
  );
};
