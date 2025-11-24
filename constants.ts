
import { Category } from './types';
import { 
  Utensils, 
  Bus, 
  BookOpen, 
  PartyPopper, 
  Receipt, 
  CircleDollarSign, 
  GraduationCap, 
  Wallet, 
  MoreHorizontal,
  Star,
  Heart,
  Music,
  ShoppingBag,
  Briefcase,
  Gift,
  Coffee,
  Smartphone,
  Home
} from 'lucide-react';

export const CATEGORY_COLORS: Record<string, string> = {
  [Category.FOOD]: '#FF6B6B',      // Pastel Red
  [Category.TRANSPORT]: '#4ECDC4', // Teal
  [Category.BOOKS]: '#45B7D1',     // Blue
  [Category.ENTERTAINMENT]: '#96CEB4', // Greenish
  [Category.BILLS]: '#FFEEAD',     // Yellow
  [Category.OTHER]: '#D4D4D4',     // Grey
  [Category.FEES]: '#FF9F43',      // Orange
  [Category.SCHOLARSHIP]: '#10B981', // Emerald
  [Category.ALLOWANCE]: '#3B82F6',   // Blue
};

// Base Icon Map
export const CATEGORY_ICONS: Record<string, any> = {
  [Category.FOOD]: Utensils,
  [Category.TRANSPORT]: Bus,
  [Category.BOOKS]: BookOpen,
  [Category.ENTERTAINMENT]: PartyPopper,
  [Category.BILLS]: Receipt,
  [Category.OTHER]: MoreHorizontal,
  [Category.FEES]: CircleDollarSign,
  [Category.SCHOLARSHIP]: GraduationCap,
  [Category.ALLOWANCE]: Wallet,
};

// Available Icons for Custom Categories
export const AVAILABLE_CUSTOM_ICONS: Record<string, any> = {
  'Star': Star,
  'Heart': Heart,
  'Music': Music,
  'Shopping': ShoppingBag,
  'Work': Briefcase,
  'Gift': Gift,
  'Coffee': Coffee,
  'Phone': Smartphone,
  'Home': Home,
  'Other': MoreHorizontal
};

export const APP_NAME = "UniBudget";
