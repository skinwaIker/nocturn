import { useAuth, useIsAdmin } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase, DEFAULT_AVATAR } from '@/lib/db';
import {
  Bell,
  Users,
  Settings,
  TrendingUp,
  HelpCircle,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Sidebar() {
  const { user, profile, signOut } = useAuth();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; read: boolean; created_at: string }>>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setNotifications(data);
    };
    fetchNotifs();
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const navItems = [
    { icon: Users, label: 'Users', path: '/users' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: TrendingUp, label: 'Rank Up', path: '/rank-up' },
    { icon: HelpCircle, label: 'Help', path: '/help' },
  ];

  const getAvatarUrl = () => profile?.avatar_url || '';

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-[hsl(0,0%,5%)] border-r border-[hsl(0,0%,14.9%)] flex flex-col z-30">
      <div className="p-4 border-b border-[hsl(0,0%,14.9%)]">
        <h1
          className="text-lg font-bold tracking-wider cursor-pointer hover:text-white/90 transition-colors"
          onClick={() => navigate('/')}
        >
          NOCTURN
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {user && profile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[hsl(0,0%,10%)] transition-colors text-left">
                <div
                  className="w-8 h-8 bg-[hsl(0,0%,15%)] flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0"
                  style={{ borderColor: profile.rank?.color, borderWidth: 2 }}
                >
                  <img
                    src={getAvatarUrl() || DEFAULT_AVATAR}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">@{profile.username}</span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: profile.rank?.color + '22', color: profile.rank?.color }}
                    >
                      {profile.rank?.name}
                    </span>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start" className="w-48 bg-[hsl(0,0%,7%)] border-[hsl(0,0%,14.9%)]">
              <DropdownMenuItem onClick={() => navigate(`/u/${profile.username}`)} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator className="bg-[hsl(0,0%,14.9%)]" />
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer text-red-400">
                    <Shield className="mr-2 h-4 w-4" /> Admin Panel
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator className="bg-[hsl(0,0%,14.9%)]" />
              <DropdownMenuItem onClick={async () => { await signOut(); navigate('/'); }} className="cursor-pointer text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="px-2 space-y-1">
            <button
              onClick={() => navigate('/login')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-[hsl(0,0%,10%)] transition-colors text-sm"
            >
              <LogIn className="h-4 w-4" /> Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-[hsl(0,0%,10%)] transition-colors text-sm"
            >
              <UserPlus className="h-4 w-4" /> Register
            </button>
          </div>
        )}

        <div className="mx-4 my-2 h-px bg-[hsl(0,0%,14.9%)]" />

        <div className="px-2 space-y-0.5">
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-[hsl(0,0%,10%)] transition-colors text-sm"
            >
              <div className="relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              Notifications
            </button>
            {notifOpen && (
              <div className="absolute left-0 top-full mt-1 w-full bg-[hsl(0,0%,7%)] border border-[hsl(0,0%,14.9%)] rounded-lg shadow-xl z-50 max-h-72 overflow-y-auto">
                <div className="p-3 border-b border-[hsl(0,0%,14.9%)] flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] text-muted-foreground hover:text-foreground">
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 border-b border-[hsl(0,0%,10%)] text-xs ${!n.read ? 'bg-[hsl(0,0%,10%)]' : ''}`}
                    >
                      {n.message}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm ${
                location.pathname === item.path
                  ? 'bg-[hsl(0,0%,12%)] text-white'
                  : 'hover:bg-[hsl(0,0%,10%)] text-muted-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 border-t border-[hsl(0,0%,14.9%)] text-[10px] text-muted-foreground text-center">
        Nocturn Forum
      </div>
    </aside>
  );
}
