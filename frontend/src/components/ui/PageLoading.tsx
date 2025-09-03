import { LoadingSpinner } from "./LoadingSpinner";

interface PageLoadingProps {
  message?: string;
  showSkeleton?: boolean;
}

export function PageLoading({
  message = "Cargando página...",
  showSkeleton = true,
}: PageLoadingProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-6">
        <LoadingSpinner size="lg" className="text-primary" />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">{message}</h2>
          <p className="text-sm text-muted-foreground">
            Por favor espera mientras cargamos el contenido
          </p>
        </div>
      </div>

      {showSkeleton && (
        <div className="w-full max-w-4xl mt-12 space-y-6">
          {/* Header skeleton */}
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded-md w-1/3 animate-pulse"></div>
            <div className="h-4 bg-muted rounded-md w-2/3 animate-pulse"></div>
          </div>

          {/* Content skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-muted rounded-md w-3/4 animate-pulse"></div>
                <div className="h-3 bg-muted rounded-md w-full animate-pulse"></div>
                <div className="h-3 bg-muted rounded-md w-2/3 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
