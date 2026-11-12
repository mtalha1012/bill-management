import type {
  ApiResponse,
  AuthResponse,
  Category,
  Expense,
  Group,
  GroupBalances,
  MeResponse,
  User,
} from '@/types';

const TOKEN_KEY = 'token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

type Method = 'GET' | 'POST' | 'DELETE';

async function request<T extends { success: boolean }>(
  path: string,
  method: Method = 'GET',
  body?: object
): Promise<Exclude<T, { success: false }>> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = (await res.json()) as T | { success: false; error: string };

  if (!json.success) {
    throw new Error('error' in json ? json.error : 'Request failed');
  }

  return json as Exclude<T, { success: false }>;
}

async function getData<T>(path: string, method?: Method, body?: object): Promise<T> {
  const json = await request<ApiResponse<T>>(path, method, body);
  return json.data;
}

export async function login(email: string, password: string): Promise<User> {
  const json = await request<AuthResponse>('/auth/login', 'POST', { email, password });
  setToken(json.token);
  return json.user;
}

export async function register(name: string, email: string, password: string): Promise<User> {
  const json = await request<AuthResponse>('/auth/register', 'POST', { name, email, password });
  setToken(json.token);
  return json.user;
}

export async function getMe(): Promise<User> {
  const json = await request<MeResponse>('/auth/me');
  return json.user;
}

export const getGroups = () => getData<Group[]>('/groups');

export const getGroup = (id: string) => getData<Group>(`/groups/${id}`);

export const createGroup = (name: string, description: string) =>
  getData<Group>('/groups', 'POST', { name, description });

export const addMember = (groupId: string, email: string) =>
  getData<Group>(`/groups/${groupId}/members`, 'POST', { email });

export const getExpenses = (groupId: string) => getData<Expense[]>(`/groups/${groupId}/expenses`);

export const createExpense = (
  groupId: string,
  expense: { description: string; amount: number; category: Category }
) => getData<Expense>(`/groups/${groupId}/expenses`, 'POST', expense);

export const getBalances = (groupId: string) =>
  getData<GroupBalances>(`/groups/${groupId}/balances`);
