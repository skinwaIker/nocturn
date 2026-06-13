import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FilePlus } from 'lucide-react';

export function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const pages = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Add Paste', path: '/add-paste', icon: FilePlus },
  ];

  return (
    <nav className="fixed top-0 left-56 right-0 h-12 glass-topbar flex items-center px-6 z-20">
      <div className="flex items-center gap-1">
        {pages.map((page) => (
          <button
            key={page.path}
            onClick={() => navigate(page.path)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === page.path
                ? 'bg-white/[0.08] text-white'
                : 'text-muted-foreground hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <page.icon className="h-4 w-4" />
            {page.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
