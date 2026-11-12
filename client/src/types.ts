export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface Group {
  _id: string;
  name: string;
  description: string;
  owner: User;
  members: User[];
  createdAt: string;
}

export const CATEGORIES = ['groceries', 'rent', 'utilities', 'entertainment', 'other'] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Expense {
  _id: string;
  description: string;
  amount: number;
  paidBy: User;
  splitAmong: User[];
  category: Category;
  date: string;
}

export interface MemberBalance {
  user: User;
  paid: number;
  owed: number;
  net: number;
}

export interface Settlement {
  from: User;
  to: User;
  amount: number;
}

export interface GroupBalances {
  groupId: string;
  totalExpenses: number;
  balances: MemberBalance[];
  settlements: Settlement[];
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export interface DataResponse<T> {
  success: true;
  count?: number;
  data: T;
}

export type ApiResponse<T> = DataResponse<T> | ErrorResponse;

export type AuthResponse = { success: true; token: string; user: User } | ErrorResponse;

export type MeResponse = { success: true; user: User } | ErrorResponse;

export type View = { name: 'groups' } | { name: 'group'; groupId: string };
