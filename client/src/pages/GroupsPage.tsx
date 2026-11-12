import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardTitle } from '@/components/ui/card';
import { createGroup, getGroups } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import type { Group } from '@/types';
import './GroupsPage.css';

interface GroupsPageProps {
  onOpen: (groupId: string) => void;
}

export default function GroupsPage({ onOpen }: GroupsPageProps) {
  const { data: groups, error, loading, reload } = useAsync<Group[]>(getGroups);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    try {
      await createGroup(name, description);
      setName('');
      setDescription('');
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create group');
    }
  };

  return (
    <div className="groups-layout">
      <Card>
        <CardTitle>New group</CardTitle>
        <form className="form-stack" onSubmit={handleCreate}>
          <Input placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {formError && <p className="form-error">{formError}</p>}
          <Button type="submit" disabled={!name.trim()}>
            Create group
          </Button>
        </form>
      </Card>

      <div className="groups-list">
        <p className="section-label">Your groups</p>
        {loading && <p className="muted-text">Loading groups...</p>}
        {error && <p className="form-error">{error}</p>}
        {groups && groups.length === 0 && <p className="muted-text">No groups yet. Create one to get started.</p>}
        {groups?.map((group) => (
          <button key={group._id} className="group-item" onClick={() => onOpen(group._id)}>
            <span className="group-item-name">{group.name}</span>
            {group.description && <span className="muted-text">{group.description}</span>}
            <span className="tag">{group.members.length} members</span>
          </button>
        ))}
      </div>
    </div>
  );
}
