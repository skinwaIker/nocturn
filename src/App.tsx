import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';
import { HomePage } from '@/pages/Home';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { AddPastePage } from '@/pages/AddPaste';
import { PasteViewPage } from '@/pages/PasteView';
import { UsersPage } from '@/pages/Users';
import { UserProfilePage } from '@/pages/UserProfile';
import { SettingsPage } from '@/pages/Settings';
import { RankUpPage } from '@/pages/RankUp';
import { HelpPage } from '@/pages/Help';
import { AdminPage } from '@/pages/Admin';
import { Toaster } from '@/components/ui/sonner';

function Layout() {
  return (
    <div className="min-h-screen bg-[hsl(0,0%,3.9%)]">
      <Sidebar />
      <TopNav />
      <main className="ml-56 mt-12 p-6">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/add-paste" element={<AddPastePage />} />
            <Route path="/p/:slug" element={<PasteViewPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/u/:username" element={<UserProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/rank-up" element={<RankUpPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Routes>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}
