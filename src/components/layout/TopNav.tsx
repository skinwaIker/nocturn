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
    <nav className="fixed top-0 left-56 right-0 h-12 bg-[hsl(0,0%,5%)] border-b border-[hsl(0,0%,14.9%)] flex items-center px-6 z-20">
      <div className="flex items-center gap-1">
        {pages.map((page) => (
          <button
            key={page.path}
            onClick={() => navigate(page.path)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              location.pathname === page.path
                ? 'bg-[hsl(0,0%,12%)] text-white'
                : 'text-muted-foreground hover:text-white hover:bg-[hsl(0,0%,10%)]'
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
