import { useEffect, useState } from 'react';
import { useAuth, useIsAdmin } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase, type Profile, type Paste, type Rank, type Ban, type Warning, type UserSession } from '@/lib/db';
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
  AlertTriangle,
  Pin,
  Monitor,
  Copy,
  Check,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ProfileWithRank = Profile & { rank: Rank };

type Section = 'users' | 'rank' | 'pastes' | 'lookup';

export function AdminPage() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<Section>('users');
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

  const isBanned = (userId: string) => bans.some((b) => b.user_id === userId && !b.shadowban);
  const isShadowbanned = (userId: string) => bans.some((b) => b.user_id === userId && b.shadowban);

  const handleBan = async (userId: string, reason: string) => {
    if (!user) return;
    const { error } = await supabase.rpc('admin_insert_ban', {
      target_uid: userId,
      ban_reason: reason || 'No reason specified',
      is_shadowban: false,
    });
    if (error) alert(error.message);
    else fetchData();
  };

  const handleShadowban = async (userId: string) => {
    if (!user) return;
    const { error } = await supabase.rpc('admin_insert_ban', {
      target_uid: userId,
      ban_reason: 'Shadowban',
      is_shadowban: true,
    });
    if (error) alert(error.message);
    else fetchData();
  };

  const handleUnban = async (userId: string) => {
    const { error } = await supabase.rpc('admin_delete_ban', { target_uid: userId });
    if (error) alert(error.message);
    else fetchData();
  };

  const handleWarn = async (userId: string, reason: string) => {
    if (!user || !reason.trim()) return;
    const { error } = await supabase.rpc('admin_insert_warning', {
      target_uid: userId,
      warn_reason: reason.trim(),
    });
    if (error) alert(error.message);
    else fetchData();
  };

  const handleRenameUser = async (userId: string, newName: string) => {
    if (!newName.trim()) return;
    const { error } = await supabase.rpc('admin_update_profile', {
      target_uid: userId,
      updates: { username: newName.trim() },
    });
    if (error) alert(error.message);
    else fetchData();
  };

  const handleGiveRank = async (userId: string, rankId: string) => {
    const { error } = await supabase.rpc('admin_update_profile', {
      target_uid: userId,
      updates: { rank_id: rankId },
    });
    if (error) alert(error.message);
    else fetchData();
  };

  const handleRemoveRank = async (userId: string) => {
    const defaultRank = ranks.find((r) => r.name === 'User');
    if (!defaultRank) return;
    const { error } = await supabase.rpc('admin_update_profile', {
      target_uid: userId,
      updates: { rank_id: defaultRank.id },
    });
    if (error) alert(error.message);
    else fetchData();
  };

  const handleDeletePaste = async (pasteId: string) => {
    const { error } = await supabase.rpc('admin_delete_paste', { paste_id: pasteId });
    if (error) alert(error.message);
    else fetchData();
  };

  const handlePinPaste = async (pasteId: string) => {
    const { error } = await supabase.rpc('admin_pin_paste', { paste_id: pasteId, pin: true });
    if (error) alert(error.message);
    else fetchData();
  };

  const handleUnpinPaste = async (pasteId: string) => {
    const { error } = await supabase.rpc('admin_pin_paste', { paste_id: pasteId, pin: false });
    if (error) alert(error.message);
    else fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  const sidebarItems = [
    { id: 'users' as Section, icon: Users, label: 'Users' },
    { id: 'rank' as Section, icon: Award, label: 'Rank' },
    { id: 'pastes' as Section, icon: FileText, label: 'Pastes' },
    { id: 'lookup' as Section, icon: Search, label: 'Lookup' },
  ];

  return (
    <div className="flex gap-0 -m-6 h-[calc(100vh-3rem)]">
      {/* Left sidebar with icons */}
      <div className="w-16 shrink-0 glass-sidebar flex flex-col items-center py-4 gap-1">
        <div className="mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center border border-red-500/20">
            <Shield className="h-5 w-5 text-red-400" />
          </div>
        </div>
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              activeSection === item.id
                ? 'bg-white/10 text-white'
                : 'text-muted-foreground hover:text-white hover:bg-white/5'
            }`}
            title={item.label}
          >
            <item.icon className="h-5 w-5" />
          </button>
        ))}
      </div>

      {/* Content area */}
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
          />
        )}
        {activeSection === 'rank' && (
          <RankSection
            users={users}
            ranks={ranks}
            onGiveRank={handleGiveRank}
            onRemoveRank={handleRemoveRank}
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
          <LookupSection users={users} />
        )}
      </div>
    </div>
  );
}

/* ==================== USERS SECTION ==================== */
function UsersSection({
  users,
  isBanned,
  isShadowbanned,
  onBan,
  onShadowban,
  onUnban,
  onWarn,
  onRename,
}: {
  users: ProfileWithRank[];
  isBanned: (id: string) => boolean;
  isShadowbanned: (id: string) => boolean;
  onBan: (id: string, reason: string) => void;
  onShadowban: (id: string) => void;
  onUnban: (id: string) => void;
  onWarn: (id: string, reason: string) => void;
  onRename: (id: string, name: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionUser, setActionUser] = useState<ProfileWithRank | null>(null);
  const [actionType, setActionType] = useState<'ban' | 'shadowban' | 'warn' | 'rename' | null>(null);
  const [banReason, setBanReason] = useState('');
  const [warnReason, setWarnReason] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [searchBy, setSearchBy] = useState<'username' | 'uid'>('username');

  const filtered = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    if (searchBy === 'username') return u.username.toLowerCase().includes(q);
    return u.id.toLowerCase().includes(q);
  });

  const openAction = (u: ProfileWithRank, action: 'ban' | 'shadowban' | 'warn' | 'rename') => {
    setActionUser(u);
    setActionType(action);
    setBanReason('');
    setWarnReason('');
    setNewUsername('');
  };

  const closeAction = () => {
    setActionUser(null);
    setActionType(null);
  };

  const executeAction = () => {
    if (!actionUser || !actionType) return;
    if (actionType === 'ban') onBan(actionUser.id, banReason);
    if (actionType === 'shadowban') onShadowban(actionUser.id);
    if (actionType === 'warn') onWarn(actionUser.id, warnReason);
    if (actionType === 'rename') onRename(actionUser.id, newUsername);
    closeAction();
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-bold">Users</h2>
      </div>

      {/* Search */}
      <div className="glass-card rounded-xl p-4 mb-4 flex gap-3 items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setSearchBy('username')}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${searchBy === 'username' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}
          >
            Username
          </button>
          <button
            onClick={() => setSearchBy('uid')}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${searchBy === 'uid' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}
          >
            UID
          </button>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search by ${searchBy}...`}
            className="pl-9 bg-white/5 border-white/10 focus:border-white/25"
          />
        </div>
      </div>

      {/* Action Modal */}
      {actionUser && actionType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={closeAction}>
          <div className="glass-card rounded-xl p-6 w-full max-w-md border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              {actionType === 'ban' && <BanIcon className="h-5 w-5 text-red-400" />}
              {actionType === 'shadowban' && <Eye className="h-5 w-5 text-yellow-400" />}
              {actionType === 'warn' && <AlertTriangle className="h-5 w-5 text-amber-400" />}
              {actionType === 'rename' && <PenLine className="h-5 w-5 text-blue-400" />}
              <h3 className="text-sm font-semibold">
                {actionType === 'ban' && `Ban @${sanitize(actionUser.username)}`}
                {actionType === 'shadowban' && `Shadowban @${sanitize(actionUser.username)}`}
                {actionType === 'warn' && `Warn @${sanitize(actionUser.username)}`}
                {actionType === 'rename' && `Rename @${sanitize(actionUser.username)}`}
              </h3>
            </div>

            {actionType === 'ban' && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">The user will be notified of their ban.</p>
                <div className="space-y-2">
                  <Label className="text-xs">Reason</Label>
                  <Input
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Reason for ban..."
                    className="bg-white/5 border-white/10 focus:border-white/25"
                  />
                </div>
              </div>
            )}

            {actionType === 'shadowban' && (
              <p className="text-xs text-muted-foreground">This user will not know they are shadowbanned. Their content will be hidden from others.</p>
            )}

            {actionType === 'warn' && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">The warning will appear in the user's Notifications.</p>
                <div className="space-y-2">
                  <Label className="text-xs">Warning Text</Label>
                  <Textarea
                    value={warnReason}
                    onChange={(e) => setWarnReason(e.target.value)}
                    placeholder="Warning message..."
                    className="bg-white/5 border-white/10 focus:border-white/25"
                  />
                </div>
              </div>
            )}

            {actionType === 'rename' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">New Username</Label>
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="New username..."
                    maxLength={20}
                    className="bg-white/5 border-white/10 focus:border-white/25"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button variant="ghost" size="sm" onClick={closeAction} className="text-muted-foreground">Cancel</Button>
              <Button
                size="sm"
                onClick={executeAction}
                className={
                  actionType === 'ban' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20' :
                  actionType === 'shadowban' ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/20' :
                  actionType === 'warn' ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/20' :
                  'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/20'
                }
                disabled={actionType === 'warn' && !warnReason.trim() || actionType === 'rename' && !newUsername.trim()}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="space-y-2">
        {filtered.map((u) => (
          <div
            key={u.id}
            className="glass-card rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm font-medium">@{sanitize(u.username)}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{u.id.substring(0, 8)}</span>
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
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-900/30 text-yellow-400">SHADOWBANNED</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => openAction(u, 'shadowban')}
                className="p-1.5 rounded-lg text-yellow-400 hover:bg-yellow-400/10 transition-colors"
                title="Shadowban"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => openAction(u, 'ban')}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                title="Ban"
              >
                <BanIcon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => openAction(u, 'warn')}
                className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-400/10 transition-colors"
                title="Warn"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => openAction(u, 'rename')}
                className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-400/10 transition-colors"
                title="Rename"
              >
                <PenLine className="h-3.5 w-3.5" />
              </button>
              {(isBanned(u.id) || isShadowbanned(u.id)) && (
                <button
                  onClick={() => onUnban(u.id)}
                  className="p-1.5 rounded-lg text-green-400 hover:bg-green-400/10 transition-colors"
                  title="Unban"
                >
                  Unban
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No users found</p>
        )}
      </div>
    </div>
  );
}

