import { Shield, CheckCircle } from "lucide-react";
import { usePermissions, useAdminUsers, Permission } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

const PERMISSION_LABELS: Record<Permission, string> = {
  add_dispute: "Add Dispute",
  delete_dispute: "Delete Dispute",
  upload_excel_litigation: "Upload Excel",
  add_users: "Add Users",
  delete_users: "Delete Users",
  export_reports: "Export Reports",
};

export default function Admin() {
  const { isAdmin, isLoading: permissionsLoading } = usePermissions();
  const { users, isLoading: usersLoading, grantPermission, revokePermission, updateUserAccess } =
    useAdminUsers();
  const { user: currentUser } = useAuth();

  const permissionKeys = Object.keys(PERMISSION_LABELS) as Permission[];
  const totalColumns = 2 + permissionKeys.length + 1;

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin()) {
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

  const handleTogglePermission = (userId: string, permission: Permission, hasPermission: boolean) => {
    if (hasPermission) {
      revokePermission.mutate({ userId, permission });
    } else {
      grantPermission.mutate({ userId, permission });
    }
  };

  const handleToggleUserAccess = (userId: string, isEnabled: boolean) => {
    updateUserAccess.mutate({ userId, isEnabled });
  };

  const enabledUsers = users.filter((user) => user.is_enabled).length;
  const pendingUsers = users.length - enabledUsers;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          <p className="mt-1 text-muted-foreground">Manage users and permissions</p>
        </div>
      </div>

      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Permissions Management
          </CardTitle>
        </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Access</TableHead>
                    {permissionKeys.map((key) => (
                      <TableHead key={key} className="text-center">
                        {PERMISSION_LABELS[key]}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                    <TableCell colSpan={totalColumns} className="text-center py-8 text-muted-foreground">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={totalColumns} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="transition-colors hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {user.full_name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{user.email}</span>
                          {!user.is_enabled && (
                            <span className="text-xs text-amber-600">Awaiting activation</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Switch
                            checked={user.is_enabled}
                            onCheckedChange={(checked) =>
                              handleToggleUserAccess(user.id, checked)
                            }
                            disabled={updateUserAccess.isPending || currentUser?.id === user.id}
                            aria-label={`Toggle access for ${user.email}`}
                          />
                          <Badge
                            variant="outline"
                            className={
                              user.is_enabled
                                ? "bg-emerald-100 text-emerald-700 border-transparent"
                                : "bg-amber-100 text-amber-700 border-transparent"
                            }
                          >
                            {user.is_enabled ? "Enabled" : "Pending"}
                          </Badge>
                        </div>
                      </TableCell>
                      {permissionKeys.map((permission) => {
                        const hasPermission = user.permissions.includes(permission as Permission);
                        return (
                          <TableCell key={permission} className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={hasPermission}
                                onCheckedChange={() =>
                                  handleTogglePermission(
                                    user.id,
                                    permission,
                                    hasPermission
                                  )
                                }
                              />
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-sm">Permission Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Badge variant="outline">{key}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-sm">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Users</span>
              <span className="font-semibold text-foreground">{users.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Admin Users</span>
              <span className="font-semibold text-foreground">
                {users.filter(u =>
                  u.permissions.includes("add_users") &&
                  u.permissions.includes("delete_users")
                ).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Accounts</span>
              <span className="font-semibold text-foreground">{enabledUsers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pending Activation</span>
              <span className="font-semibold text-amber-600">{pendingUsers}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-sm">System Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">RLS Enabled</span>
              <CheckCircle className="h-4 w-4 text-success" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Permissions</span>
              <span className="font-semibold text-foreground">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Account Approvals</span>
              <span className="font-semibold text-foreground">
                {pendingUsers === 0 ? "All approved" : `${pendingUsers} awaiting`}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
