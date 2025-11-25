import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import {
  DEFAULT_ADMIN_EMAIL,
  getAdminUsersWithPermissions,
  getPermissionsForUser,
  updatePermissionsForUser,
  updateUserAccess as updateStoredUserAccess,
} from "@/lib/localData";
import { type Permission } from "@/types/permissions";

export type { Permission } from "@/types/permissions";

export type Permission =
  | "add_dispute"
  | "delete_dispute"
  | "upload_excel_litigation"
  | "add_users"
  | "delete_users"
  | "export_reports";

const ALL_PERMISSIONS: Permission[] = [
  "add_dispute",
  "delete_dispute",
  "upload_excel_litigation",
  "add_users",
  "delete_users",
  "export_reports",
];

const DEFAULT_ADMIN_EMAIL = "sadakpramodh_maduru@welspun.com";

export const usePermissions = () => {
  const { user } = useAuth();
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["user-permissions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      if (user.email === DEFAULT_ADMIN_EMAIL) {
        return ALL_PERMISSIONS;
      }

      return getPermissionsForUser(user.id, user.email);
    },
  });

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const isAdmin = (): boolean => {
    return hasPermission("add_users") && hasPermission("delete_users");
  };

  return {
    permissions,
    hasPermission,
    isAdmin,
    isLoading,
  };
};

interface User {
  id: string;
  email: string;
  full_name?: string;
  is_enabled: boolean;
  last_sign_in_at?: string | null;
  permissions: Permission[];
}

export const useAdminUsers = () => {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      return getAdminUsersWithPermissions();
    },
  });

  const grantPermission = useMutation({
    mutationFn: async ({ userId, permission }: { userId: string; permission: Permission }) => {
      const existing = getPermissionsForUser(userId);
      if (!existing.includes(permission)) {
        updatePermissionsForUser(userId, [...existing, permission]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Permission granted successfully");
    },
    onError: (error: unknown) => {
      console.error("Error granting permission:", error);
      const message =
        error instanceof Error ? error.message : "Failed to grant permission";
      toast.error(message);
    },
  });

  const revokePermission = useMutation({
    mutationFn: async ({ userId, permission }: { userId: string; permission: Permission }) => {
      const existing = getPermissionsForUser(userId);
      updatePermissionsForUser(
        userId,
        existing.filter((item) => item !== permission)
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Permission revoked successfully");
    },
    onError: (error: unknown) => {
      console.error("Error revoking permission:", error);
      const message =
        error instanceof Error ? error.message : "Failed to revoke permission";
      toast.error(message);
    },
  });

  const updateUserAccess = useMutation({
    mutationFn: async ({
      userId,
      isEnabled,
    }: {
      userId: string;
      isEnabled: boolean;
    }) => {
      updateStoredUserAccess(userId, isEnabled);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(
        variables.isEnabled
          ? "User access enabled"
          : "User access disabled"
      );
    },
    onError: (error: unknown) => {
      console.error("Error updating user access:", error);
      const message =
        error instanceof Error ? error.message : "Failed to update user access";
      toast.error(message);
    },
  });

  return {
    users,
    isLoading,
    grantPermission,
    revokePermission,
    updateUserAccess,
  };
};
