import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, UserCheck, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";

interface AdminTopbarProps {
  name: string;
  email: string;
  onProfile: () => void;
  onLogout: () => void;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({ name, email, onProfile, onLogout }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="w-full flex items-center justify-between px-6 py-3 bg-background/80 border-b border-border/30 shadow-sm z-50 relative">
      {/* Left: Brand */}
      <div className="font-orbitron font-bold text-xl tracking-widest text-primary flex items-center gap-2 select-none">
        <span className="text-glow">NEWERA</span>
      </div>
      {/* Right: Avatar and Name */}
      <div className="relative">
        <button
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/40 transition-colors focus:outline-none"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="font-semibold text-base text-foreground max-w-[120px] truncate">{name}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-background border border-border/30 rounded-lg shadow-lg z-50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 focus:outline-none">
                  <span className="hidden sm:inline font-medium text-sm text-muted-foreground">{email}</span>
                  <ChevronDown className="w-4 h-4 ml-1 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onProfile}>
                  <UserCheck className="w-4 h-4 mr-2 text-primary" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLogout} className="text-red-500 focus:text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
};
