import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, DEFAULT_AVATAR, type Profile, type Paste, type Rank, type Warning } from '@/lib/db';
import { sanitize } from '@/lib/sanitize';
import {
  Clock,
  MessageSquare,
  FileText,
  CalendarDays,
  Fingerprint,
  Copy,
  Shield,
  AlertTriangle,
} from 'lucide-react';

type ProfileWithRank = Profile & { rank: Rank };

interface PasteWithCount extends Paste {
  comment_count: number;
}

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<ProfileWithRank | null>(null);
  const [pastes, setPastes] = useState<PasteWithCount[]>([]);
  const [pinnedPastes, setPinnedPastes] = useState<PasteWithCount[]>([]);
  const [commentTotal, setCommentTotal] = useState(0);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedUid, setCopiedUid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (username) fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*, rank:ranks(*)')
      .eq('username', username)
      .single();

    if (!profileData) {
      setLoading(false);
      return;
    }

    setProfile(profileData as unknown as ProfileWithRank);

    const [pastesRes, commentCountRes] = await Promise.all([
      supabase
        .from('pastes')
        .select('*')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profileData.id),
    ]);

    if (pastesRes.data) {
      const ids = pastesRes.data.map((p) => p.id);
      const { data: comments } = await supabase
        .from('comments')
        .select('paste_id')
        .in('paste_id', ids.length > 0 ? ids : ['00000000-0000-0000-0000-000000000000']);

      const countMap: Record<string, number> = {};
      if (comments) {
        comments.forEach((c) => {
          countMap[c.paste_id] = (countMap[c.paste_id] || 0) + 1;
        });
      }
      const allPastes = pastesRes.data.map((p) => ({
        ...p,
        pinned: p.pinned ?? false,
        comment_count: countMap[p.id] || 0,
      }));
      setPinnedPastes(allPastes.filter((p) => p.pinned));
      setPastes(allPastes.filter((p) => !p.pinned));
    }

    if (commentCountRes.count !== null) {
      setCommentTotal(commentCountRes.count);
    }

    const { data: warnsData } = await supabase
      .from('warnings')
      .select('*')
      .eq('user_id', profileData.id)
      .order('created_at', { ascending: false });

    if (warnsData) setWarnings(warnsData);

    setLoading(false);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const formatRelative = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return formatDate(date);
  };

  const copyUid = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.id);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const getAvatarUrl = () => profile?.avatar_url || '';
  const getBannerUrl = () => profile?.banner_url || '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>User not found</p>
        <button onClick={() => navigate('/')} className="text-white hover:underline mt-2 text-sm">
          Go Home
        </button>
      </div>
    );
  }

  const bannerUrl = getBannerUrl();
  const avatarUrl = getAvatarUrl();

  return (
    <div className="max-w-5xl mx-auto">
      {/* Banner Section */}
      <div className="relative glass-card rounded-xl overflow-hidden mb-6">
        <div className="h-40 overflow-hidden bg-gradient-to-r from-white/5 to-white/10 relative">
          {bannerUrl ? (
            <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-white/[0.06]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Profile info overlaid on banner */}
        <div className="relative px-6 pb-6 -mt-12">
          <div className="flex items-end gap-5">
            <div className="w-24 h-24 rounded-2xl bg-black/40 backdrop-blur-sm flex items-center justify-center text-3xl font-bold overflow-hidden shrink-0 border-2 border-white/10 shadow-xl">
              <img
                src={avatarUrl || DEFAULT_AVATAR}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold tracking-tight">
                  @{sanitize(profile.username)}
                </h2>
                <span
                  className="text-[11px] font-bold px-2.5 py-1 rounded-md"
                  style={{
                    backgroundColor: profile.rank?.color + '22',
                    color: profile.rank?.color,
                    border: `1px solid ${profile.rank?.color}33`,
                  }}
                >
                  {profile.rank?.name ?? 'User'}
                </span>
              </div>
              {profile.bio && (
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {sanitize(profile.bio)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard icon={Fingerprint} label="UID" value={profile.id.substring(0, 8)} mono onClick={copyUid} clickable />
        <StatCard icon={CalendarDays} label="Joined" value={formatDate(profile.created_at)} />
        <StatCard icon={FileText} label="Pastes" value={String(pastes.length + pinnedPastes.length)} mono />
        <StatCard icon={MessageSquare} label="Comments" value={String(commentTotal)} mono />
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="glass-card rounded-xl p-5 mb-6 border-amber-500/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-400">Active Warnings</h3>
            <span className="text-[10px] bg-amber-400/15 text-amber-400 px-2 py-0.5 rounded-full ml-auto">
              {warnings.length}
            </span>
          </div>
          <div className="space-y-2">
            {warnings.map((w) => (
              <div key={w.id} className="bg-amber-400/5 border border-amber-400/10 rounded-lg p-3">
                <p className="text-xs text-amber-200">{sanitize(w.reason)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{formatDate(w.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pinned Pastes */}
      {pinnedPastes.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Pinned Pastes</h3>
          </div>
          <div className="space-y-2">
            {pinnedPastes.map((paste) => (
              <button
                key={paste.id}
                onClick={() => navigate(`/p/${paste.slug}`)}
                className="w-full text-left glass-card-hover rounded-lg p-4 group"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold group-hover:text-white transition-colors truncate">
                    {sanitize(paste.title)}
                  </span>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground shrink-0">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {paste.comment_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelative(paste.created_at)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                  {sanitize(paste.content.substring(0, 250))}
                </p>
              </button>
            ))}
          </div>
          <div className="my-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      )}

      {/* Regular Pastes */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Pastes
          </h3>
          <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">
            {pastes.length}
          </span>
        </div>

        {pastes.length === 0 && pinnedPastes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground glass-card rounded-xl">
            <FileText className="h-8 w-8 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No pastes yet</p>
          </div>
        ) : pastes.length === 0 ? null : (
          <div className="space-y-2">
            {pastes.map((paste) => (
              <button
                key={paste.id}
                onClick={() => navigate(`/p/${paste.slug}`)}
                className="w-full text-left glass-card-hover rounded-lg p-4 group"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold group-hover:text-white transition-colors truncate">
                    {sanitize(paste.title)}
                  </span>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground shrink-0">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {paste.comment_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelative(paste.created_at)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                  {sanitize(paste.content.substring(0, 250))}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {copiedUid && (
        <div className="fixed bottom-6 right-6 glass-card rounded-lg px-4 py-2 text-sm text-green-400 border-green-400/20 z-50 animate-in fade-in slide-in-from-bottom-2">
          UID copied!
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  mono,
  onClick,
  clickable,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
  onClick?: () => void;
  clickable?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`glass-card rounded-xl p-4 text-left ${clickable ? 'cursor-pointer hover:bg-white/[0.06] transition-colors' : 'cursor-default'}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={`text-sm font-semibold ${mono ? 'font-mono' : ''}`}>
        {value}
        {label === 'UID' && (
          <span className="ml-1.5 text-muted-foreground">
            {clickable ? <Copy className="h-3 w-3 inline" /> : null}
          </span>
        )}
      </p>
    </button>
  );
}
