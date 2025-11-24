
import React, { useState } from 'react';
import { Transaction } from '../types';
import { getFinancialAdvice } from '../services/geminiService';
import { Bot, Sparkles, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  transactions: Transaction[];
}

export const Advisor: React.FC<Props> = ({ transactions }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGetAdvice = async () => {
    if (transactions.length === 0) {
      setAdvice("Please add some transactions first so I can analyze your spending!");
      return;
    }
    setLoading(true);
    const result = await getFinancialAdvice(transactions);
    setAdvice(result);
    setLoading(false);
  };

  return (
    <div className="pt-8 pb-24 px-6 min-h-screen animate-fade-in flex flex-col items-center bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg mb-4">
        <Bot color="white" size={32} />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">AI Financial Advisor</h2>
      <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-8 max-w-xs">
        Powered by Gemini 2.5 Flash. Get personalized tips based on your student lifestyle.
      </p>

      {!advice && !loading && (
        <button
          onClick={handleGetAdvice}
          className="bg-white dark:bg-gray-800 border-2 border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold py-4 px-8 rounded-2xl shadow-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 active:scale-95 transition-all flex items-center gap-2"
        >
          <Sparkles size={20} />
          Analyze My Spending
        </button>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 font-medium animate-pulse">Crunching the numbers...</p>
        </div>
      )}

      {advice && !loading && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border border-purple-100 dark:border-purple-900 w-full animate-slide-up transition-colors">
           <div className="prose prose-sm prose-indigo dark:prose-invert text-gray-700 dark:text-gray-300">
             <ReactMarkdown>{advice}</ReactMarkdown>
           </div>
           <button 
             onClick={() => setAdvice(null)}
             className="mt-6 w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
           >
             Close
           </button>
        </div>
      )}

      {!process.env.API_KEY && (
          <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-start gap-2 max-w-sm border border-red-100 dark:border-red-900/50">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>API Key missing. The AI features won't work without a valid environment variable.</p>
          </div>
      )}
    </div>
  );
};
