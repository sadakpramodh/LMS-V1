import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
    getStoredUsers,
    saveStoredUsers,
    getRoles,
    getGroups,
    updateUserAccess,
    type LocalUser,
} from "@/lib/localData";
// import { LocalUser } from "@/types/auth"; // Removed incorrect import
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const UserManagement = () => {
    const { hasPermission, user: currentUser } = useAuth();
    const [users, setUsers] = useState<LocalUser[]>(getStoredUsers());
    const [editingUser, setEditingUser] = useState<LocalUser | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const roles = getRoles();
    const groups = getGroups();

    if (!hasPermission("add_users")) return <div>Access Denied</div>;

    const handleSaveUser = () => {
        if (!editingUser) return;

        const updatedUsers = users.map((u) =>
            u.id === editingUser.id ? editingUser : u
        );
        saveStoredUsers(updatedUsers);
        setUsers(updatedUsers);
        toast.success("User updated");
        setEditingUser(null);
    };

    const toggleUserRole = (roleId: string) => {
        if (!editingUser) return;
        const currentRoles = editingUser.roleIds || [];
        const newRoles = currentRoles.includes(roleId)
            ? currentRoles.filter((r) => r !== roleId)
            : [...currentRoles, roleId];
        setEditingUser({ ...editingUser, roleIds: newRoles });
    };

    const toggleUserGroup = (groupId: string) => {
        if (!editingUser) return;
        const currentGroups = editingUser.groupIds || [];
        const newGroups = currentGroups.includes(groupId)
            ? currentGroups.filter((g) => g !== groupId)
            : [...currentGroups, groupId];
        setEditingUser({ ...editingUser, groupIds: newGroups });
    };

    const handleToggleAccess = (userId: string, isEnabled: boolean) => {
        updateUserAccess(userId, isEnabled);
        setUsers(getStoredUsers()); // Refresh list
        toast.success(`User ${isEnabled ? "enabled" : "disabled"}`);
    };

    const filteredUsers = users.filter(u =>
        (u.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">User Management</h2>
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* User List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Users</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                        {filteredUsers.map((user) => (
                            <div
                                key={user.id}
                                className={`flex items-center justify-between p-3 border rounded cursor-pointer ${editingUser?.id === user.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                                onClick={() => setEditingUser(user)}
                            >
                                <div>
                                    <div className="font-medium">{user.full_name || "Unknown"}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                        {user.roleIds?.map(rid => {
                                            const r = roles.find(role => role.id === rid);
                                            return r ? <Badge key={rid} variant="secondary" className="text-[10px]">{r.name}</Badge> : null;
                                        })}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={user.is_enabled}
                                        onCheckedChange={(checked) => {
                                            handleToggleAccess(user.id, checked);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        disabled={currentUser?.id === user.id}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Editor */}
                {editingUser ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit User: {editingUser.full_name || editingUser.email}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            <div className="space-y-2">
                                <Label>Assigned Roles</Label>
                                <div className="border p-2 rounded max-h-40 overflow-y-auto space-y-1">
                                    {roles.map((role) => (
                                        <div key={role.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`u-role-${role.id}`}
                                                checked={(editingUser.roleIds || []).includes(role.id)}
                                                onCheckedChange={() => toggleUserRole(role.id)}
                                            />
                                            <Label htmlFor={`u-role-${role.id}`} className="text-sm font-normal cursor-pointer">
                                                {role.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Assigned Groups</Label>
                                <div className="border p-2 rounded max-h-40 overflow-y-auto space-y-1">
                                    {groups.map((group) => (
                                        <div key={group.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`u-group-${group.id}`}
                                                checked={(editingUser.groupIds || []).includes(group.id)}
                                                onCheckedChange={() => toggleUserGroup(group.id)}
                                            />
                                            <Label htmlFor={`u-group-${group.id}`} className="text-sm font-normal cursor-pointer">
                                                {group.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                                <Button onClick={handleSaveUser}>
                                    <Save className="mr-2 h-4 w-4" /> Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground border rounded-lg border-dashed p-8">
                        Select a user to edit roles and groups
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
