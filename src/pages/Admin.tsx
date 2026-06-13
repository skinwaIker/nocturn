import { useEffect, useState } from 'react';
import { useAuth, useIsAdmin } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase, type Profile, type Paste, type Rank, type Ban } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { sanitize } from '@/lib/sanitize';
import {
  Shield,
  Eye,
  Ban as BanIcon,
  Trash2,
  Award,
  PenLine,
  Users,
  FileText,
  Search,
  Pin,
  PinOff,
  AlertTriangle,
  ChevronRight,
  Monitor,
  Globe,
  Smartphone,
  Fingerprint,
  Mail,
  Clock,
  Hash,
  Activity,
  CalendarDays,
} from 'lucide-react';

type ProfileWithRank = Profile & { rank: Rank };

type AdminSection = 'users' | 'rank' | 'pastes' | 'lookup';

interface UserSession {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  device_info: string | null;
  last_active: string | null;
}

export function AdminPage() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<AdminSection>('users');
  const [users, setUsers] = useState<ProfileWithRank[]>([]);
  const [pastes, setPastes] = useState<Paste[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [bans, setBans] = useState<Ban[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, isAdmin]);

  const fetchData = async () => {
    const [usersRes, pastesRes, ranksRes, bansRes] = await Promise.all([
      supabase.from('profiles').select('*, rank:ranks(*)').order('created_at'),
      supabase.from('pastes').select('*').order('created_at', { ascending: false }),
      supabase.from('ranks').select('*').order('priority'),
      supabase.from('bans').select('*').order('created_at', { ascending: false }),
    ]);

    if (usersRes.data) setUsers(usersRes.data as unknown as ProfileWithRank[]);
    if (pastesRes.data) setPastes(pastesRes.data);
    if (ranksRes.data) setRanks(ranksRes.data);
    if (bansRes.data) setBans(bansRes.data);
    setLoading(false);
  };

  const findUserByUsernameOrUid = async (input: string): Promise<ProfileWithRank | null> => {
    const trimmed = input.trim();
    const { data } = await supabase
      .from('profiles')
      .select('*, rank:ranks(*)')
      .or(`username.eq.${trimmed},id.eq.${trimmed}`)
      .single();
    return data as unknown as ProfileWithRank | null;
  };

  const handleShadowban = async (userId: string) => {
    if (!user) return;
    await supabase.from('bans').insert({
      user_id: userId,
      banned_by: user.id,
      reason: 'Shadowban',
      shadowban: true,
    });
    fetchData();
  };

  const handleBan = async (userId: string, reason: string) => {
    if (!user) return;
    await supabase.from('bans').insert({
      user_id: userId,
      banned_by: user.id,
      reason: reason || 'No reason specified',
      shadowban: false,
    });
    fetchData();
  };

  const handleUnban = async (userId: string) => {
    await supabase.from('bans').delete().eq('user_id', userId);
    fetchData();
  };

  const handleWarn = async (userId: string, reason: string) => {
    if (!user || !reason.trim()) return;
    await supabase.from('warnings').insert({
      user_id: userId,
      warned_by: user.id,
      reason: reason.trim(),
    });
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'warning',
      message: `You received a warning: ${reason.trim()}`,
    });
    alert('Warning sent');
  };

  const handleRenameUser = async (userId: string, newName: string) => {
    if (!newName.trim()) return;
    const { error } = await supabase.from('profiles').update({ username: newName.trim() }).eq('id', userId);
    if (error) alert(error.message);
    else fetchData();
  };

  const handleDeletePaste = async (pasteId: string) => {
    await supabase.from('pastes').delete().eq('id', pasteId);
    fetchData();
  };

  const handlePinPaste = async (pasteId: string) => {
    await supabase.from('pastes').update({ pinned: true }).eq('id', pasteId);
    fetchData();
  };

  const handleUnpinPaste = async (pasteId: string) => {
    await supabase.from('pastes').update({ pinned: false }).eq('id', pasteId);
    fetchData();
  };

  const handleGiveRank = async (userId: string, rankId: string) => {
    await supabase.from('profiles').update({ rank_id: rankId }).eq('id', userId);
    fetchData();
  };

  const handleRemoveRank = async (userId: string) => {
    const defaultRank = ranks.find((r) => r.name === 'User');
    if (defaultRank) {
      await supabase.from('profiles').update({ rank_id: defaultRank.id }).eq('id', userId);
    } else {
      await supabase.from('profiles').update({ rank_id: null }).eq('id', userId);
    }
    fetchData();
  };

  const isBanned = (userId: string) => bans.some((b) => b.user_id === userId && !b.shadowban);
  const isShadowbanned = (userId: string) => bans.some((b) => b.user_id === userId && b.shadowban);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  const sidebarItems: { key: AdminSection; icon: typeof Users; label: string }[] = [
    { key: 'users', icon: Users, label: 'Users' },
    { key: 'rank', icon: Award, label: 'Rank' },
    { key: 'pastes', icon: FileText, label: 'Pastes' },
    { key: 'lookup', icon: Search, label: 'Lookup' },
  ];

  return (
    <div className="flex gap-0 -m-6 h-[calc(100vh-3rem)]">
      {/* Left sidebar */}
      <div className="w-52 shrink-0 bg-white/[0.02] border-r border-white/[0.06] flex flex-col">
        <div className="p-4 border-b border-white/[0.06] flex items-center gap-2">
          <Shield className="h-4 w-4 text-red-400" />
          <span className="text-sm font-bold">Admin Panel</span>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                activeSection === item.key
                  ? 'bg-white/[0.08] text-white border border-white/10'
                  : 'text-muted-foreground hover:bg-white/[0.04] hover:text-white/80 border border-transparent'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {activeSection === item.key && <ChevronRight className="h-3 w-3 text-white/40" />}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeSection === 'users' && (
          <UsersSection
            users={users}
            isBanned={isBanned}
            isShadowbanned={isShadowbanned}
            onBan={handleBan}
            onShadowban={handleShadowban}
            onUnban={handleUnban}
            onWarn={handleWarn}
            onRename={handleRenameUser}
            findUser={findUserByUsernameOrUid}
          />
        )}
        {activeSection === 'rank' && (
          <RankSection
            ranks={ranks}
            onGiveRank={handleGiveRank}
            onRemoveRank={handleRemoveRank}
            findUser={findUserByUsernameOrUid}
          />
        )}
        {activeSection === 'pastes' && (
          <PastesSection
            pastes={pastes}
            users={users}
            onDelete={handleDeletePaste}
            onPin={handlePinPaste}
            onUnpin={handleUnpinPaste}
          />
        )}
        {activeSection === 'lookup' && (
          <LookupSection findUser={findUserByUsernameOrUid} />
        )}
      </div>
    </div>
  );
}

