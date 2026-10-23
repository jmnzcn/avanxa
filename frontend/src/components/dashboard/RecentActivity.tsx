import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Clock, Target, Calendar } from "lucide-react";

export interface ActivityItem {
  id: string;
  type: "completed" | "missed" | "streak" | "achievement";
  habitName: string;
  description: string;
  timestamp: string;
  icon: React.ReactNode;
  color: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

function ActivityRow({ activity }: { activity: ActivityItem }) {
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Completado
          </Badge>
        );
      case "missed":
        return <Badge variant="destructive">Perdido</Badge>;
      case "streak":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Racha
          </Badge>
        );
      case "achievement":
        return (
          <Badge
            variant="outline"
            className="border-yellow-400 text-yellow-700"
          >
            Logro
          </Badge>
        );
      default:
        return <Badge variant="outline">Actividad</Badge>;
    }
  };

  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className={`p-2 rounded-full ${activity.color} mt-1`}>
        {activity.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-medium text-foreground truncate">
            {activity.habitName}
          </h4>
          {getTypeBadge(activity.type)}
        </div>

        <p className="text-sm text-muted-foreground mb-2">
          {activity.description}
        </p>

        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{activity.timestamp}</span>
        </div>
      </div>
    </div>
  );
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const displayActivities = activities;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-primary" />
          <span>Actividad Reciente</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayActivities.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}
        </div>

        {displayActivities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay actividad reciente</p>
            <p className="text-sm">
              ¡Comienza a crear hábitos para ver tu actividad aquí!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
