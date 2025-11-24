
import { Transaction, BudgetLimit, CustomCategory, AppTheme } from '../types';

const DB_NAME = 'UniBudgetDB';
const DB_VERSION = 2; 
const STORES = {
  TRANSACTIONS: 'transactions',
  LIMITS: 'limits',
  CUSTOM_CATS: 'customCategories',
  SETTINGS: 'settings'
};

// Keep track of the active connection to close it properly
let _activeDB: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (_activeDB) return Promise.resolve(_activeDB);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.LIMITS)) {
        db.createObjectStore(STORES.LIMITS, { keyPath: 'category' });
      }
      if (!db.objectStoreNames.contains(STORES.CUSTOM_CATS)) {
        db.createObjectStore(STORES.CUSTOM_CATS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      _activeDB = (event.target as IDBOpenDBRequest).result;
      
      // Handle sudden closures
      _activeDB.onclose = () => {
        _activeDB = null;
      };

      resolve(_activeDB);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

const closeDB = () => {
  if (_activeDB) {
    _activeDB.close();
    _activeDB = null;
  }
};
// Generic Helpers
const getAll = async <T>(storeName: string): Promise<T[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const putItem = async <T>(storeName: string, item: T): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const deleteItem = async (storeName: string, key: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Exported API
export const dbService = {
  // Transactions
  getTransactions: () => getAll<Transaction>(STORES.TRANSACTIONS),
  saveTransaction: (t: Transaction) => putItem(STORES.TRANSACTIONS, t),
  deleteTransaction: (id: string) => deleteItem(STORES.TRANSACTIONS, id),
  
  // Limits
  getLimits: () => getAll<BudgetLimit>(STORES.LIMITS),
  saveLimit: (l: BudgetLimit) => putItem(STORES.LIMITS, l),
  deleteLimit: (category: string) => deleteItem(STORES.LIMITS, category),

  // Custom Categories
  getCustomCategories: () => getAll<CustomCategory>(STORES.CUSTOM_CATS),
  saveCustomCategory: (c: CustomCategory) => putItem(STORES.CUSTOM_CATS, c),

  // Settings (Theme)
  getTheme: async (): Promise<AppTheme> => {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORES.SETTINGS, 'readonly');
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.get('theme');
      request.onsuccess = () => resolve(request.result?.value || 'system');
      request.onerror = () => resolve('system');
    });
  },
  saveTheme: (theme: AppTheme) => putItem(STORES.SETTINGS, { key: 'theme', value: theme }),

  // System - Clear All Data
  // Robust method: Clear all object stores individually instead of deleting the DB.
  // This avoids "blocked" events and works consistently across browsers.
  clearAllData: async () => {
    const db = await openDB();
    const storeNames = [STORES.TRANSACTIONS, STORES.LIMITS, STORES.CUSTOM_CATS, STORES.SETTINGS];
    
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeNames, 'readwrite');
      
      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = (event) => {
        console.error("Error clearing data:", transaction.error);
        reject(transaction.error);
      };

      // Clear each store
      storeNames.forEach(name => {
         transaction.objectStore(name).clear();
      });
    });
  }
};
