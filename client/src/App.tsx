import { useEffect, useState } from 'react';
import { clearToken, getMe, getToken } from '@/lib/api';
import { useTheme } from '@/lib/useTheme';
import type { User, View } from '@/types';
import AuthPage from '@/pages/AuthPage';
import GroupsPage from '@/pages/GroupsPage';
import GroupPage from '@/pages/GroupPage';
import Header from '@/components/Header';
import './App.css';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [view, setView] = useState<View>({ name: 'groups' });

  useEffect(() => {
    if (!getToken()) return;
    getMe()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    clearToken();
    setUser(null);
    setView({ name: 'groups' });
  };

  if (loading) {
    return <div className="app-shell app-loading">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="app-shell">
        <AuthPage onAuth={setUser} theme={theme} onToggleTheme={toggleTheme} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-page">
        <Header user={user} theme={theme} onToggleTheme={toggleTheme} onLogout={logout} />
        {view.name === 'groups' ? (
          <GroupsPage onOpen={(groupId) => setView({ name: 'group', groupId })} />
        ) : (
          <GroupPage groupId={view.groupId} onBack={() => setView({ name: 'groups' })} />
        )}
      </div>
    </div>
  );
}
