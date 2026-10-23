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
      <Breadcrumb items={breadcrumbItems} />

      {/* Habit List (incluye título y botón de crear) */}
      <HabitList onHabitSelect={handleHabitSelect} />
    </div>
  );
}
