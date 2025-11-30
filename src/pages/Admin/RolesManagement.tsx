import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getRoles, saveRoles } from "@/lib/localData";
import { Role } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Plus, Save } from "lucide-react";

// Define available permissions (could be moved to a shared constant)
const AVAILABLE_PERMISSIONS = [
    { id: "add_dispute", label: "Add Dispute" },
    { id: "delete_dispute", label: "Delete Dispute" },
    { id: "upload_excel_litigation", label: "Upload Excel" },
    { id: "add_users", label: "Add Users" },
    { id: "delete_users", label: "Delete Users" },
    { id: "export_reports", label: "Export Reports" },
];

const RolesManagement = () => {
    const { hasPermission } = useAuth();
    const [roles, setRoles] = useState<Role[]>(getRoles());
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Permission check
    if (!hasPermission("add_users")) { // Reusing add_users for admin access for now
        return <div>Access Denied</div>;
    }

    const handleSaveRole = () => {
        if (!editingRole) return;

        if (isCreating) {
            const newRole = { ...editingRole, id: `role_${Date.now()}` };
            const updatedRoles = [...roles, newRole];
            saveRoles(updatedRoles);
            setRoles(updatedRoles);
            toast.success("Role created");
        } else {
            const updatedRoles = roles.map((r) =>
                r.id === editingRole.id ? editingRole : r
            );
            saveRoles(updatedRoles);
            setRoles(updatedRoles);
            toast.success("Role updated");
        }
        setEditingRole(null);
        setIsCreating(false);
    };

    const handleDeleteRole = (roleId: string) => {
        const updatedRoles = roles.filter((r) => r.id !== roleId);
        saveRoles(updatedRoles);
        setRoles(updatedRoles);
        toast.success("Role deleted");
    };

    const togglePermission = (permissionId: string) => {
        if (!editingRole) return;
        const currentPerms = editingRole.permissionIds;
        const newPerms = currentPerms.includes(permissionId)
            ? currentPerms.filter((p) => p !== permissionId)
            : [...currentPerms, permissionId];

        setEditingRole({ ...editingRole, permissionIds: newPerms });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Roles Management</h2>
                <Button onClick={() => {
                    setEditingRole({ id: "", name: "", description: "", permissionIds: [] });
                    setIsCreating(true);
                }}>
                    <Plus className="mr-2 h-4 w-4" /> Create Role
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Role List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Existing Roles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {roles.map((role) => (
                            <div
                                key={role.id}
                                className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 cursor-pointer"
                                onClick={() => {
                                    setEditingRole(role);
                                    setIsCreating(false);
                                }}
                            >
                                <div>
                                    <div className="font-medium">{role.name}</div>
                                    <div className="text-sm text-muted-foreground">{role.description}</div>
                                </div>
                                {role.isSystem ? (
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">System</span>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteRole(role.id);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Editor */}
                {editingRole && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{isCreating ? "New Role" : "Edit Role"}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Role Name</Label>
                                <Input
                                    value={editingRole.name}
                                    onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                                    disabled={!isCreating && editingRole.isSystem}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                    value={editingRole.description}
                                    onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Permissions</Label>
                                <div className="grid grid-cols-2 gap-2 border p-4 rounded">
                                    {AVAILABLE_PERMISSIONS.map((perm) => (
                                        <div key={perm.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={perm.id}
                                                checked={editingRole.permissionIds.includes(perm.id) || editingRole.permissionIds.includes("*")}
                                                onCheckedChange={() => togglePermission(perm.id)}
                                                disabled={editingRole.permissionIds.includes("*")}
                                            />
                                            <Label htmlFor={perm.id} className="text-sm font-normal cursor-pointer">
                                                {perm.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {editingRole.permissionIds.includes("*") && (
                                    <p className="text-xs text-amber-600">This role has full system access (*)</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setEditingRole(null)}>Cancel</Button>
                                <Button onClick={handleSaveRole}>
                                    <Save className="mr-2 h-4 w-4" /> Save Role
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default RolesManagement;
