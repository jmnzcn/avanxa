import { env } from "@/config/env";

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img
                src="/images/placeholder-logo.svg"
                alt="Logo de Avanxa"
                className="h-8 w-8"
              />
              <span className="text-lg font-semibold">{env.VITE_APP_NAME}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Rastrea tus hábitos, construye mejores rutinas y logra tus
              objetivos con nuestra aplicación integral de seguimiento de
              hábitos.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Producto</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="#features"
                  className="hover:text-foreground transition-colors"
                >
                  Características
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="hover:text-foreground transition-colors"
                >
                  Precios
                </a>
              </li>
              <li>
                <a
                  href="#api"
                  className="hover:text-foreground transition-colors"
                >
                  API
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Empresa</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="#about"
                  className="hover:text-foreground transition-colors"
                >
                  Acerca de
                </a>
              </li>
              <li>
                <a
                  href="#blog"
                  className="hover:text-foreground transition-colors"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#careers"
                  className="hover:text-foreground transition-colors"
                >
                  Carreras
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Soporte</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="#help"
                  className="hover:text-foreground transition-colors"
                >
                  Centro de Ayuda
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="hover:text-foreground transition-colors"
                >
                  Contacto
                </a>
              </li>
              <li>
                <a
                  href="#privacy"
                  className="hover:text-foreground transition-colors"
                >
                  Política de Privacidad
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © 2024 {env.VITE_APP_NAME}. Todos los derechos reservados.
            </p>
            <p className="text-sm text-muted-foreground">
              Versión {env.VITE_APP_VERSION}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
