import { useState } from "react";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { AuditLog } from "@/components/admin/AuditLog";
import { AdminUser } from "@/types/admin";
import { BarChart3, Users, FileText, Shield } from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "audit">(
    "dashboard"
  );
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Administrador", href: "/admin" },
  ];

  const handleUserSelect = (user: AdminUser) => {
    setSelectedUser(user);
    // You can implement a modal or navigate to user details
    console.log("Selected user:", user);
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "dashboard":
        return <BarChart3 className="h-4 w-4" />;
      case "users":
        return <Users className="h-4 w-4" />;
      case "audit":
        return <FileText className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Breadcrumb items={breadcrumbItems} />

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Panel de Administrador</h1>
            <p className="text-muted-foreground">
              Administra usuarios, monitorea la salud del sistema y visualiza
              análisis
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium text-primary">
              Modo Administrador
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {[
            { id: "dashboard", label: "Panel Principal" },
            { id: "users", label: "Gestión de Usuarios" },
            { id: "audit", label: "Registro de Auditoría" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
              }`}
            >
              {getTabIcon(tab.id)}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "dashboard" && <AdminDashboard />}
      {activeTab === "users" && (
        <UserManagementTable onUserSelect={handleUserSelect} />
      )}
      {activeTab === "audit" && <AuditLog />}

      {/* User Details Modal (placeholder for future enhancement) */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Detalles del Usuario</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Nombre:</span>
                <p>
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
              </div>
              <div>
                <span className="font-medium">Email:</span>
                <p>{selectedUser.email}</p>
              </div>
              <div>
                <span className="font-medium">Rol:</span>
                <p>
                  {selectedUser.role === "ADMIN" ? "Administrador" : "Usuario"}
                </p>
              </div>
              <div>
                <span className="font-medium">Estado:</span>
                <p>{selectedUser.isBlocked ? "Bloqueado" : "Activo"}</p>
              </div>
              <div>
                <span className="font-medium">Hábitos:</span>
                <p>
                  {selectedUser.totalHabits} total,{" "}
                  {selectedUser.totalCompletions} completados
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
