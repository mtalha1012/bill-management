import { Button } from '@/components/ui/button';
import type { Theme } from '@/lib/useTheme';
import type { User } from '@/types';
import './Header.css';

interface HeaderProps {
  user: User;
  theme: Theme;
  onToggleTheme: () => void;
  onLogout: () => void;
}

export default function Header({ user, theme, onToggleTheme, onLogout }: HeaderProps) {
  return (
    <header className="header">
      <div>
        <h1 className="header-title">Bill Splitter</h1>
        <p className="muted-text">Signed in as {user.name}</p>
      </div>
      <div className="header-actions">
        <Button variant="outline" onClick={onToggleTheme}>
          {theme === 'light' ? 'Dark' : 'Light'}
        </Button>
        <Button variant="outline" onClick={onLogout}>
          Log out
        </Button>
      </div>
    </header>
  );
}
