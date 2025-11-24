
import React, { useMemo, useState } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';
import { Transaction, TransactionType, PaymentMethod } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { ChevronLeft, ChevronRight, PieChart as PieIcon, BarChart3, TrendingUp, CreditCard, Wallet } from 'lucide-react';

interface Props {
  transactions: Transaction[];
}

type ChartType = 'PIE' | 'BAR' | 'LINE';

export const Analytics: React.FC<Props> = ({ transactions }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [chartType, setChartType] = useState<ChartType>('BAR');

  // Month Navigation
  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Filter Data for Selected Month
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentDate.getMonth() && 
             tDate.getFullYear() === currentDate.getFullYear();
    });
  }, [transactions, currentDate]);

  // Calculate Summary Stats
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let cashFlow = 0;
    let cardFlow = 0;

    monthlyTransactions.forEach(t => {
      if (t.type === TransactionType.INCOME) {
        income += t.amount;
        if (t.method === PaymentMethod.CASH) cashFlow += t.amount;
        else cardFlow += t.amount;
      } else {
        expense += t.amount;
        if (t.method === PaymentMethod.CASH) cashFlow -= t.amount;
        else cardFlow -= t.amount;
      }
    });

    return { income, expense, total: income - expense, cashFlow, cardFlow };
  }, [monthlyTransactions]);

  // Data for Pie Chart (Expense Breakdown)
  const pieData = useMemo(() => {
    const expenses = monthlyTransactions.filter(t => t.type === TransactionType.EXPENSE);
    const categoryTotals: Record<string, number> = {};
    
    expenses.forEach(t => {
      if (!categoryTotals[t.category]) categoryTotals[t.category] = 0;
      categoryTotals[t.category] += t.amount;
    });

    return Object.keys(categoryTotals).map(cat => ({
      name: cat,
      value: categoryTotals[cat]
    })).sort((a, b) => b.value - a.value);
  }, [monthlyTransactions]);

  // Data for Bar Chart (Daily Income vs Expense)
  const barData = useMemo(() => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const data = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      income: 0,
      expense: 0
    }));

    monthlyTransactions.forEach(t => {
      const day = new Date(t.date).getDate();
      if (t.type === TransactionType.INCOME) {
        data[day - 1].income += t.amount;
      } else {
        data[day - 1].expense += t.amount;
      }
    });

    return data;
  }, [monthlyTransactions, currentDate]);

  // Data for Line Chart (Spending Trend)
  const lineData = useMemo(() => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    let cumulativeExpense = 0;
    const data = [];

    for (let i = 1; i <= daysInMonth; i++) {
        // Find transactions for this day
        const dayExpense = monthlyTransactions
            .filter(t => new Date(t.date).getDate() === i && t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + t.amount, 0);
        
        cumulativeExpense += dayExpense;
        // Only push data points up to today if looking at current month
        const isFuture = currentDate.getMonth() === new Date().getMonth() && 
                         currentDate.getFullYear() === new Date().getFullYear() && 
                         i > new Date().getDate();
        
        if (!isFuture) {
            data.push({ day: i, expense: cumulativeExpense });
        }
    }
    return data;
  }, [monthlyTransactions, currentDate]);

  return (
    <div className="pt-6 px-4 h-full overflow-y-auto animate-fade-in bg-gray-50 dark:bg-gray-900 pb-24 transition-colors">
      
      {/* Date Navigation */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={handlePrevMonth} className="p-2 text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white w-40 text-center">{monthLabel}</h2>
        <button onClick={handleNextMonth} className="p-2 text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Top Stats Summary */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Expense</p>
          <p className="text-red-500 font-bold text-sm sm:text-base mt-1">₹{stats.expense.toFixed(0)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Income</p>
          <p className="text-green-500 font-bold text-sm sm:text-base mt-1">₹{stats.income.toFixed(0)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total</p>
          <p className={`font-bold text-sm sm:text-base mt-1 ${stats.total >= 0 ? 'text-gray-800 dark:text-gray-100' : 'text-red-500'}`}>
             {stats.total >= 0 ? '+' : ''}₹{stats.total.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Visualization Section */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm mb-6 border border-gray-100 dark:border-gray-700 transition-colors">
         <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-800 dark:text-white text-sm">Analysis</h3>
             <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                 <button onClick={() => setChartType('BAR')} className={`p-1.5 rounded-md transition-all ${chartType === 'BAR' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-400'}`}><BarChart3 size={16}/></button>
                 <button onClick={() => setChartType('PIE')} className={`p-1.5 rounded-md transition-all ${chartType === 'PIE' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-400'}`}><PieIcon size={16}/></button>
                 <button onClick={() => setChartType('LINE')} className={`p-1.5 rounded-md transition-all ${chartType === 'LINE' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-400'}`}><TrendingUp size={16}/></button>
             </div>
         </div>

         {/* Chart Container */}
         <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
               {chartType === 'PIE' ? (
                   pieData.length > 0 ? (
                    <PieChart>
                        <Pie 
                          data={pieData} 
                          innerRadius={50} 
                          outerRadius={75} 
                          paddingAngle={4} 
                          dataKey="value"
                        >
                        {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#ccc'} />
                        ))}
                        </Pie>
                        <RechartsTooltip formatter={(value: number) => `₹${value.toFixed(0)}`} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Legend 
                          verticalAlign="bottom" 
                          height={80} 
                          iconType="circle" 
                          wrapperStyle={{ fontSize: '11px', overflow: 'hidden', bottom: 0 }} 
                        />
                    </PieChart>
                   ) :  <div className="flex items-center justify-center h-full w-full text-gray-400 text-sm">No expenses yet </div>
               ) : chartType === 'BAR' ? (
                   <BarChart data={barData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.1} />
                       <XAxis dataKey="day" tick={{fontSize: 10, fill: '#9CA3AF'}} tickLine={false} axisLine={false} />
                       <YAxis tick={{fontSize: 10, fill: '#9CA3AF'}} tickLine={false} axisLine={false} />
                       <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} cursor={{fill: 'transparent'}} />
                       <Bar dataKey="income" fill="#4ade80" radius={[4, 4, 0, 0]} stackId="a" />
                       <Bar dataKey="expense" fill="#f87171" radius={[4, 4, 0, 0]} stackId="a" />
                   </BarChart>
               ) : (
                   <LineChart data={lineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.1} />
                        <XAxis dataKey="day" tick={{fontSize: 10, fill: '#9CA3AF'}} tickLine={false} axisLine={false} />
                        <YAxis tick={{fontSize: 10, fill: '#9CA3AF'}} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Line type="monotone" dataKey="expense" stroke="#6366f1" strokeWidth={3} dot={{r: 0}} activeDot={{r: 6}} />
                   </LineChart>
               )}
            </ResponsiveContainer>
         </div>
      </div>

      {/* Account Analysis */}
      <h3 className="font-bold text-gray-800 dark:text-white mb-4 px-1">Account Analysis</h3>
      <div className="grid grid-cols-1 gap-3 mb-4">
          {/* Card Account */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
             <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-xl flex items-center justify-center">
                    <CreditCard size={24} />
                 </div>
                 <div>
                    <p className="font-bold text-gray-800 dark:text-gray-100">Card</p>
                    <p className="text-xs text-gray-400">Flow this month</p>
                 </div>
             </div>
             <div className={`font-bold ${stats.cardFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.cardFlow >= 0 ? '+' : ''}₹{stats.cardFlow.toFixed(2)}
             </div>
          </div>

          {/* Cash Account */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
             <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-xl flex items-center justify-center">
                    <Wallet size={24} />
                 </div>
                 <div>
                    <p className="font-bold text-gray-800 dark:text-gray-100">Cash</p>
                    <p className="text-xs text-gray-400">Flow this month</p>
                 </div>
             </div>
             <div className={`font-bold ${stats.cashFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.cashFlow >= 0 ? '+' : ''}₹{stats.cashFlow.toFixed(2)}
             </div>
          </div>
      </div>

    </div>
  );
};
