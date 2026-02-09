import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart3,
  Users,
  Calendar,
  Globe,
  UserCheck,
  LogOut,
  X,
  Mail,
  Ticket as TicketIcon,
  BookOpen,
  Home
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activePage?: string;
}

const navigationItems = [
  { name: 'Overview', icon: Home, path: '/admin' },
  { name: 'Stats', icon: BarChart3, path: '/admin?tab=stats' },
  { name: 'Users', icon: Users, path: '/admin?tab=users' },
  { name: 'Events', icon: Calendar, path: '/admin?tab=events' },
  { name: 'Courses', icon: BookOpen, path: '/admin?tab=courses' },
  { name: 'Magazines', icon: BookOpen, path: '/admin/magazines' },
  { name: 'Enrollments', icon: UserCheck, path: '/admin?tab=enrollments' },
  { name: 'Fields', icon: Globe, path: '/admin?tab=fields' },
  { name: 'Messages', icon: Mail, path: '/admin?tab=messages' },
  { name: 'Tickets', icon: TicketIcon, path: '/admin?tab=tickets' },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose, activePage = '/admin' }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-30 h-screen border-r bg-card/95 backdrop-blur-md transition-all duration-300 lg:translate-x-0",
      "w-full lg:w-64",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* NEW ERA Header */}
      <div className="p-4 lg:p-6 border-b bg-gradient-to-r from-primary/10 to-purple-500/10">
        <div className="flex items-center justify-between lg:justify-center">
          <span className="text-xl lg:text-2xl font-orbitron font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            NEW ERA
          </span>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-primary/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="p-4 lg:p-4 space-y-4 lg:space-y-6">
        <nav className="space-y-2 lg:space-y-3">
          {navigationItems.map((item) => {
            const isActive = activePage === item.path || 
                           (item.path.includes('?tab=') && activePage.includes(item.path.split('?tab=')[1]));
            
            return (
              <Button
                key={item.path}
                variant="ghost"
                className={cn(
                  "w-full justify-start h-12 lg:h-12 text-base lg:text-base font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary rounded-lg",
                  isActive && "bg-primary/15 text-primary shadow-sm border border-primary/20"
                )}
                onClick={() => handleNavigation(item.path)}
              >
                <item.icon className="mr-3 lg:mr-3 h-5 lg:h-5 w-5 lg:w-5" />
                {item.name}
              </Button>
            );
          })}

          <div className="pt-4 lg:pt-4 border-t border-border/50">
            <Button
              variant="ghost"
              className="w-full justify-start h-12 lg:h-12 text-base lg:text-base font-medium text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all duration-200"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 lg:mr-3 h-5 lg:h-5 w-5 lg:w-5" />
              Logout
            </Button>
          </div>
        </nav>
      </div>
    </aside>
  );
};
