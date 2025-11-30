import { Shield, Users2, Lock, UserCog } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  if (!hasPermission("add_users")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <Shield className="h-16 w-16 text-muted-foreground" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                <p className="text-muted-foreground">
                  You don't have permission to access the admin panel.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const adminModules = [
    {
      title: "User Management",
      description: "Manage users, assign roles and groups.",
      icon: <Users2 className="h-8 w-8 text-primary" />,
      path: "/admin/users",
    },
    {
      title: "Roles & Permissions",
      description: "Define roles and assign system permissions.",
      icon: <Shield className="h-8 w-8 text-primary" />,
      path: "/admin/roles",
    },
    {
      title: "Groups",
      description: "Manage user groups and bulk assignments.",
      icon: <UserCog className="h-8 w-8 text-primary" />,
      path: "/admin/groups",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground mt-2">
            Manage system access, users, and configuration.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {adminModules.map((module) => (
          <Card
            key={module.path}
            className="hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => navigate(module.path)}
          >
            <CardHeader>
              <div className="mb-2">{module.icon}</div>
              <CardTitle>{module.title}</CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