/* ==================== RANK SECTION ==================== */
function RankSection({
  users,
  ranks,
  onGiveRank,
  onRemoveRank,
}: {
  users: ProfileWithRank[];
  ranks: Rank[];
  onGiveRank: (userId: string, rankId: string) => void;
  onRemoveRank: (userId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState<'username' | 'uid'>('username');
  const [selectedUser, setSelectedUser] = useState<ProfileWithRank | null>(null);
  const [selectedRankId, setSelectedRankId] = useState('');

  const filtered = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    if (searchBy === 'username') return u.username.toLowerCase().includes(q);
    return u.id.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Award className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-bold">Rank Management</h2>
      </div>

      {/* Search */}
      <div className="glass-card rounded-xl p-4 mb-4 flex gap-3 items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setSearchBy('username')}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${searchBy === 'username' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}
          >
            Username
          </button>
          <button
            onClick={() => setSearchBy('uid')}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${searchBy === 'uid' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}
          >
            UID
          </button>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search by ${searchBy}...`}
            className="pl-9 bg-white/5 border-white/10 focus:border-white/25"
          />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((u) => (
          <div
            key={u.id}
            className={`glass-card rounded-lg p-4 flex items-center justify-between transition-colors ${
              selectedUser?.id === u.id ? 'border-white/20 bg-white/[0.06]' : ''
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm font-medium">@{sanitize(u.username)}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{u.id.substring(0, 8)}</span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: u.rank?.color + '22', color: u.rank?.color }}
              >
                {u.rank?.name ?? 'User'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Select
                value={selectedUser?.id === u.id ? selectedRankId : ''}
                onValueChange={(val) => {
                  setSelectedUser(u);
                  setSelectedRankId(val);
                }}
              >
                <SelectTrigger className="w-36 h-8 text-xs bg-white/5 border-white/10">
                  <SelectValue placeholder="Set rank" />
                </SelectTrigger>
                <SelectContent className="bg-[hsl(0,0%,7%)] border-white/10">
                  {ranks.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      <span style={{ color: r.color }}>{r.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedUser?.id === u.id && selectedRankId && (
                <Button
                  size="sm"
                  className="h-8 text-xs bg-white/10 hover:bg-white/15 border border-white/10"
                  onClick={() => {
                    onGiveRank(u.id, selectedRankId);
                    setSelectedUser(null);
                    setSelectedRankId('');
                  }}
                >
                  Apply
                </Button>
              )}
              {u.rank?.name !== 'User' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  onClick={() => onRemoveRank(u.id)}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================== PASTES SECTION ==================== */
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState<'title' | 'username' | 'uid'>('title');

  const getUsernameForPaste = (userId: string) => {
    const u = users.find((u) => u.id === userId);
    return u?.username ?? 'unknown';
  };

  const filtered = pastes.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    if (searchBy === 'title') return p.title.toLowerCase().includes(q);
    if (searchBy === 'username') return getUsernameForPaste(p.user_id).toLowerCase().includes(q);
    return p.user_id.toLowerCase().includes(q);
  });

  const pinnedPastes = filtered.filter((p) => p.pinned);
  const regularPastes = filtered.filter((p) => !p.pinned);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-bold">Pastes</h2>
      </div>

      {/* Search */}
      <div className="glass-card rounded-xl p-4 mb-4 flex gap-3 items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setSearchBy('title')}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${searchBy === 'title' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}
          >
            Title
          </button>
          <button
            onClick={() => setSearchBy('username')}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${searchBy === 'username' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}
          >
            Username
          </button>
          <button
            onClick={() => setSearchBy('uid')}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${searchBy === 'uid' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}
          >
            UID
          </button>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search by ${searchBy}...`}
            className="pl-9 bg-white/5 border-white/10 focus:border-white/25"
          />
        </div>
      </div>

      {/* Pinned Pastes */}
      {pinnedPastes.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Pin className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Pinned</h3>
          </div>
          <div className="space-y-2">
            {pinnedPastes.map((paste) => (
              <PasteRow key={paste.id} paste={paste} username={getUsernameForPaste(paste.user_id)} onDelete={onDelete} onPin={onPin} onUnpin={onUnpin} />
            ))}
          </div>
          <div className="my-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      )}

      {/* Regular Pastes */}
      <div className="space-y-2">
        {regularPastes.map((paste) => (
          <PasteRow key={paste.id} paste={paste} username={getUsernameForPaste(paste.user_id)} onDelete={onDelete} onPin={onPin} onUnpin={onUnpin} />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No pastes found</p>
        )}
      </div>
    </div>
  );
}

function PasteRow({
  paste,
  username,
  onDelete,
  onPin,
  onUnpin,
}: {
  paste: Paste;
  username: string;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onUnpin: (id: string) => void;
}) {
  const isPinned = paste.pinned ?? false;

  return (
    <div className="glass-card rounded-lg p-4 flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {isPinned && (
            <span className="pin-badge text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
              <Pin className="h-2.5 w-2.5" /> PINNED
            </span>
          )}
          <span className="text-sm font-medium truncate">{sanitize(paste.title)}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-1">
          by @{sanitize(username)} - {sanitize(paste.content.substring(0, 60))}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {!isPinned ? (
          <button
            onClick={() => onPin(paste.id)}
            className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-400/10 transition-colors"
            title="Pin paste"
          >
            <Pin className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={() => onUnpin(paste.id)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-white/5 transition-colors"
            title="Unpin paste"
          >
            <Pin className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => { if (confirm('Delete this paste?')) onDelete(paste.id); }}
          className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
          title="Delete paste"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ==================== LOOKUP SECTION ==================== */
function LookupSection({}: { users: ProfileWithRank[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState<'username' | 'uid'>('username');
  const [lookupUser, setLookupUser] = useState<ProfileWithRank | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [userWarnings, setUserWarnings] = useState<Warning[]>([]);
  const [userBans, setUserBans] = useState<Ban[]>([]);
  const [userPastes, setUserPastes] = useState<Paste[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);

    let foundUser: ProfileWithRank | null = null;

    if (searchBy === 'username') {
      const { data } = await supabase
        .from('profiles')
        .select('*, rank:ranks(*)')
        .eq('username', searchQuery.trim())
        .single();
      if (data) foundUser = data as unknown as ProfileWithRank;
    } else {
      const { data } = await supabase
        .from('profiles')
        .select('*, rank:ranks(*)')
        .eq('id', searchQuery.trim())
        .single();
      if (data) foundUser = data as unknown as ProfileWithRank;
    }

    setLookupUser(foundUser);

    if (foundUser) {
      const [sessionsRes, warningsRes, bansRes, pastesRes] = await Promise.all([
        supabase.rpc('admin_lookup_user_sessions', { target_uid: foundUser.id }),
        supabase.rpc('admin_lookup_warnings', { target_uid: foundUser.id }),
        supabase.from('bans').select('*').eq('user_id', foundUser.id).order('created_at', { ascending: false }),
        supabase.from('pastes').select('*').eq('user_id', foundUser.id).order('created_at', { ascending: false }),
      ]);

      if (sessionsRes.data) setSessions(sessionsRes.data);
      if (warningsRes.data) setUserWarnings(warningsRes.data);
      if (bansRes.data) setUserBans(bansRes.data);
      if (pastesRes.data) setUserPastes(pastesRes.data);
    }

    setLoading(false);
  };

  const copyField = (field: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Search className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-bold">Lookup</h2>
      </div>

      {/* Search */}
      <div className="glass-card rounded-xl p-4 mb-6 flex gap-3 items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setSearchBy('username')}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${searchBy === 'username' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}
          >
            Username
          </button>
          <button
            onClick={() => setSearchBy('uid')}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${searchBy === 'uid' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}
          >
            UID
          </button>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search by ${searchBy}...`}
            className="pl-9 bg-white/5 border-white/10 focus:border-white/25"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          />
        </div>
        <Button
          onClick={handleSearch}
          size="sm"
          className="bg-white/10 hover:bg-white/15 border border-white/10"
        >
          Search
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin h-6 w-6 border-2 border-white/20 border-t-white rounded-full" />
        </div>
      )}

      {!loading && !lookupUser && searchQuery && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">User not found</p>
        </div>
      )}

      {!loading && lookupUser && (
        <div className="space-y-4">
          {/* User Identity */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Identity</h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="Username" value={`@${lookupUser.username}`} field="username" copyField={copyField} copiedField={copiedField} />
              <InfoField label="UID" value={lookupUser.id} field="uid" copyField={copyField} copiedField={copiedField} mono />
              <InfoField label="Email" value={lookupUser.email || 'N/A'} field="email" copyField={copyField} copiedField={copiedField} />
              <InfoField label="Rank" value={lookupUser.rank?.name ?? 'User'} field="rank" copyField={copyField} copiedField={copiedField} rankColor={lookupUser.rank?.color} />
              <InfoField label="Joined" value={new Date(lookupUser.created_at).toLocaleString()} field="joined" copyField={copyField} copiedField={copiedField} />
              <InfoField label="Bio" value={lookupUser.bio || 'No bio'} field="bio" copyField={copyField} copiedField={copiedField} />
            </div>
          </div>

          {/* Device Sessions */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sessions & Device Info</h3>
            </div>
            {sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No session data available</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <div key={s.id} className="bg-white/[0.03] rounded-lg p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <InfoField label="IP Address" value={s.ip_address || 'N/A'} field={`ip-${s.id}`} copyField={copyField} copiedField={copiedField} mono />
                      <InfoField label="User Agent" value={s.user_agent || 'N/A'} field={`ua-${s.id}`} copyField={copyField} copiedField={copiedField} />
                      <InfoField label="Device" value={s.device_info || 'N/A'} field={`device-${s.id}`} copyField={copyField} copiedField={copiedField} />
                      <InfoField label="Last Active" value={new Date(s.last_active).toLocaleString()} field={`last-${s.id}`} copyField={copyField} copiedField={copiedField} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bans */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BanIcon className="h-4 w-4 text-red-400" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bans</h3>
              <span className="text-[10px] bg-red-400/15 text-red-400 px-2 py-0.5 rounded-full ml-auto">
                {userBans.length}
              </span>
            </div>
            {userBans.length === 0 ? (
              <p className="text-xs text-muted-foreground">No bans on record</p>
            ) : (
              <div className="space-y-2">
                {userBans.map((b) => (
                  <div key={b.id} className="bg-red-400/5 border border-red-400/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-900/30 text-red-400">
                        {b.shadowban ? 'SHADOWBAN' : 'BAN'}
                      </span>
                      <span className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-xs">{sanitize(b.reason)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warnings */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Warnings</h3>
              <span className="text-[10px] bg-amber-400/15 text-amber-400 px-2 py-0.5 rounded-full ml-auto">
                {userWarnings.length}
              </span>
            </div>
            {userWarnings.length === 0 ? (
              <p className="text-xs text-muted-foreground">No warnings on record</p>
            ) : (
              <div className="space-y-2">
                {userWarnings.map((w) => (
                  <div key={w.id} className="bg-amber-400/5 border border-amber-400/10 rounded-lg p-3">
                    <p className="text-xs text-amber-200">{sanitize(w.reason)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(w.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pastes */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pastes</h3>
              <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full ml-auto">
                {userPastes.length}
              </span>
            </div>
            {userPastes.length === 0 ? (
              <p className="text-xs text-muted-foreground">No pastes</p>
            ) : (
              <div className="space-y-2">
                {userPastes.map((p) => (
                  <div key={p.id} className="bg-white/[0.03] rounded-lg p-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {(p.pinned ?? false) && <Pin className="h-3 w-3 text-amber-400" />}
                        <span className="text-xs font-medium">{sanitize(p.title)}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleString()}</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{p.id.substring(0, 8)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({
  label,
  value,
  field,
  copyField,
  copiedField,
  mono,
  rankColor,
}: {
  label: string;
  value: string;
  field: string;
  copyField: (field: string, value: string) => void;
  copiedField: string | null;
  mono?: boolean;
  rankColor?: string;
}) {
  return (
    <div className="bg-white/[0.03] rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <button
          onClick={() => copyField(field, value)}
          className="ml-auto p-0.5 rounded hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
        >
          {copiedField === field ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
      <p className={`text-xs ${mono ? 'font-mono' : ''} ${rankColor ? '' : ''}`} style={rankColor ? { color: rankColor } : {}}>
        {value}
      </p>
    </div>
  );
}
