import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sanitize } from '@/lib/sanitize';
import { UserPlus } from 'lucide-react';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!USERNAME_REGEX.test(username)) {
      setError('Username must be 3-20 characters, letters/numbers/underscores only');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const { error: err } = await signUp(email.trim(), password, username.trim());
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
              <UserPlus className="h-6 w-6 text-white" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-1 text-center">Create Account</h2>
          <p className="text-sm text-muted-foreground mb-6 text-center">Join the Nocturn community</p>
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
                className="bg-white/5 border-white/10 focus:border-white/25"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
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
                placeholder="Min 6 characters"
                required
                className="bg-white/5 border-white/10 focus:border-white/25"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                required
                className="bg-white/5 border-white/10 focus:border-white/25"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{sanitize(error)}</p>
            )}
            <Button type="submit" className="w-full bg-white/10 hover:bg-white/15 border border-white/10" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <button type="button" onClick={() => navigate('/login')} className="text-white hover:underline">
                Sign In
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
