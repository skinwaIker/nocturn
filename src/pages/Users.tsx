import { useEffect, useState } from 'react';
import { supabase, type Profile, type Rank } from '@/lib/db';
import { useNavigate } from 'react-router-dom';
import { sanitize } from '@/lib/sanitize';

type ProfileWithRank = Profile & { rank: Rank };

export function UsersPage() {
  const [users, setUsers] = useState<ProfileWithRank[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*, rank:ranks(*)')
      .order('created_at', { ascending: true });

    if (data) {
      const sorted = (data as unknown as ProfileWithRank[]).sort(
        (a, b) => (b.rank?.priority ?? 0) - (a.rank?.priority ?? 0)
      );
      setUsers(sorted);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-6">Users</h2>
      <div className="space-y-1">
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => navigate(`/u/${u.username}`)}
            className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-[hsl(0,0%,8%)] transition-colors text-left group"
          >
            <div
              className="w-9 h-9 rounded-full bg-[hsl(0,0%,12%)] flex items-center justify-center text-sm font-bold overflow-hidden shrink-0"
              style={{ borderColor: u.rank?.color, borderWidth: 2 }}
            >
              {u.avatar_url ? (
                <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                u.username[0].toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium group-hover:text-white transition-colors">
                @{sanitize(u.username)}
              </span>
            </div>
            <span
              className="text-[11px] font-bold px-2 py-1 rounded"
              style={{ backgroundColor: u.rank?.color + '22', color: u.rank?.color }}
            >
              {u.rank?.name ?? 'User'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
