import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sanitize } from '@/lib/sanitize';
import { LogIn } from 'lucide-react';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signInWithUsername } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await signInWithUsername(username.trim(), password);
    if (err) {
      setError(err);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3rem)]">
      <div className="w-full max-w-sm mx-auto">
        <div className="glass-card p-8 rounded-xl border border-white/10">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10">
              <LogIn className="h-6 w-6 text-white" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-1 text-center">Sign In</h2>
          <p className="text-sm text-muted-foreground mb-6 text-center">Enter your credentials to continue</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                required
                className="bg-white/5 border-white/10 focus:border-white/25"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                className="bg-white/5 border-white/10 focus:border-white/25"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{sanitize(error)}</p>
            )}
            <Button type="submit" className="w-full bg-white/10 hover:bg-white/15 border border-white/10" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{' '}
              <button type="button" onClick={() => navigate('/register')} className="text-white hover:underline">
                Register
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
