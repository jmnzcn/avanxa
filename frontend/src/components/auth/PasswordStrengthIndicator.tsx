import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export function PasswordStrengthIndicator({
  password,
  className,
}: PasswordStrengthIndicatorProps) {
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: "", color: "", feedback: [] };

    let score = 0;
    const feedback: string[] = [];

    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push("Al menos 8 caracteres");

    // Lowercase check
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push("Incluir minúsculas");

    // Uppercase check
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push("Incluir mayúsculas");

    // Number check
    if (/\d/.test(password)) score += 1;
    else feedback.push("Incluir números");

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push("Incluir caracteres especiales");

    let label = "";
    let color = "";

    if (score === 0) {
      label = "Muy débil";
      color = "bg-destructive";
    } else if (score === 1) {
      label = "Débil";
      color = "bg-destructive/70";
    } else if (score === 2) {
      label = "Regular";
      color = "bg-yellow-500";
    } else if (score === 3) {
      label = "Buena";
      color = "bg-yellow-400";
    } else if (score === 4) {
      label = "Fuerte";
      color = "bg-green-500";
    } else {
      label = "Muy fuerte";
      color = "bg-green-600";
    }

    return { score, label, color, feedback };
  };

  const { score, label, color, feedback } = getPasswordStrength(password);
  const maxScore = 5;

  if (!password) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            Fortaleza de la contraseña:
          </span>
          <span className="font-medium">{label}</span>
        </div>
        <div className="flex space-x-1">
          {Array.from({ length: maxScore }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors",
                index < score ? color : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Feedback */}
      {feedback.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Para mejorar tu contraseña:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {feedback.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
