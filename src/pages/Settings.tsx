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
import { Upload, Save } from 'lucide-react';

export function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    const userId = user?.id;
    if (userId) {
      return `/avatars/${userId}`;
    }
    return '';
  });
  const [bannerUrl, setBannerUrl] = useState<string>(() => {
    const userId = user?.id;
    if (userId) {
      return `/banners/${userId}`;
    }
    return '';
  });
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

    setAvatarUrl(`/avatars/${user.id}.${file.name.split('.').pop()}?t=${Date.now()}`);
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

    setBannerUrl(`/banners/${user.id}.${file.name.split('.').pop()}?t=${Date.now()}`);
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
          className={`mb-4 px-4 py-2 rounded text-sm ${
            message.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
          }`}
        >
          {sanitize(message.text)}
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-[hsl(0,0%,5.9%)] border border-[hsl(0,0%,14.9%)] rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-semibold">Profile</h3>

          <div className="space-y-2">
            <Label className="text-xs">Avatar</Label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[hsl(0,0%,12%)] flex items-center justify-center text-xl font-bold overflow-hidden"
                style={{ borderColor: profile.rank?.color, borderWidth: 2 }}
              >
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" onError={(e) => {
                  e.currentTarget.src = DEFAULT_AVATAR;
                }} />
              </div>
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span><Upload className="h-4 w-4 mr-1" /> Upload</span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={loading} />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Banner</Label>
            <div>
              <div className="h-20 mb-2 rounded overflow-hidden bg-[hsl(0,0%,8%)]">
                <img src={bannerUrl} alt="banner" className="w-full h-full object-cover" onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }} />
              </div>
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
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
              className="bg-[hsl(0,0%,7%)] border-[hsl(0,0%,14.9%)] text-sm"
            />
          </div>

          <Button onClick={handleSaveProfile} disabled={loading} size="sm">
            <Save className="h-4 w-4 mr-1" /> Save Profile
          </Button>
        </div>

        <div className="bg-[hsl(0,0%,5.9%)] border border-[hsl(0,0%,14.9%)] rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-semibold">Account</h3>

          <div className="space-y-2">
            <Label className="text-xs">Email</Label>
            <div className="flex gap-2">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="bg-[hsl(0,0%,7%)] border-[hsl(0,0%,14.9%)] text-sm"
              />
              <Button onClick={handleEmailChange} disabled={loading} size="sm" variant="outline">
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
              className="bg-[hsl(0,0%,7%)] border-[hsl(0,0%,14.9%)] text-sm"
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
                className="bg-[hsl(0,0%,7%)] border-[hsl(0,0%,14.9%)] text-sm"
              />
              <Button onClick={handlePasswordChange} disabled={loading} size="sm" variant="outline">
                Update
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
