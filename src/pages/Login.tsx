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
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await signIn(username.trim(), password);
    if (err) {
      setError(err);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-sm mx-auto mt-16">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 mb-4">
          <LogIn className="h-5 w-5 text-white/70" />
        </div>
        <h2 className="text-xl font-bold">Sign In</h2>
        <p className="text-xs text-muted-foreground mt-1">Enter your username and password</p>
      </div>
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
            maxLength={20}
            className="bg-white/5 border-white/10 backdrop-blur-sm"
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
            className="bg-white/5 border-white/10 backdrop-blur-sm"
          />
        </div>
        {error && (
          <p className="text-sm text-red-400">{sanitize(error)}</p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
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
  );
}
