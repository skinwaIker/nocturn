import { useEffect, useState } from 'react';
import { supabase, type Paste, type Profile } from '@/lib/db';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Clock, Pin } from 'lucide-react';
import { sanitize } from '@/lib/sanitize';

interface PasteWithAuthor extends Paste {
  author: Profile;
  comment_count: number;
}

export function HomePage() {
  const [pinnedPastes, setPinnedPastes] = useState<PasteWithAuthor[]>([]);
  const [pastes, setPastes] = useState<PasteWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPastes();
  }, []);

  const fetchPastes = async () => {
    const { data } = await supabase
      .from('pastes')
      .select('*, author:profiles(*, rank:ranks(*))')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      const pasteIds = data.map((p) => p.id);
      const { data: commentCounts } = await supabase
        .from('comments')
        .select('paste_id')
        .in('paste_id', pasteIds);

      const countMap: Record<string, number> = {};
      if (commentCounts) {
        commentCounts.forEach((c) => {
          countMap[c.paste_id] = (countMap[c.paste_id] || 0) + 1;
        });
      }

      const all = data.map((p) => ({
        ...p,
        pinned: p.pinned ?? false,
        author: p.author as unknown as Profile,
        comment_count: countMap[p.id] || 0,
      }));

      setPinnedPastes(all.filter((p) => p.pinned));
      setPastes(all.filter((p) => !p.pinned));
    }
    setLoading(false);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10 text-center">
        <img src="/logo.png" alt="Nocturn" className="mx-auto h-24 w-auto mb-4" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <h1 className="text-3xl font-bold tracking-widest gradient-text mb-4">NOCTURN</h1>
        <div className="space-y-1.5">
          <a
            href="https://t.me/nocturnhq"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-muted-foreground hover:text-white transition-colors"
          >
            Nocturn Telegram
          </a>
          <a
            href="https://discord.com/invite/W9s7UBS6m9"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-muted-foreground hover:text-white transition-colors"
          >
            Nocturn Discord
          </a>
        </div>
      </div>

      {pinnedPastes.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Pin className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Pinned</h2>
          </div>
          <div className="space-y-2">
            {pinnedPastes.map((paste) => (
              <button
                key={paste.id}
                onClick={() => navigate(`/p/${paste.slug}`)}
                className="w-full text-left glass-card-hover rounded-lg p-4 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="pin-badge text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Pin className="h-2.5 w-2.5" /> Pinned
                      </span>
                      <span className="font-semibold text-sm group-hover:text-white transition-colors">
                        {sanitize(paste.title)}
                      </span>
                      {paste.author?.rank && (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: paste.author.rank.color + '22',
                            color: paste.author.rank.color,
                          }}
                        >
                          {paste.author.rank.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {sanitize(paste.content.substring(0, 200))}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {paste.comment_count}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(paste.created_at)}
                    </div>
                    <span className="text-xs">@{sanitize(paste.author?.username ?? 'unknown')}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="my-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-xl font-bold">Recent Pastes</h2>
        <p className="text-sm text-muted-foreground mt-1">Latest shared content</p>
      </div>

      {pastes.length === 0 && pinnedPastes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">No pastes yet</p>
          <p className="text-sm mt-1">Be the first to share something</p>
        </div>
      ) : pastes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No regular pastes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pastes.map((paste) => (
            <button
              key={paste.id}
              onClick={() => navigate(`/p/${paste.slug}`)}
              className="w-full text-left glass-card-hover rounded-lg p-4 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm group-hover:text-white transition-colors">
                      {sanitize(paste.title)}
                    </span>
                    {paste.author?.rank && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: paste.author.rank.color + '22',
                          color: paste.author.rank.color,
                        }}
                      >
                        {paste.author.rank.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {sanitize(paste.content.substring(0, 200))}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {paste.comment_count}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(paste.created_at)}
                  </div>
                  <span className="text-xs">@{sanitize(paste.author?.username ?? 'unknown')}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
