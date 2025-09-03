import { useNavigate } from "react-router-dom";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { HabitList } from "@/components/habits/HabitList";
import { Habit } from "@/types/habit";

export default function HabitsPage() {
  const navigate = useNavigate();

  const handleHabitSelect = (habit: Habit) => {
    navigate(`/progress/${habit.id}`);
  };

  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Mis Hábitos", href: "/habits" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Breadcrumb items={breadcrumbItems} />

        <div>
          <h1 className="text-3xl font-bold">Mis Hábitos</h1>
          <p className="text-muted-foreground">
            Gestiona y rastrea tus hábitos diarios para construir mejores
            rutinas
          </p>
        </div>
      </div>

      {/* Habit List */}
      <HabitList onHabitSelect={handleHabitSelect} />
    </div>
  );
}
