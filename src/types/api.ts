import { Types } from 'mongoose';

export interface ErrorResponse {
  success: false;
  error: string;
}

// Generic response wrapper used by every data endpoint
export interface DataResponse<T> {
  success: true;
  count?: number;
  data: T;
}

export type ApiResponse<T> = DataResponse<T> | ErrorResponse;

export interface PublicUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  createdAt?: Date;
}

export type AuthResponse =
  | { success: true; token: string; user: PublicUser }
  | ErrorResponse;

export type MeResponse = { success: true; user: PublicUser } | ErrorResponse;

export type MessageResponse = { success: true; message: string } | ErrorResponse;

export type IdParams = {
  id: string;
};

export interface RegisterBody {
  name?: string;
  email?: string;
  password?: string;
}

export interface LoginBody {
  email?: string;
  password?: string;
}

export interface CreateGroupBody {
  name?: string;
  description?: string;
}

export interface AddMemberBody {
  userId?: string;
  email?: string;
}

export interface CreateExpenseBody {
  description?: string;
  amount?: number | string;
  paidBy?: string;
  splitAmong?: string[];
  category?: string;
  date?: string;
}

export interface MemberBalance {
  user: PublicUser;
  paid: number;
  owed: number;
  net: number;
}

export interface Settlement {
  from: PublicUser;
  to: PublicUser;
  amount: number;
}

export interface GroupBalances {
  groupId: Types.ObjectId;
  totalExpenses: number;
  balances: MemberBalance[];
  settlements: Settlement[];
}
