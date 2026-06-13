import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { sanitize } from '@/lib/sanitize';
import { supabase } from '@/lib/db';
import { FileText, Send } from 'lucide-react';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

export function AddPastePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>You must be signed in to create a paste.</p>
        <button onClick={() => navigate('/login')} className="text-white hover:underline mt-2 text-sm">
          Sign In
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent) {
      setError('Title and content are required');
      return;
    }

    const slug = slugify(trimmedTitle) + '-' + Date.now().toString(36);
    setLoading(true);

    const { data, error: insertError } = await supabase
      .from('pastes')
      .insert({
        title: trimmedTitle,
        slug,
        content: trimmedContent,
        user_id: user.id,
      })
      .select('slug')
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    navigate(`/p/${data.slug}`);
  };

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      <div className="w-64 shrink-0 border-r border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          <FileText className="h-4 w-4" /> New Paste
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Paste title..."
              required
              maxLength={120}
              className="bg-white/[0.04] border-white/[0.08] text-sm"
            />
          </div>
          <div className="flex-1" />
          {error && <p className="text-xs text-red-400">{sanitize(error)}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Publishing...' : 'Publish'}
          </Button>
        </form>
      </div>
      <div className="flex-1 p-0">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your paste content here..."
          className="w-full h-full resize-none border-0 rounded-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm font-mono p-6"
        />
      </div>
    </div>
  );
}
