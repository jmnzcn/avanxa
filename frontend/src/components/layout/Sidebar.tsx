import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Home,
  Target,
  BarChart3,
  Settings,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  userRole?: "USER" | "ADMIN";
  currentPath?: string;
}

const navigationItems = [
  { name: "Panel Principal", href: "/dashboard", icon: Home },
  { name: "Hábitos", href: "/habits", icon: Target },
  { name: "Progreso", href: "/progress", icon: BarChart3 },
  { name: "Configuración", href: "/settings", icon: Settings },
];

const adminItems = [{ name: "Panel de Admin", href: "/admin", icon: Users }];

export function Sidebar({
  isOpen = true,
  onToggle,
  userRole,
  currentPath,
}: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleMobileToggle = () => {
    setIsMobileOpen(!isMobileOpen);
    onToggle?.();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const allItems = [
    ...navigationItems,
    ...(userRole === "ADMIN" ? adminItems : []),
  ];

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleMobileToggle}
          className="fixed top-4 left-4 z-50"
        >
          {isMobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-background border-r transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          {
            "translate-x-0": isMobileOpen || isOpen,
            "-translate-x-full": !isMobileOpen && !isOpen,
          }
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <div className="flex items-center space-x-2">
              <img
                src="/images/placeholder-logo.svg"
                alt="Logo de Avanxa"
                className="h-8 w-8"
              />
              <span className="text-lg font-semibold">Avanxa</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {allItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    {
                      "bg-primary text-primary-foreground": isActive,
                      "text-muted-foreground hover:text-foreground hover:bg-accent":
                        !isActive,
                    }
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  <span className="flex-1">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user?.firstName?.charAt(0) || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user ? `${user.firstName} ${user.lastName}` : "Usuario"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || "usuario@ejemplo.com"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Cerrar sesión"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={handleMobileToggle}
        />
      )}
    </>
  );
}
