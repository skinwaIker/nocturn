import { useEffect, useState } from 'react';
import { supabase, DEFAULT_AVATAR, type Profile, type Rank } from '@/lib/db';
import { useNavigate } from 'react-router-dom';
import { sanitize } from '@/lib/sanitize';

type ProfileWithRank = Profile & { rank: Rank };

export function UsersPage() {
  const [users, setUsers] = useState<ProfileWithRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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

  const filtered = search.trim()
    ? users.filter((u) => u.username.toLowerCase().includes(search.toLowerCase()))
    : users;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Users</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-white/20 w-48 backdrop-blur-sm"
        />
      </div>
      <div className="space-y-1">
        {filtered.map((u) => (
          <button
            key={u.id}
            onClick={() => navigate(`/u/${u.username}`)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-all text-left group border border-transparent hover:border-white/[0.06]"
          >
            <div
              className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center text-sm font-bold overflow-hidden shrink-0 border"
              style={{ borderColor: u.rank?.color || '#ffffff22' }}
            >
              {u.avatar_url ? (
                <img src={u.avatar_url} alt="" className="w-full h-full object-cover" onError={(e) => {
                  e.currentTarget.src = DEFAULT_AVATAR;
                }} />
              ) : (
                <img src={DEFAULT_AVATAR} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium group-hover:text-white transition-colors">
                @{sanitize(u.username)}
              </span>
            </div>
            <span
              className="text-[11px] font-bold px-2 py-1 rounded-md backdrop-blur-sm"
              style={{ backgroundColor: u.rank?.color + '22', color: u.rank?.color, border: `1px solid ${u.rank?.color}22` }}
            >
              {u.rank?.name ?? 'User'}
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No users found</p>
        )}
      </div>
    </div>
  );
}
