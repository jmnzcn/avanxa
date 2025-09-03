import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      className={cn(
        "flex items-center space-x-1 text-sm text-muted-foreground",
        className
      )}
    >
      <Link
        to="/dashboard"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Inicio</span>
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4" />

          {item.isCurrent ? (
            <span className="text-foreground font-medium">{item.label}</span>
          ) : item.href ? (
            <Link
              to={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

// Predefined breadcrumb configurations
export const breadcrumbConfigs = {
  dashboard: [{ label: "Panel Principal", isCurrent: true }],
  habits: [{ label: "Hábitos", isCurrent: true }],
  habitsCreate: [
    { label: "Hábitos", href: "/habits" },
    { label: "Crear Hábito", isCurrent: true },
  ],
  habitsEdit: [
    { label: "Hábitos", href: "/habits" },
    { label: "Editar Hábito", isCurrent: true },
  ],
  progress: [{ label: "Progreso", isCurrent: true }],
  progressHabit: [
    { label: "Progreso", href: "/progress" },
    { label: "Detalle del Hábito", isCurrent: true },
  ],
  settings: [{ label: "Configuración", isCurrent: true }],
  admin: [{ label: "Panel de Admin", isCurrent: true }],
  adminUsers: [
    { label: "Panel de Admin", href: "/admin" },
    { label: "Usuarios", isCurrent: true },
  ],
};
