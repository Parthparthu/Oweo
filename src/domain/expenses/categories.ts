import { TransactionCategory } from '@/types/expense'

export interface CategoryMetadata {
  id: TransactionCategory
  label: string
  icon: string
  color: string // Tailwind color class or hex
  keywords: string[]
}

export const CATEGORY_DEFINITIONS: Record<TransactionCategory, CategoryMetadata> = {
  Food: {
    id: 'Food',
    label: 'Food & Dining',
    icon: 'Utensils',
    color: '#f97316', // Orange
    keywords: [
      'food', 'dinner', 'lunch', 'breakfast', 'tea', 'chai', 'coffee', 'cafe', 'snack',
      'snacks', 'zomato', 'swiggy', 'mcdonalds', 'burger', 'pizza', 'biryani', 'meal',
      'canteen', 'dhaba', 'restaurant', 'ice cream', 'dessert', 'boba', 'maggi', 'shawarma'
    ],
  },
  Travel: {
    id: 'Travel',
    label: 'Travel & Transport',
    icon: 'Car',
    color: '#0284c7', // Sky Blue
    keywords: [
      'travel', 'uber', 'ola', 'auto', 'metro', 'bus', 'train', 'flight', 'petrol',
      'diesel', 'fuel', 'cab', 'rapido', 'ticket', 'fare', 'toll', 'parking', 'rickshaw', 'irctc'
    ],
  },
  Groceries: {
    id: 'Groceries',
    label: 'Groceries',
    icon: 'ShoppingCart',
    color: '#16a34a', // Green
    keywords: [
      'grocery', 'groceries', 'blinkit', 'zepto', 'instamart', 'milk', 'vegetables', 'veggies',
      'fruits', 'market', 'supermarket', 'bread', 'eggs', 'rice', 'dal', 'oil', 'provisions'
    ],
  },
  Rent: {
    id: 'Rent',
    label: 'Hostel & Rent',
    icon: 'Home',
    color: '#9333ea', // Purple
    keywords: ['rent', 'hostel', 'pg', 'flat', 'deposit', 'maintenance', 'room', 'brokerage'],
  },
  Shopping: {
    id: 'Shopping',
    label: 'Shopping',
    icon: 'ShoppingBag',
    color: '#ec4899', // Pink
    keywords: [
      'shopping', 'clothes', 'shoes', 'myntra', 'amazon', 'flipkart', 'zara', 'h&m',
      'dress', 'shirt', 'pants', 'jacket', 't-shirt', 'sneakers', 'mall', 'order'
    ],
  },
  Entertainment: {
    id: 'Entertainment',
    label: 'Entertainment',
    icon: 'Film',
    color: '#e11d48', // Rose
    keywords: ['movie', 'cinema', 'bookmyshow', 'pvr', 'inox', 'theatre', 'concert', 'club', 'party', 'game', 'gaming', 'bowling'],
  },
  Subscriptions: {
    id: 'Subscriptions',
    label: 'Subscriptions',
    icon: 'Tv',
    color: '#6366f1', // Indigo
    keywords: ['subscription', 'netflix', 'spotify', 'prime', 'youtube', 'hotstar', 'icloud', 'disney', 'chatgpt', 'gym'],
  },
  Bills: {
    id: 'Bills',
    label: 'Bills & Utilities',
    icon: 'Zap',
    color: '#eab308', // Yellow
    keywords: ['bill', 'electricity', 'wifi', 'broadband', 'water', 'recharge', 'jio', 'airtel', 'vi', 'gas', 'cylinder'],
  },
  Education: {
    id: 'Education',
    label: 'Education & Books',
    icon: 'GraduationCap',
    color: '#0d9488', // Teal
    keywords: ['education', 'book', 'books', 'stationary', 'xerox', 'print', 'course', 'udemy', 'coursera', 'exam', 'fees', 'tuition'],
  },
  Health: {
    id: 'Health',
    label: 'Health & Medical',
    icon: 'HeartPulse',
    color: '#ef4444', // Red
    keywords: ['health', 'medicine', 'pharmacy', 'doctor', 'clinic', 'hospital', '1mg', 'apollo', 'tablet', 'bandage', 'test'],
  },
  'Personal Care': {
    id: 'Personal Care',
    label: 'Personal Care',
    icon: 'Sparkles',
    color: '#14b8a6', // Teal light
    keywords: ['salon', 'haircut', 'parlour', 'grooming', 'skincare', 'spa', 'cosmetics', 'perfume', 'shampoo'],
  },
  Gifts: {
    id: 'Gifts',
    label: 'Gifts & Donations',
    icon: 'Gift',
    color: '#f43f5e', // Rose
    keywords: ['gift', 'present', 'birthday', 'anniversary', 'donation', 'treat', 'treats'],
  },
  Settlement: {
    id: 'Settlement',
    label: 'Group Settlements',
    icon: 'Handshake',
    color: '#0ea5e9', // Sky
    keywords: ['settle', 'settlement', 'paid back', 'split', 'owe', 'reimbursement'],
  },
  Other: {
    id: 'Other',
    label: 'Other',
    icon: 'MoreHorizontal',
    color: '#64748b', // Slate
    keywords: ['other', 'misc', 'miscellaneous', 'cash', 'transfer'],
  },
  // Income specific fallbacks (if someone uses CATEGORY_DEFINITIONS directly)
  'Pocket Money': { id: 'Pocket Money', label: 'Pocket Money', icon: 'Wallet', color: '#10b981', keywords: [] },
  'Salary': { id: 'Salary', label: 'Salary', icon: 'Briefcase', color: '#059669', keywords: [] },
  'Cashback': { id: 'Cashback', label: 'Cashback', icon: 'Gift', color: '#34d399', keywords: [] },
  'Refund': { id: 'Refund', label: 'Refund', icon: 'RotateCcw', color: '#f59e0b', keywords: [] },
  'Investment': { id: 'Investment', label: 'Investment', icon: 'TrendingUp', color: '#3b82f6', keywords: [] },
}

export const INCOME_CATEGORY_DEFINITIONS: Record<string, CategoryMetadata> = {
  'Pocket Money': CATEGORY_DEFINITIONS['Pocket Money'],
  'Salary': CATEGORY_DEFINITIONS['Salary'],
  'Cashback': CATEGORY_DEFINITIONS['Cashback'],
  'Refund': CATEGORY_DEFINITIONS['Refund'],
  'Investment': CATEGORY_DEFINITIONS['Investment'],
  'Other': CATEGORY_DEFINITIONS['Other'],
}

export const ALL_CATEGORIES = Object.keys(CATEGORY_DEFINITIONS) as TransactionCategory[]
export const ALL_EXPENSE_CATEGORIES = ALL_CATEGORIES.filter(c => !(c in INCOME_CATEGORY_DEFINITIONS) || c === 'Other')
export const ALL_INCOME_CATEGORIES = Object.keys(INCOME_CATEGORY_DEFINITIONS) as TransactionCategory[]
