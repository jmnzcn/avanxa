import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { env } from "@/config/env";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLoginClick = () => {
    navigate("/login");
  };

  const handleRegisterClick = () => {
    navigate("/register");
  };

  const handleDashboardClick = () => {
    navigate("/dashboard");
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <img
                src="/images/placeholder-logo.svg"
                alt="Logo de Avanxa"
                className="h-8 w-8"
              />
              <span className="text-xl font-bold text-foreground">
                {env.VITE_APP_NAME}
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-4">
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Características
            </a>
            <a
              href="#about"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Acerca de
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDashboardClick}
                >
                  Panel Principal
                </Button>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Hola, {user?.firstName}
                  </span>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Cerrar Sesión
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={handleLoginClick}>
                  Iniciar Sesión
                </Button>
                <Button size="sm" onClick={handleRegisterClick}>
                  Comenzar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
