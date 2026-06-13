import { useEffect, useState } from 'react';
import { useAuth, useIsAdmin } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase, type Profile, type Paste, type Rank, type Ban } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ProfileWithRank = Profile & { rank: Rank };

export function AdminPage() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
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

  const handleDeletePaste = async (pasteId: string) => {
    await supabase.from('pastes').delete().eq('id', pasteId);
    fetchData();
  };

  const handleGiveRank = async (userId: string, rankId: string) => {
    await supabase.from('profiles').update({ rank_id: rankId }).eq('id', userId);
    fetchData();
  };

  const handleRenameUser = async (userId: string, newName: string) => {
    if (!newName.trim()) return;
    const { error } = await supabase.from('profiles').update({ username: newName.trim() }).eq('id', userId);
    if (error) alert(error.message);
    else fetchData();
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-5 w-5 text-red-400" />
        <h2 className="text-xl font-bold">Admin Panel</h2>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-[hsl(0,0%,7%)] border-[hsl(0,0%,14.9%)]">
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-3.5 w-3.5" /> Users
          </TabsTrigger>
          <TabsTrigger value="pastes" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Pastes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="bg-[hsl(0,0%,5.9%)] border border-[hsl(0,0%,14.9%)] rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
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
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-900/30 text-yellow-400">SHADOWBANNED</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 text-yellow-400 hover:text-yellow-300">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[hsl(0,0%,7%)] border-[hsl(0,0%,14.9%)]">
                    <DialogHeader>
                      <DialogTitle>Shadowban @{sanitize(u.username)}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">This user will not know they are shadowbanned.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShadowban(u.id)}
                      className="mt-2 border-yellow-600 text-yellow-400"
                    >
                      Confirm Shadowban
                    </Button>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 text-red-400 hover:text-red-300">
                      <BanIcon className="h-3.5 w-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[hsl(0,0%,7%)] border-[hsl(0,0%,14.9%)]">
                    <DialogHeader>
                      <DialogTitle>Ban @{sanitize(u.username)}</DialogTitle>
                    </DialogHeader>
                    <BanForm userId={u.id} onBan={handleBan} />
                  </DialogContent>
                </Dialog>

                {(isBanned(u.id) || isShadowbanned(u.id)) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-green-400 hover:text-green-300"
                    onClick={() => handleUnban(u.id)}
                  >
                    Unban
                  </Button>
                )}

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 text-blue-400 hover:text-blue-300">
                      <Award className="h-3.5 w-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[hsl(0,0%,7%)] border-[hsl(0,0%,14.9%)]">
                    <DialogHeader>
                      <DialogTitle>Set Rank for @{sanitize(u.username)}</DialogTitle>
                    </DialogHeader>
                    <Select onValueChange={(val) => handleGiveRank(u.id, val)}>
                      <SelectTrigger className="bg-[hsl(0,0%,7%)] border-[hsl(0,0%,14.9%)]">
                        <SelectValue placeholder="Select rank" />
                      </SelectTrigger>
                      <SelectContent className="bg-[hsl(0,0%,7%)] border-[hsl(0,0%,14.9%)]">
                        {ranks.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            <span style={{ color: r.color }}>{r.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-white">
                      <PenLine className="h-3.5 w-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[hsl(0,0%,7%)] border-[hsl(0,0%,14.9%)]">
                    <DialogHeader>
                      <DialogTitle>Rename @{sanitize(u.username)}</DialogTitle>
                    </DialogHeader>
                    <RenameForm userId={u.id} onRename={handleRenameUser} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="pastes" className="space-y-2">
          {pastes.map((paste) => (
            <div
              key={paste.id}
              className="bg-[hsl(0,0%,5.9%)] border border-[hsl(0,0%,14.9%)] rounded-lg p-4 flex items-center justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{sanitize(paste.title)}</p>
                <p className="text-xs text-muted-foreground truncate">{sanitize(paste.content.substring(0, 80))}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 shrink-0"
                onClick={() => {
                  if (confirm('Delete this paste?')) handleDeletePaste(paste.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {pastes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No pastes</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BanForm({ userId, onBan }: { userId: string; onBan: (id: string, reason: string) => void }) {
  const [reason, setReason] = useState('');
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs">Reason</Label>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for ban..."
          className="bg-[hsl(0,0%,7%)] border-[hsl(0,0%,14.9%)] text-sm"
        />
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => onBan(userId, reason)}
      >
        Confirm Ban
      </Button>
    </div>
  );
}

function RenameForm({ userId, onRename }: { userId: string; onRename: (id: string, name: string) => void }) {
  const [name, setName] = useState('');
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs">New Username</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New username..."
          maxLength={20}
          className="bg-[hsl(0,0%,7%)] border-[hsl(0,0%,14.9%)] text-sm"
        />
      </div>
      <Button
        size="sm"
        onClick={() => onRename(userId, name)}
      >
        Rename
      </Button>
    </div>
  );
}
