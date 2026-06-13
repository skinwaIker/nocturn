import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase, DEFAULT_AVATAR } from '@/lib/db';
import { sanitize } from '@/lib/sanitize';
import { uploadToLocalStorage } from '@/lib/fileUpload';
import { Upload, Save, User, Lock, Mail } from 'lucide-react';

export function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string>(() => profile?.avatar_url || '');
  const [bannerUrl, setBannerUrl] = useState<string>(() => profile?.banner_url || '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user || !profile) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const result = await uploadToLocalStorage(file, 'avatars', user.id);

    if (!result.success) {
      setMessage({ type: 'error', text: result.error || 'Upload failed' });
      setLoading(false);
      return;
    }

    const newUrl = `/img/avatars/${user.id}.${file.name.split('.').pop()}?t=${Date.now()}`;
    const { error } = await supabase.from('profiles').update({ avatar_url: newUrl }).eq('id', user.id);
    if (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
      return;
    }

    setAvatarUrl(newUrl);
    await refreshProfile();
    setMessage({ type: 'success', text: 'Avatar updated' });
    setLoading(false);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const result = await uploadToLocalStorage(file, 'banners', user.id);

    if (!result.success) {
      setMessage({ type: 'error', text: result.error || 'Upload failed' });
      setLoading(false);
      return;
    }

    const newUrl = `/img/banners/${user.id}.${file.name.split('.').pop()}?t=${Date.now()}`;
    const { error } = await supabase.from('profiles').update({ banner_url: newUrl }).eq('id', user.id);
    if (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
      return;
    }

    setBannerUrl(newUrl);
    await refreshProfile();
    setMessage({ type: 'success', text: 'Banner updated' });
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ bio: bio.trim() })
      .eq('id', user.id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      await refreshProfile();
      setMessage({ type: 'success', text: 'Profile saved' });
    }
    setLoading(false);
  };

  const handleEmailChange = async () => {
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      await supabase.from('profiles').update({ email: email.trim() }).eq('id', user.id);
      setMessage({ type: 'success', text: 'Email update requested. Check your inbox.' });
    }
    setLoading(false);
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password updated' });
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-6">Settings</h2>

      {message && (
        <div
          className={`mb-4 px-4 py-2.5 rounded-lg text-sm glass-card ${
            message.type === 'success' ? 'text-green-400 border-green-400/20' : 'text-red-400 border-red-400/20'
          }`}
        >
          {sanitize(message.text)}
        </div>
      )}

      <div className="space-y-6">
        <div className="glass-card rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Profile</h3>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Avatar</Label>
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 bg-white/5 flex items-center justify-center text-xl font-bold overflow-hidden rounded-xl border-2 border-white/10"
                style={{ borderColor: profile.rank?.color, borderWidth: 2 }}
              >
                <img src={avatarUrl || DEFAULT_AVATAR} alt="avatar" className="w-full h-full object-cover" />
              </div>
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild className="bg-white/5 border-white/10 hover:bg-white/10">
                  <span><Upload className="h-4 w-4 mr-1" /> Upload</span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={loading} />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Banner</Label>
            <div>
              <div className="h-20 mb-2 rounded-xl overflow-hidden bg-gradient-to-r from-white/5 to-white/10 border border-white/10">
                {bannerUrl && (
                  <img src={bannerUrl} alt="banner" className="w-full h-full object-cover" />
                )}
              </div>
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild className="bg-white/5 border-white/10 hover:bg-white/10">
                  <span><Upload className="h-4 w-4 mr-1" /> Upload Banner</span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} disabled={loading} />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell something about yourself..."
              maxLength={200}
              className="bg-white/5 border-white/10 focus:border-white/25"
            />
          </div>

          <Button onClick={handleSaveProfile} disabled={loading} size="sm" className="bg-white/10 hover:bg-white/15 border border-white/10">
            <Save className="h-4 w-4 mr-1" /> Save Profile
          </Button>
        </div>

        <div className="glass-card rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Account</h3>
          </div>

          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
            <div className="flex gap-2">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="bg-white/5 border-white/10 focus:border-white/25"
              />
              <Button onClick={handleEmailChange} disabled={loading} size="sm" variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10">
                Update
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">New Password</Label>
            <Input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              placeholder="New password"
              className="bg-white/5 border-white/10 focus:border-white/25"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Confirm New Password</Label>
            <div className="flex gap-2">
              <Input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                placeholder="Confirm password"
                className="bg-white/5 border-white/10 focus:border-white/25"
              />
              <Button onClick={handlePasswordChange} disabled={loading} size="sm" variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10">
                Update
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
