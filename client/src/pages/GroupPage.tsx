import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardTitle } from '@/components/ui/card';
import { addMember, createExpense, getBalances, getExpenses, getGroup } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { formatAmount } from '@/lib/utils';
import { CATEGORIES, type Category, type Expense, type Group, type GroupBalances } from '@/types';
import './GroupPage.css';

interface GroupPageProps {
  groupId: string;
  onBack: () => void;
}

const isCategory = (value: string): value is Category =>
  (CATEGORIES as readonly string[]).includes(value);

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong');

export default function GroupPage({ groupId, onBack }: GroupPageProps) {
  const group = useAsync<Group>(() => getGroup(groupId), [groupId]);
  const expenses = useAsync<Expense[]>(() => getExpenses(groupId), [groupId]);
  const balances = useAsync<GroupBalances>(() => getBalances(groupId), [groupId]);

  const [memberEmail, setMemberEmail] = useState('');
  const [memberError, setMemberError] = useState('');

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('other');
  const [expenseError, setExpenseError] = useState('');

  const handleAddMember = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMemberError('');
    try {
      await addMember(groupId, memberEmail);
      setMemberEmail('');
      group.reload();
      balances.reload();
    } catch (err) {
      setMemberError(errorMessage(err));
    }
  };

  const handleAddExpense = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setExpenseError('');
    try {
      await createExpense(groupId, { description, amount: Number(amount), category });
      setDescription('');
      setAmount('');
      setCategory('other');
      expenses.reload();
      balances.reload();
    } catch (err) {
      setExpenseError(errorMessage(err));
    }
  };

  if (group.error) {
    return (
      <div className="group-page">
        <Button variant="outline" className="group-back" onClick={onBack}>
          Back to groups
        </Button>
        <p className="form-error">{group.error}</p>
      </div>
    );
  }

  return (
    <div className="group-page">
      <div className="group-heading">
        <Button variant="outline" className="group-back" onClick={onBack}>
          Back to groups
        </Button>
        <h2 className="group-name">{group.data?.name ?? 'Loading...'}</h2>
        {group.data?.description && <p className="muted-text">{group.data.description}</p>}
      </div>

      <div className="group-grid">
        <div className="group-column">
          <Card>
            <CardTitle>Add expense</CardTitle>
            <form className="form-stack" onSubmit={handleAddExpense}>
              <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
              <div className="form-row">
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <Select
                  value={category}
                  onChange={(e) => {
                    if (isCategory(e.target.value)) setCategory(e.target.value);
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
              <p className="muted-text">Paid by you, split equally between all members.</p>
              {expenseError && <p className="form-error">{expenseError}</p>}
              <Button type="submit" disabled={!description.trim() || !amount}>
                Add expense
              </Button>
            </form>
          </Card>

          <Card>
            <CardTitle>Members</CardTitle>
            <ul className="group-list">
              {group.data?.members.map((member) => (
                <li key={member._id} className="group-row">
                  <span>{member.name}</span>
                  <span className="muted-text">{member.email}</span>
                </li>
              ))}
            </ul>
            <form className="form-row" onSubmit={handleAddMember}>
              <Input
                type="email"
                placeholder="Member email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
              />
              <Button type="submit" variant="outline" disabled={!memberEmail.trim()}>
                Add
              </Button>
            </form>
            {memberError && <p className="form-error">{memberError}</p>}
          </Card>
        </div>

        <div className="group-column">
          <Card>
            <div className="group-card-header">
              <CardTitle>Balances</CardTitle>
              {balances.data && (
                <span className="muted-text">Total {formatAmount(balances.data.totalExpenses)}</span>
              )}
            </div>
            {balances.error && <p className="form-error">{balances.error}</p>}
            <ul className="group-list">
              {balances.data?.balances.map((item) => (
                <li key={item.user._id} className="group-row">
                  <span>{item.user.name}</span>
                  <span className={item.net < 0 ? 'amount-negative' : 'amount-positive'}>
                    {item.net > 0 ? '+' : ''}
                    {formatAmount(item.net)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="section-label">Settle up</p>
            {balances.data?.settlements.length === 0 && <p className="muted-text">Everyone is settled.</p>}
            <ul className="group-list">
              {balances.data?.settlements.map((s) => (
                <li key={`${s.from._id}-${s.to._id}`} className="group-row">
                  <span>
                    {s.from.name} pays {s.to.name}
                  </span>
                  <span>{formatAmount(s.amount)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardTitle>Expenses</CardTitle>
            {expenses.error && <p className="form-error">{expenses.error}</p>}
            {expenses.data?.length === 0 && <p className="muted-text">No expenses yet.</p>}
            <ul className="group-list">
              {expenses.data?.map((expense) => (
                <li key={expense._id} className="expense-row">
                  <div className="expense-main">
                    <span>{expense.description}</span>
                    <span className="muted-text">
                      Paid by {expense.paidBy.name} on {new Date(expense.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="expense-side">
                    <span>{formatAmount(expense.amount)}</span>
                    <span className="tag">{expense.category}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
