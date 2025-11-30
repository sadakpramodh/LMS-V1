import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getGroups, saveGroups, getRoles, getStoredUsers } from "@/lib/localData";
import { Group } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Plus, Save } from "lucide-react";

const GroupsManagement = () => {
    const { hasPermission } = useAuth();
    const [groups, setGroups] = useState<Group[]>(getGroups());
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const roles = getRoles();
    const users = getStoredUsers();

    if (!hasPermission("add_users")) return <div>Access Denied</div>;

    const handleSaveGroup = () => {
        if (!editingGroup) return;

        if (isCreating) {
            const newGroup = { ...editingGroup, id: `group_${Date.now()}` };
            const updatedGroups = [...groups, newGroup];
            saveGroups(updatedGroups);
            setGroups(updatedGroups);
            toast.success("Group created");
        } else {
            const updatedGroups = groups.map((g) =>
                g.id === editingGroup.id ? editingGroup : g
            );
            saveGroups(updatedGroups);
            setGroups(updatedGroups);
            toast.success("Group updated");
        }
        setEditingGroup(null);
        setIsCreating(false);
    };

    const handleDeleteGroup = (groupId: string) => {
        const updatedGroups = groups.filter((g) => g.id !== groupId);
        saveGroups(updatedGroups);
        setGroups(updatedGroups);
        toast.success("Group deleted");
    };

    const toggleRole = (roleId: string) => {
        if (!editingGroup) return;
        const currentRoles = editingGroup.roleIds;
        const newRoles = currentRoles.includes(roleId)
            ? currentRoles.filter((r) => r !== roleId)
            : [...currentRoles, roleId];
        setEditingGroup({ ...editingGroup, roleIds: newRoles });
    };

    const toggleUser = (userId: string) => {
        if (!editingGroup) return;
        const currentUsers = editingGroup.userIds;
        const newUsers = currentUsers.includes(userId)
            ? currentUsers.filter((u) => u !== userId)
            : [...currentUsers, userId];
        setEditingGroup({ ...editingGroup, userIds: newUsers });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Groups Management</h2>
                <Button onClick={() => {
                    setEditingGroup({ id: "", name: "", description: "", roleIds: [], userIds: [] });
                    setIsCreating(true);
                }}>
                    <Plus className="mr-2 h-4 w-4" /> Create Group
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Existing Groups</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {groups.map((group) => (
                            <div
                                key={group.id}
                                className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 cursor-pointer"
                                onClick={() => {
                                    setEditingGroup(group);
                                    setIsCreating(false);
                                }}
                            >
                                <div>
                                    <div className="font-medium">{group.name}</div>
                                    <div className="text-sm text-muted-foreground">{group.description}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {group.userIds.length} members • {group.roleIds.length} roles
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteGroup(group.id);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                        {groups.length === 0 && <div className="text-muted-foreground text-center py-4">No groups found</div>}
                    </CardContent>
                </Card>

                {/* Editor */}
                {editingGroup && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{isCreating ? "New Group" : "Edit Group"}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Group Name</Label>
                                <Input
                                    value={editingGroup.name}
                                    onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                    value={editingGroup.description}
                                    onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Assigned Roles</Label>
                                <div className="border p-2 rounded max-h-40 overflow-y-auto space-y-1">
                                    {roles.map((role) => (
                                        <div key={role.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`g-role-${role.id}`}
                                                checked={editingGroup.roleIds.includes(role.id)}
                                                onCheckedChange={() => toggleRole(role.id)}
                                            />
                                            <Label htmlFor={`g-role-${role.id}`} className="text-sm font-normal cursor-pointer">
                                                {role.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Members</Label>
                                <div className="border p-2 rounded max-h-40 overflow-y-auto space-y-1">
                                    {users.map((user) => (
                                        <div key={user.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`g-user-${user.id}`}
                                                checked={editingGroup.userIds.includes(user.id)}
                                                onCheckedChange={() => toggleUser(user.id)}
                                            />
                                            <Label htmlFor={`g-user-${user.id}`} className="text-sm font-normal cursor-pointer">
                                                {user.full_name || user.email}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setEditingGroup(null)}>Cancel</Button>
                                <Button onClick={handleSaveGroup}>
                                    <Save className="mr-2 h-4 w-4" /> Save Group
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default GroupsManagement;
