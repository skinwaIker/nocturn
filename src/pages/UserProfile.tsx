import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, DEFAULT_AVATAR, type Profile, type Paste, type Rank } from '@/lib/db';
import { sanitize } from '@/lib/sanitize';
import {
  Clock,
  MessageSquare,
  FileText,
  CalendarDays,
  Fingerprint,
  Copy,
  Check,
  Pin,
} from 'lucide-react';

type ProfileWithRank = Profile & { rank: Rank };

interface PasteWithCount extends Paste {
  comment_count: number;
}

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<ProfileWithRank | null>(null);
  const [pastes, setPastes] = useState<PasteWithCount[]>([]);
  const [commentTotal, setCommentTotal] = useState(0);
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
      setPastes(pastesRes.data.map((p) => ({ ...p, comment_count: countMap[p.id] || 0 })));
    }

    if (commentCountRes.count !== null) {
      setCommentTotal(commentCountRes.count);
    }

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
  const rankColor = profile.rank?.color || '#ffffff';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero banner section */}
      <div className="relative rounded-xl overflow-hidden border border-white/10">
        <div className="h-44 overflow-hidden bg-gradient-to-br from-white/[0.03] to-white/[0.01]">
          {bannerUrl ? (
            <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0,0%,3.9%)] via-[hsl(0,0%,3.9%)]/60 to-transparent" />
        </div>

        <div className="relative px-6 pb-6">
          <div className="flex items-end gap-5 -mt-12">
            <div
              className="w-24 h-24 rounded-2xl overflow-hidden border-2 shrink-0 bg-[hsl(0,0%,8%)] backdrop-blur-sm shadow-lg shadow-black/40"
              style={{ borderColor: rankColor }}
            >
              <img
                src={avatarUrl || DEFAULT_AVATAR}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight truncate">
                  @{sanitize(profile.username)}
                </h2>
                <span
                  className="text-[11px] font-bold px-2.5 py-1 rounded-md backdrop-blur-sm"
                  style={{
                    backgroundColor: rankColor + '22',
                    color: rankColor,
                    border: `1px solid ${rankColor}33`,
                  }}
                >
                  {profile.rank?.name ?? 'User'}
                </span>
              </div>
              {profile.bio && (
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                  {sanitize(profile.bio)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard icon={Fingerprint} label="UID" value={profile.id.substring(0, 8)} mono action={
          <button onClick={copyUid} className="ml-1 p-1 rounded-md hover:bg-white/10 transition-colors text-muted-foreground hover:text-white">
            {copiedUid ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
          </button>
        } />
        <StatCard icon={CalendarDays} label="Joined" value={formatDate(profile.created_at)} />
        <StatCard icon={FileText} label="Pastes" value={String(pastes.length)} mono />
        <StatCard icon={MessageSquare} label="Comments" value={String(commentTotal)} mono />
      </div>

      {/* Pastes section */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl backdrop-blur-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Pastes
          </h3>
          <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">
            {pastes.length}
          </span>
        </div>

        {pastes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No pastes yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pastes.map((paste) => (
              <button
                key={paste.id}
                onClick={() => navigate(`/p/${paste.slug}`)}
                className="w-full text-left bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 hover:border-white/15 transition-all group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {paste.pinned && <Pin className="h-3 w-3 text-white/40 shrink-0" />}
                    <span className="text-sm font-semibold group-hover:text-white transition-colors truncate">
                      {sanitize(paste.title)}
                    </span>
                  </div>
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
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  mono,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl backdrop-blur-sm p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`text-sm ${mono ? 'font-mono' : 'font-medium'} text-white/90`}>{value}</span>
        {action}
      </div>
    </div>
  );
}
