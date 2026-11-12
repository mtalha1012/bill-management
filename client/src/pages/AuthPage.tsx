import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { login, register } from '@/lib/api';
import type { Theme } from '@/lib/useTheme';
import type { User } from '@/types';
import './AuthPage.css';

type Mode = 'login' | 'register';

interface AuthPageProps {
  onAuth: (user: User) => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export default function AuthPage({ onAuth, theme, onToggleTheme }: AuthPageProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = mode === 'login' ? await login(email, password) : await register(name, email, password);
      onAuth(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="auth-card">
      <Button variant="ghost" size="sm" className="auth-theme-toggle" onClick={onToggleTheme}>
        {theme === 'light' ? 'Dark' : 'Light'}
      </Button>
      <h1 className="auth-title">Bill Splitter</h1>
      <p className="auth-subtitle">Split shared expenses with your group and see who owes whom.</p>

      <div className="auth-tabs">
        <Button variant={mode === 'login' ? 'default' : 'outline'} onClick={() => setMode('login')}>
          Log in
        </Button>
        <Button variant={mode === 'register' ? 'default' : 'outline'} onClick={() => setMode('register')}>
          Register
        </Button>
      </div>

      <form className="form-stack" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        )}
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="form-error">{error}</p>}
        <Button type="submit" size="lg" disabled={submitting}>
          {mode === 'login' ? 'Log in' : 'Create account'}
        </Button>
      </form>
    </Card>
  );
}
