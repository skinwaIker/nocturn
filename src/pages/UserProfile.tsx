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

  return (
    <div className="flex gap-6">
      {/* Left column: Info blocks */}
      <div className="w-80 shrink-0 space-y-4">
        {/* Block 1: Avatar + Identity */}
        <div className="bg-[hsl(0,0%,5.9%)] border border-[hsl(0,0%,14.9%)] rounded-lg overflow-hidden">
          <div className="h-24 overflow-hidden bg-[hsl(0,0%,8%)]">
            {bannerUrl && (
              <img
                src={bannerUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="-mt-8 p-5">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-[hsl(0,0%,8%)] flex items-center justify-center text-3xl font-bold overflow-hidden shrink-0">
                <img
                  src={avatarUrl || DEFAULT_AVATAR}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h2 className="text-lg font-bold tracking-tight truncate">
                  @{sanitize(profile.username)}
                </h2>
                <span
                  className="inline-block text-[10px] font-bold px-2 py-0.5 rounded mt-1"
                  style={{
                    backgroundColor: profile.rank?.color + '22',
                    color: profile.rank?.color,
                  }}
                >
                  {profile.rank?.name ?? 'User'}
                </span>
              </div>
            </div>
            {profile.bio && (
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                {sanitize(profile.bio)}
              </p>
            )}
            {!profile.bio && (
              <p className="text-xs text-muted-foreground/40 mt-4 italic">No bio set</p>
            )}
          </div>
        </div>

        {/* Block 2: Stats */}
        <div className="bg-[hsl(0,0%,5.9%)] border border-[hsl(0,0%,14.9%)] rounded-lg p-5 space-y-3">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Information
          </h3>
          <StatRow icon={Fingerprint} label="UID">
            <span className="font-mono text-xs text-muted-foreground">{profile.id.substring(0, 8)}</span>
            <button
              onClick={copyUid}
              className="ml-1.5 p-0.5 rounded hover:bg-[hsl(0,0%,12%)] transition-colors text-muted-foreground hover:text-white"
            >
              {copiedUid ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
            </button>
          </StatRow>
          <StatRow icon={CalendarDays} label="Joined">
            <span className="text-xs text-muted-foreground">{formatDate(profile.created_at)}</span>
          </StatRow>
          <StatRow icon={FileText} label="Pastes">
            <span className="text-xs font-mono">{pastes.length}</span>
          </StatRow>
          <StatRow icon={MessageSquare} label="Comments">
            <span className="text-xs font-mono">{commentTotal}</span>
          </StatRow>
        </div>
      </div>

      {/* Right column: Pastes */}
      <div className="flex-1 min-w-0">
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
          <div className="text-center py-16 text-muted-foreground bg-[hsl(0,0%,5.9%)] border border-[hsl(0,0%,14.9%)] rounded-lg">
            <FileText className="h-8 w-8 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No pastes yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pastes.map((paste) => (
              <button
                key={paste.id}
                onClick={() => navigate(`/p/${paste.slug}`)}
                className="w-full text-left bg-[hsl(0,0%,5.9%)] border border-[hsl(0,0%,14.9%)] rounded-lg p-4 hover:border-[hsl(0,0%,25%)] transition-all group"
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
    </div>
  );
}

function StatRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-6 h-6 rounded bg-[hsl(0,0%,10%)] flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-16 shrink-0">
        {label}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
