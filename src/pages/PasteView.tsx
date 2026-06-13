import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, type Paste, type Profile, type Comment } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { sanitize } from '@/lib/sanitize';
import { Clock, MessageSquare, Send, Trash2, ArrowLeft, Pin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface PasteWithAuthor extends Paste {
  author: Profile & { rank?: { name: string; color: string } };
}

export function PasteViewPage() {
  const { slug } = useParams<{ slug: string }>();
  const [paste, setPaste] = useState<PasteWithAuthor | null>(null);
  const [comments, setComments] = useState<(Comment & { author: Profile & { rank?: { name: string; color: string } } })[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (slug) fetchPaste();
  }, [slug]);

  const fetchPaste = async () => {
    const { data } = await supabase
      .from('pastes')
      .select('*, author:profiles(*, rank:ranks(*))')
      .eq('slug', slug)
      .single();

    if (data) {
      setPaste(data as unknown as PasteWithAuthor);
      fetchComments(data.id);
    }
    setLoading(false);
  };

  const fetchComments = async (pasteId: string) => {
    const { data } = await supabase
      .from('comments')
      .select('*, author:profiles(*, rank:ranks(*))')
      .eq('paste_id', pasteId)
      .order('created_at', { ascending: true });

    if (data) setComments(data as unknown as typeof comments);
  };

  const handleComment = async () => {
    if (!user || !paste || !newComment.trim()) return;
    setSubmitting(true);

    await supabase.from('comments').insert({
      paste_id: paste.id,
      user_id: user.id,
      content: newComment.trim(),
    });

    await supabase.from('notifications').insert({
      user_id: paste.user_id,
      type: 'comment',
      message: `@${profile?.username} commented on your paste "${paste.title}"`,
      related_id: paste.id,
    });

    setNewComment('');
    fetchComments(paste.id);
    setSubmitting(false);
  };

  const handleDeletePaste = async () => {
    if (!paste) return;
    await supabase.from('pastes').delete().eq('id', paste.id);
    navigate('/');
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  if (!paste) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Paste not found</p>
        <button onClick={() => navigate('/')} className="text-white hover:underline mt-2 text-sm">
          Go Home
        </button>
      </div>
    );
  }

  const isOwner = user?.id === paste.user_id;
  const isPinned = paste.pinned ?? false;

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
            <button onClick={() => navigate('/')} className="flex items-center gap-1 hover:text-white transition-colors">
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">{sanitize(paste.title)}</h1>
                {isPinned && (
                  <span className="pin-badge text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Pin className="h-2.5 w-2.5" /> Pinned
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span
                  className="font-semibold cursor-pointer hover:underline"
                  style={{ color: paste.author?.rank?.color }}
                  onClick={() => navigate(`/u/${paste.author?.username}`)}
                >
                  @{sanitize(paste.author?.username ?? 'unknown')}
                </span>
                {paste.author?.rank && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: paste.author.rank.color + '22', color: paste.author.rank.color }}
                  >
                    {paste.author.rank.name}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {formatDate(paste.created_at)}
                </div>
              </div>
            </div>
            {isOwner && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card border-white/10">
                  <DialogHeader>
                    <DialogTitle>Delete Paste</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">Are you sure you want to delete this paste? This cannot be undone.</p>
                  <div className="flex gap-2 mt-4">
                    <Button variant="destructive" onClick={handleDeletePaste}>Delete</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <pre className="whitespace-pre-wrap text-sm leading-relaxed glass-card rounded-xl p-6 font-mono">
            {sanitize(paste.content)}
          </pre>
        </div>
      </div>

      <div className="w-80 shrink-0 glass-sidebar flex flex-col">
        <div className="p-3 border-b border-white/10 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          Comments ({comments.length})
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {comments.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">No comments yet</p>
          )}
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-semibold cursor-pointer hover:underline"
                  style={{ color: comment.author?.rank?.color }}
                  onClick={() => navigate(`/u/${comment.author?.username}`)}
                >
                  @{sanitize(comment.author?.username ?? 'unknown')}
                </span>
                {comment.author?.rank && (
                  <span
                    className="text-[9px] font-bold px-1 py-0.5 rounded"
                    style={{ backgroundColor: comment.author.rank.color + '22', color: comment.author.rank.color }}
                  >
                    {comment.author.rank.name}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {formatDate(comment.created_at)}
                </span>
              </div>
              <p className="text-xs leading-relaxed">{sanitize(comment.content)}</p>
            </div>
          ))}
        </div>

        {user && (
          <div className="p-3 border-t border-white/10">
            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="min-h-[60px] bg-white/5 border-white/10 text-xs resize-none focus:border-white/25"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleComment();
                  }
                }}
              />
            </div>
            <Button
              onClick={handleComment}
              disabled={submitting || !newComment.trim()}
              size="sm"
              className="w-full mt-2 bg-white/10 hover:bg-white/15 border border-white/10"
            >
              <Send className="h-3 w-3 mr-1" />
              {submitting ? 'Sending...' : 'Comment'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
