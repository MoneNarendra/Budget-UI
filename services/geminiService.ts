import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  try {
    // Filter last 20 transactions to avoid token limits and keep it relevant
    const recentTransactions = transactions
      .slice(0, 50)
      .map(t => ({
        date: t.date.split('T')[0],
        type: t.type,
        amount: t.amount,
        category: t.category,
        method: t.method
      }));

    const prompt = `
      You are a friendly, cool financial advisor for a university student. 
      The currency is Indian Rupees (₹).
      Analyze the following recent transaction history (JSON format):
      ${JSON.stringify(recentTransactions)}

      1. Give a very brief summary of spending habits.
      2. Identify one area where they are spending too much (if any).
      3. Give one actionable, student-friendly tip to save money based on this data.
      
      Keep the tone encouraging, concise, and formatted with simple Markdown. Use emojis.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate advice at the moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Make sure your API key is set correctly to get smart insights! 🧠";
  }
};