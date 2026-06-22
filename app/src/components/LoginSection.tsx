import { useState } from 'react';
import { LogIn, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from './AuthModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface LoginSectionProps {
  isExpanded?: boolean;
}

export function LoginSection({ isExpanded = true }: LoginSectionProps) {
  const { user, getInitials, logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogoutClick = async () => {
    setIsMenuOpen(false);
    setIsLogoutDialogOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLogoutDialogOpen(false);
    await logout();
  };

  // Collapsed state - logged in
  if (!isExpanded && user) {
    return (
      <>
        <button
          onClick={handleLogoutClick}
          title={user.name || user.email}
          className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-[12px] font-semibold hover:shadow-[0_2px_8px_rgba(79,70,229,0.4)] transition-all duration-200"
        >
          {getInitials(user.name || user.email)}
        </button>
        <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Log out?</AlertDialogTitle>
              <AlertDialogDescription>
                If you log out, your conversation history might be lost unless you have a saved account backup.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-3">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmLogout} className="bg-red-600 hover:bg-red-700">
                Log out
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Collapsed state - logged out
  if (!isExpanded && !user) {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-8 h-8 rounded-lg text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F5F5F7] dark:hover:bg-[#374151] flex items-center justify-center transition-colors duration-200"
          aria-label="Sign in"
          title="Sign in"
        >
          <LogIn size={18} />
        </button>
        <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  // Expanded state - logged in
  if (isExpanded && user) {
    return (
      <>
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[#F5F5F7] dark:hover:bg-[#374151] transition-colors duration-200 group justify-between"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-[13px] font-semibold shrink-0">
                {getInitials(user.name || user.email)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <span className="text-[13px] text-[#374151] dark:text-[#D1D5DB] group-hover:text-[#111827] dark:group-hover:text-[#F3F4F6] truncate block">
                  {user.name || user.email}
                </span>
              </div>
            </div>
            <ChevronDown size={16} className={`text-[#6B7280] dark:text-[#9CA3AF] transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown menu */}
          {isMenuOpen && (
            <div className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-[#374151] rounded-lg shadow-lg border border-[#E5E7EB] dark:border-[#4B5563] overflow-hidden z-50">
              <button
                onClick={handleLogoutClick}
                className="w-full px-3 py-2.5 text-[13px] text-left flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={16} />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>

        <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Log out?</AlertDialogTitle>
              <AlertDialogDescription>
                If you log out, your conversation history might be lost unless you have a saved account backup.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-3">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmLogout} className="bg-red-600 hover:bg-red-700">
                Log out
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Expanded state - logged out
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[14px] text-[#374151] dark:text-[#D1D5DB] hover:bg-[#F5F5F7] dark:hover:bg-[#374151] hover:text-[#111827] dark:hover:text-[#F3F4F6] transition-colors duration-200 group"
      >
        <LogIn size={16} className="text-[#6B7280] dark:text-[#9CA3AF]" />
        <span className="font-medium">Log In</span>
      </button>
      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