/* ─── USERS SECTION ─── */
function UsersSection({
  users,
  isBanned,
  isShadowbanned,
  onBan,
  onShadowban,
  onUnban,
  onWarn,
  onRename,
  findUser,
}: {
  users: ProfileWithRank[];
  isBanned: (id: string) => boolean;
  isShadowbanned: (id: string) => boolean;
  onBan: (id: string, reason: string) => void;
  onShadowban: (id: string) => void;
  onUnban: (id: string) => void;
  onWarn: (id: string, reason: string) => void;
  onRename: (id: string, name: string) => void;
  findUser: (input: string) => Promise<ProfileWithRank | null>;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [foundUser, setFoundUser] = useState<ProfileWithRank | null>(null);
  const [searching, setSearching] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [warnReason, setWarnReason] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    setSearching(true);
    const result = await findUser(searchInput);
    setFoundUser(result);
    setSearching(false);
    setBanReason('');
    setWarnReason('');
    setNewUsername('');
    setActiveAction(null);
  };

  const targetUser = foundUser;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-1">User Management</h3>
        <p className="text-xs text-muted-foreground">Ban, shadowban, warn, or rename users by username or UID</p>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 backdrop-blur-sm space-y-4">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Search User</Label>
        <div className="flex gap-2">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Username or UID..."
            className="bg-white/[0.04] border-white/[0.08] text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={searching} size="sm" variant="outline" className="shrink-0">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {targetUser && (
          <div className="border border-white/10 rounded-lg p-4 bg-white/[0.02] space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg bg-[hsl(0,0%,12%)] flex items-center justify-center overflow-hidden border"
                style={{ borderColor: targetUser.rank?.color || '#fff' }}
              >
                {targetUser.avatar_url ? (
                  <img src={targetUser.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold">{targetUser.username[0]?.toUpperCase()}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">@{sanitize(targetUser.username)}</span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: targetUser.rank?.color + '22', color: targetUser.rank?.color }}
                  >
                    {targetUser.rank?.name ?? 'User'}
                  </span>
                  {isBanned(targetUser.id) && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-900/30 text-red-400">BANNED</span>
                  )}
                  {isShadowbanned(targetUser.id) && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-900/30 text-yellow-400">SHADOWBANNED</span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">{targetUser.id}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(isBanned(targetUser.id) || isShadowbanned(targetUser.id)) ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-600/50 text-green-400 hover:bg-green-900/20 h-8 text-xs"
                  onClick={() => onUnban(targetUser.id)}
                >
                  Unban
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-600/50 text-red-400 hover:bg-red-900/20 h-8 text-xs"
                    onClick={() => setActiveAction(activeAction === 'ban' ? null : 'ban')}
                  >
                    <BanIcon className="h-3 w-3 mr-1" /> Ban
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-yellow-600/50 text-yellow-400 hover:bg-yellow-900/20 h-8 text-xs"
                    onClick={() => setActiveAction(activeAction === 'shadowban' ? null : 'shadowban')}
                  >
                    <Eye className="h-3 w-3 mr-1" /> Shadowban
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="outline"
                className="border-orange-600/50 text-orange-400 hover:bg-orange-900/20 h-8 text-xs"
                onClick={() => setActiveAction(activeAction === 'warn' ? null : 'warn')}
              >
                <AlertTriangle className="h-3 w-3 mr-1" /> Warn
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-blue-600/50 text-blue-400 hover:bg-blue-900/20 h-8 text-xs"
                onClick={() => {
                  setActiveAction(activeAction === 'rename' ? null : 'rename');
                  setNewUsername(targetUser.username);
                }}
              >
                <PenLine className="h-3 w-3 mr-1" /> Rename
              </Button>
            </div>

            {activeAction === 'ban' && (
              <div className="border border-red-900/30 rounded-lg p-3 bg-red-900/10 space-y-2">
                <Label className="text-xs text-red-300">Ban Reason</Label>
                <Input
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Reason for ban..."
                  className="bg-white/[0.04] border-white/[0.08] text-sm"
                />
                <Button size="sm" variant="destructive" onClick={() => { onBan(targetUser.id, banReason); setActiveAction(null); }}>
                  Confirm Ban
                </Button>
              </div>
            )}

            {activeAction === 'shadowban' && (
              <div className="border border-yellow-900/30 rounded-lg p-3 bg-yellow-900/10 space-y-2">
                <p className="text-xs text-yellow-300/80">This user will not know they are shadowbanned. Their content will be hidden from others.</p>
                <Button size="sm" variant="outline" className="border-yellow-600 text-yellow-400" onClick={() => { onShadowban(targetUser.id); setActiveAction(null); }}>
                  Confirm Shadowban
                </Button>
              </div>
            )}

            {activeAction === 'warn' && (
              <div className="border border-orange-900/30 rounded-lg p-3 bg-orange-900/10 space-y-2">
                <Label className="text-xs text-orange-300">Warning Message</Label>
                <Textarea
                  value={warnReason}
                  onChange={(e) => setWarnReason(e.target.value)}
                  placeholder="Warning text (will appear in user's Notifications)..."
                  className="bg-white/[0.04] border-white/[0.08] text-sm min-h-[60px]"
                />
                <Button size="sm" variant="outline" className="border-orange-600 text-orange-400" onClick={() => { onWarn(targetUser.id, warnReason); setActiveAction(null); setWarnReason(''); }}>
                  Send Warning
                </Button>
              </div>
            )}

            {activeAction === 'rename' && (
              <div className="border border-blue-900/30 rounded-lg p-3 bg-blue-900/10 space-y-2">
                <Label className="text-xs text-blue-300">New Username</Label>
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="New username..."
                  maxLength={20}
                  className="bg-white/[0.04] border-white/[0.08] text-sm"
                />
                <Button size="sm" variant="outline" className="border-blue-600 text-blue-400" onClick={() => { onRename(targetUser.id, newUsername); setActiveAction(null); }}>
                  Rename
                </Button>
              </div>
            )}
          </div>
        )}

        {searching && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
          </div>
        )}

        {!targetUser && !searching && searchInput && (
          <p className="text-xs text-muted-foreground text-center py-4">Search for a user to manage</p>
        )}
      </div>

      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">All Users</h4>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-sm font-medium">@{sanitize(u.username)}</span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: u.rank?.color + '22', color: u.rank?.color }}
              >
                {u.rank?.name ?? 'User'}
              </span>
              {isBanned(u.id) && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-900/30 text-red-400">BANNED</span>
              )}
              {isShadowbanned(u.id) && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-900/30 text-yellow-400">SHADOW</span>
              )}
              <span className="text-[10px] text-muted-foreground font-mono ml-auto">{u.id.substring(0, 8)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── RANK SECTION ─── */
function RankSection({
  ranks,
  onGiveRank,
  onRemoveRank,
  findUser,
}: {
  ranks: Rank[];
  onGiveRank: (userId: string, rankId: string) => void;
  onRemoveRank: (userId: string) => void;
  findUser: (input: string) => Promise<ProfileWithRank | null>;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [foundUser, setFoundUser] = useState<ProfileWithRank | null>(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    setSearching(true);
    const result = await findUser(searchInput);
    setFoundUser(result);
    setSearching(false);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-1">Rank Management</h3>
        <p className="text-xs text-muted-foreground">Assign or remove ranks by username or UID</p>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 backdrop-blur-sm space-y-4">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Search User</Label>
        <div className="flex gap-2">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Username or UID..."
            className="bg-white/[0.04] border-white/[0.08] text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={searching} size="sm" variant="outline" className="shrink-0">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {foundUser && (
          <div className="border border-white/10 rounded-lg p-4 bg-white/[0.02] space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">@{sanitize(foundUser.username)}</span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: foundUser.rank?.color + '22', color: foundUser.rank?.color }}
              >
                {foundUser.rank?.name ?? 'User'}
              </span>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Assign Rank</Label>
              <div className="grid grid-cols-2 gap-2">
                {ranks.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      onGiveRank(foundUser.id, r.id);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all ${
                      foundUser.rank?.id === r.id
                        ? 'border-white/20 bg-white/[0.06]'
                        : 'border-white/[0.06] hover:border-white/15 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                    <span style={{ color: r.color }}>{r.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="border-red-600/50 text-red-400 hover:bg-red-900/20 text-xs"
              onClick={() => onRemoveRank(foundUser.id)}
            >
              <Award className="h-3 w-3 mr-1" /> Remove Rank (reset to User)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── PASTES SECTION ─── */
function PastesSection({
  pastes,
  users,
  onDelete,
  onPin,
  onUnpin,
}: {
  pastes: Paste[];
  users: ProfileWithRank[];
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onUnpin: (id: string) => void;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [filterType, setFilterType] = useState<'title' | 'username' | 'uid'>('title');
  const [filtered, setFiltered] = useState<Paste[]>(pastes);

  const handleSearch = () => {
    const q = searchInput.trim().toLowerCase();
    if (!q) {
      setFiltered(pastes);
      return;
    }
    if (filterType === 'title') {
      setFiltered(pastes.filter((p) => p.title.toLowerCase().includes(q)));
    } else {
      const matchingUserIds = users
        .filter((u) =>
          filterType === 'username'
            ? u.username.toLowerCase().includes(q)
            : u.id.toLowerCase().includes(q)
        )
        .map((u) => u.id);
      setFiltered(pastes.filter((p) => matchingUserIds.includes(p.user_id)));
    }
  };

  useEffect(() => {
    setFiltered(pastes);
  }, [pastes]);

  const getAuthorName = (userId: string) => {
    const u = users.find((u) => u.id === userId);
    return u?.username ?? 'unknown';
  };

  const pinnedPastes = filtered.filter((p) => p.pinned);
  const regularPastes = filtered.filter((p) => !p.pinned);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-1">Paste Management</h3>
        <p className="text-xs text-muted-foreground">Delete or pin pastes</p>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 backdrop-blur-sm space-y-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Search</Label>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search pastes..."
              className="bg-white/[0.04] border-white/[0.08] text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex gap-1">
            {(['title', 'username', 'uid'] as const).map((type) => (
              <Button
                key={type}
                size="sm"
                variant={filterType === type ? 'default' : 'outline'}
                className="text-[10px] h-8 px-2"
                onClick={() => setFilterType(type)}
              >
                {type === 'uid' ? 'UID' : type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
          <Button onClick={handleSearch} size="sm" variant="outline" className="shrink-0 h-8">
            <Search className="h-3.5 w-3.5" />
          </Button>
        </div>

        {pinnedPastes.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Pin className="h-3 w-3" />
              <span className="uppercase tracking-wider font-semibold">Pinned</span>
            </div>
            {pinnedPastes.map((paste) => (
              <PasteRow key={paste.id} paste={paste} authorName={getAuthorName(paste.user_id)} onDelete={onDelete} onPin={onPin} onUnpin={onUnpin} isPinned />
            ))}
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        )}

        <div className="space-y-2">
          {regularPastes.map((paste) => (
            <PasteRow key={paste.id} paste={paste} authorName={getAuthorName(paste.user_id)} onDelete={onDelete} onPin={onPin} onUnpin={onUnpin} />
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No pastes found</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PasteRow({
  paste,
  authorName,
  onDelete,
  onPin,
  onUnpin,
  isPinned,
}: {
  paste: Paste;
  authorName: string;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onUnpin: (id: string) => void;
  isPinned?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-white/10 transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isPinned && <Pin className="h-3 w-3 text-white/40 shrink-0" />}
          <p className="text-sm font-medium truncate">{sanitize(paste.title)}</p>
        </div>
        <p className="text-[11px] text-muted-foreground">@{sanitize(authorName)}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {isPinned ? (
          <Button variant="ghost" size="sm" className="h-7 text-yellow-400 hover:text-yellow-300" onClick={() => onUnpin(paste.id)}>
            <PinOff className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="h-7 text-blue-400 hover:text-blue-300" onClick={() => onPin(paste.id)}>
            <Pin className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-red-400 hover:text-red-300"
          onClick={() => { if (confirm('Delete this paste?')) onDelete(paste.id); }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ─── LOOKUP SECTION ─── */
function LookupSection({
  findUser,
}: {
  findUser: (input: string) => Promise<ProfileWithRank | null>;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [foundUser, setFoundUser] = useState<ProfileWithRank | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [warnings, setWarnings] = useState<Array<{ id: string; reason: string; created_at: string; warned_by: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    setSearching(true);
    setSearched(true);
    const result = await findUser(searchInput);
    setFoundUser(result);

    if (result) {
      const [sessionsRes, warningsRes] = await Promise.all([
        supabase.from('user_sessions').select('*').eq('user_id', result.id).order('last_active', { ascending: false }),
        supabase.from('warnings').select('*').eq('user_id', result.id).order('created_at', { ascending: false }),
      ]);
      if (sessionsRes.data) setSessions(sessionsRes.data as UserSession[]);
      if (warningsRes.data) setWarnings(warningsRes.data as typeof warnings);
    } else {
      setSessions([]);
      setWarnings([]);
    }

    setSearching(false);
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const parseUserAgent = (ua: string | null) => {
    if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';

    if (ua.includes('Firefox/')) browser = 'Firefox';
    else if (ua.includes('Edg/')) browser = 'Edge';
    else if (ua.includes('Chrome/')) browser = 'Chrome';
    else if (ua.includes('Safari/')) browser = 'Safari';

    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) { os = 'Android'; device = 'Mobile'; }
    else if (ua.includes('iPhone') || ua.includes('iPad')) { os = 'iOS'; device = ua.includes('iPad') ? 'Tablet' : 'Mobile'; }

    return { browser, os, device };
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-1">User Lookup</h3>
        <p className="text-xs text-muted-foreground">View all available information about a user</p>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 backdrop-blur-sm space-y-4">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Search User</Label>
        <div className="flex gap-2">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Username or UID..."
            className="bg-white/[0.04] border-white/[0.08] text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={searching} size="sm" variant="outline" className="shrink-0">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {searching && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-white/20 border-t-white rounded-full" />
        </div>
      )}

      {foundUser && !searching && (
        <div className="space-y-4">
          {/* Profile info */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 backdrop-blur-sm space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Fingerprint className="h-3.5 w-3.5" /> Profile Information
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow icon={Hash} label="Username" value={`@${foundUser.username}`} />
              <InfoRow icon={Mail} label="Email" value={foundUser.email || 'N/A'} />
              <InfoRow icon={Fingerprint} label="UID" value={foundUser.id} mono />
              <InfoRow icon={CalendarDays} label="Joined" value={formatDate(foundUser.created_at)} />
              <InfoRow icon={Award} label="Rank" value={foundUser.rank?.name ?? 'User'} rankColor={foundUser.rank?.color} />
              <InfoRow icon={Activity} label="Bio" value={foundUser.bio || 'No bio'} />
            </div>
          </div>

          {/* Sessions */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 backdrop-blur-sm space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Monitor className="h-3.5 w-3.5" /> Sessions & Device Info
            </h4>
            {sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No session data available</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => {
                  const parsed = parseUserAgent(session.user_agent);
                  return (
                    <div key={session.id} className="border border-white/[0.06] rounded-lg p-3 bg-white/[0.02] space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <InfoRow icon={Globe} label="IP" value={session.ip_address || 'Hidden'} mono />
                        <InfoRow icon={Monitor} label="Browser" value={parsed.browser} />
                        <InfoRow icon={Smartphone} label="OS" value={parsed.os} />
                        <InfoRow icon={Smartphone} label="Device" value={parsed.device} />
                        <InfoRow icon={Clock} label="Last Active" value={formatDate(session.last_active)} />
                        {session.device_info && (
                          <InfoRow icon={Monitor} label="Device Info" value={session.device_info} />
                        )}
                      </div>
                      {session.user_agent && (
                        <div className="mt-2 pt-2 border-t border-white/[0.04]">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">User Agent</span>
                          <p className="text-[10px] font-mono text-muted-foreground/70 mt-0.5 break-all">{session.user_agent}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Warnings */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 backdrop-blur-sm space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5" /> Warnings ({warnings.length})
            </h4>
            {warnings.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No warnings</p>
            ) : (
              <div className="space-y-2">
                {warnings.map((w) => (
                  <div key={w.id} className="border border-orange-900/20 rounded-lg p-3 bg-orange-900/5">
                    <p className="text-xs">{sanitize(w.reason)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{formatDate(w.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!foundUser && !searching && searched && (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-8 text-center backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">User not found</p>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
  rankColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
  rankColor?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 rounded bg-white/[0.04] flex items-center justify-center shrink-0">
        <Icon className="h-3 w-3 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider block">{label}</span>
        <span className={`text-xs ${mono ? 'font-mono' : ''} ${rankColor ? '' : 'text-white/80'} truncate block`} style={rankColor ? { color: rankColor } : undefined}>
          {value}
        </span>
      </div>
    </div>
  );
}
