import { type Permission } from "@/types/permissions";
import { type Role, type Group } from "@/types/auth";

const isBrowser = typeof window !== "undefined";

const USERS_KEY = "lms-users";
const SESSION_KEY = "lms-session";
const PERMISSIONS_KEY = "lms-permissions"; // Legacy, can be migrated or kept for direct overrides
const DISPUTES_KEY = "lms-disputes";
const PROFILES_KEY = "lms-profiles";
const ALERTS_KEY = "lms-alert-settings";
const ROLES_KEY = "lms-roles";
const GROUPS_KEY = "lms-groups";

export const DEFAULT_ADMIN_EMAIL = "sadakpramodh_maduru@welspun.com";
const DEFAULT_ADMIN_PASSWORD = "admin123";

export interface LocalUser {
  id: string;
  email: string;
  password: string;
  full_name?: string;
  avatar_url?: string;
  is_enabled: boolean;
  last_sign_in_at?: string;
  roleIds: string[];
  groupIds: string[];
}

export interface StoredProfile {
  full_name?: string;
  avatar_url?: string;
}

export interface StoredAlertSettings {
  email_alerts: boolean;
  whatsapp_alerts: boolean;
  whatsapp_number: string;
}

export interface StoredDispute {
  id: string;
  user_id: string;
  company: string;
  dispute_type: string;
  value: number;
  notice_from: string;
  notice_date: string;
  reply_due_date: string;
  responsible_user: string;
  description: string | null;
  status: string;
  document_paths: string[];
  created_at: string;
  updated_at: string;
}

const readJson = <T>(key: string, fallback: T): T => {
  if (!isBrowser) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Failed to parse local storage key ${key}:`, error);
    return fallback;
  }
};

const writeJson = <T>(key: string, value: T) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to persist local storage key ${key}:`, error);
  }
};

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
};

// --- ROLES & GROUPS ---

const DEFAULT_ROLES: Role[] = [
  {
    id: "role_admin",
    name: "Admin",
    description: "Full system access",
    permissionIds: ["*"], // Wildcard for full access
    isSystem: true,
  },
  {
    id: "role_user",
    name: "User",
    description: "Standard user access",
    permissionIds: [],
    isSystem: true,
  },
];

export const getRoles = (): Role[] => {
  const roles = readJson<Role[]>(ROLES_KEY, []);
  if (roles.length === 0) {
    // Seed default roles
    writeJson(ROLES_KEY, DEFAULT_ROLES);
    return DEFAULT_ROLES;
  }
  return roles;
};

export const saveRoles = (roles: Role[]) => {
  writeJson(ROLES_KEY, roles);
};

export const getGroups = (): Group[] => {
  return readJson<Group[]>(GROUPS_KEY, []);
};

export const saveGroups = (groups: Group[]) => {
  writeJson(GROUPS_KEY, groups);
};

// --- USERS ---

const seedAdminUser = (users: LocalUser[]): LocalUser[] => {
  if (users.some((user) => user.email === DEFAULT_ADMIN_EMAIL)) {
    return users;
  }

  const admin: LocalUser = {
    id: generateId(),
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD,
    full_name: "Welspun Admin",
    is_enabled: true,
    avatar_url: "",
    last_sign_in_at: new Date().toISOString(),
    roleIds: ["role_admin"],
    groupIds: [],
  };

  const nextUsers = [...users, admin];
  writeJson(USERS_KEY, nextUsers);
  return nextUsers;
};

export const getStoredUsers = (): LocalUser[] => {
  const users = readJson<LocalUser[]>(USERS_KEY, []);
  // Migration: Ensure new fields exist
  const migratedUsers = users.map(u => ({
    ...u,
    roleIds: u.roleIds || [],
    groupIds: u.groupIds || []
  }));

  return seedAdminUser(migratedUsers);
};

export const saveStoredUsers = (users: LocalUser[]) => {
  writeJson(USERS_KEY, users);
};

export const getCurrentUser = (): LocalUser | null => {
  const userId = readJson<string | null>(SESSION_KEY, null);
  if (!userId) return null;
  const users = getStoredUsers();
  return users.find((item) => item.id === userId) ?? null;
};

export const setCurrentUser = (userId: string | null) => {
  if (!isBrowser) return;
  if (userId) {
    writeJson(SESSION_KEY, userId);
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
};

export const signInLocalUser = (
  email: string,
  password: string
): { user: LocalUser | null; error: string | null } => {
  const users = getStoredUsers();
  const user = users.find((item) => item.email === email);

  if (!user || user.password !== password) {
    return { user: null, error: "Invalid email or password" };
  }

  const updatedUser: LocalUser = {
    ...user,
    last_sign_in_at: new Date().toISOString(),
  };

  const nextUsers = users.map((item) => (item.id === user.id ? updatedUser : item));
  saveStoredUsers(nextUsers);
  setCurrentUser(updatedUser.id);

  return { user: updatedUser, error: null };
};

export const signUpLocalUser = (
  email: string,
  password: string,
  fullName: string
): { user: LocalUser | null; error: string | null } => {
  const users = getStoredUsers();
  if (users.some((item) => item.email === email)) {
    return { user: null, error: "Email is already registered" };
  }

  const newUser: LocalUser = {
    id: generateId(),
    email,
    password,
    full_name: fullName,
    is_enabled: true,
    avatar_url: "",
    last_sign_in_at: new Date().toISOString(),
    roleIds: ["role_user"], // Default role
    groupIds: [],
  };

  const nextUsers = [...users, newUser];
  saveStoredUsers(nextUsers);
  setCurrentUser(newUser.id);

  return { user: newUser, error: null };
};

export const signOutLocalUser = () => {
  setCurrentUser(null);
};

// --- PERMISSIONS AGGREGATION ---

export const getPermissionsMap = (): Record<string, Permission[]> => {
  return readJson<Record<string, Permission[]>>(PERMISSIONS_KEY, {});
};

export const savePermissionsMap = (map: Record<string, Permission[]>) => {
  writeJson(PERMISSIONS_KEY, map);
};

export const getEffectivePermissions = (user: LocalUser): string[] => {
  if (user.email === DEFAULT_ADMIN_EMAIL) return ["*"];

  const roles = getRoles();
  const groups = getGroups();

  const permissionSet = new Set<string>();

  // 1. Direct Roles
  user.roleIds.forEach(roleId => {
    const role = roles.find(r => r.id === roleId);
    if (role) {
      role.permissionIds.forEach(p => permissionSet.add(p));
    }
  });

  // 2. Group Roles
  user.groupIds.forEach(groupId => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      group.roleIds.forEach(roleId => {
        const role = roles.find(r => r.id === roleId);
        if (role) {
          role.permissionIds.forEach(p => permissionSet.add(p));
        }
      });
    }
  });

  // 3. Legacy/Direct Permissions (Optional, keeping for backward compat if needed)
  // const directPermissions = getPermissionsMap()[user.id] || [];
  // directPermissions.forEach(p => permissionSet.add(p));

  return Array.from(permissionSet);
};

// Kept for compatibility but now returns string[] of permission IDs mostly
export const getPermissionsForUser = (
  userId: string,
  email?: string
): Permission[] => {
  // This function signature returns Permission[] type from legacy types
  // We might need to map our new string IDs to that type or update the type.
  // For now, let's just return what we can or cast.
  // Actually, the legacy Permission type is a union of strings.
  // So string[] is compatible if we cast.

  const users = getStoredUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return [];

  const perms = getEffectivePermissions(user);
  if (perms.includes("*")) {
    return [
      "add_dispute",
      "delete_dispute",
      "upload_excel_litigation",
      "add_users",
      "delete_users",
      "export_reports",
    ];
  }

  // Filter to match legacy Permission type for now to avoid breaking other files immediately
  // In a real refactor we would update the Permission type to be dynamic.
  return perms as Permission[];
};

export const updatePermissionsForUser = (
  userId: string,
  permissions: Permission[]
) => {
  // Legacy support: maybe create a custom role for this user?
  // Or just ignore for now as we move to Role based.
  const map = getPermissionsMap();
  map[userId] = permissions;
  savePermissionsMap(map);
};

export const getAdminUsersWithPermissions = () => {
  const users = getStoredUsers();

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    full_name: user.full_name ?? user.email,
    is_enabled: user.is_enabled,
    last_sign_in_at: user.last_sign_in_at,
    permissions: getPermissionsForUser(user.id, user.email),
    roleIds: user.roleIds,
    groupIds: user.groupIds
  }));
};

export const updateUserAccess = (userId: string, isEnabled: boolean) => {
  const users = getStoredUsers();
  const updated = users.map((user) =>
    user.id === userId ? { ...user, is_enabled: isEnabled } : user
  );
  saveStoredUsers(updated);
};

export const getStoredProfile = (userId: string): StoredProfile | null => {
  const profiles = readJson<Record<string, StoredProfile>>(PROFILES_KEY, {});
  return profiles[userId] ?? null;
};

export const updateStoredProfile = (userId: string, profile: StoredProfile) => {
  const profiles = readJson<Record<string, StoredProfile>>(PROFILES_KEY, {});
  profiles[userId] = profile;
  writeJson(PROFILES_KEY, profiles);

  const users = getStoredUsers();
  const updatedUsers = users.map((user) =>
    user.id === userId
      ? { ...user, full_name: profile.full_name ?? user.full_name, avatar_url: profile.avatar_url }
      : user
  );
  saveStoredUsers(updatedUsers);
};

export const getStoredAlertSettings = (
  userId: string
): StoredAlertSettings => {
  const settings = readJson<Record<string, StoredAlertSettings>>(ALERTS_KEY, {});
  return (
    settings[userId] ?? {
      email_alerts: true,
      whatsapp_alerts: false,
      whatsapp_number: "",
    }
  );
};

export const updateStoredAlertSettings = (
  userId: string,
  alertSettings: StoredAlertSettings
) => {
  const settings = readJson<Record<string, StoredAlertSettings>>(ALERTS_KEY, {});
  settings[userId] = alertSettings;
  writeJson(ALERTS_KEY, settings);
};

export const getLocalDisputes = (userId: string): StoredDispute[] => {
  const disputes = readJson<Record<string, StoredDispute[]>>(DISPUTES_KEY, {});
  return disputes[userId] ?? [];
};

export const addLocalDispute = (
  userId: string,
  payload: Omit<StoredDispute, "id" | "user_id" | "created_at" | "updated_at">,
  documentPaths: string[]
): StoredDispute => {
  const disputes = readJson<Record<string, StoredDispute[]>>(DISPUTES_KEY, {});
  const now = new Date().toISOString();
  const newDispute: StoredDispute = {
    ...payload,
    id: generateId(),
    user_id: userId,
    document_paths: documentPaths,
    created_at: now,
    updated_at: now,
  };

  const updated = [newDispute, ...(disputes[userId] ?? [])];
  disputes[userId] = updated;
  writeJson(DISPUTES_KEY, disputes);
  return newDispute;
};

export const removeLocalDispute = (userId: string, disputeId: string) => {
  const disputes = readJson<Record<string, StoredDispute[]>>(DISPUTES_KEY, {});
  const filtered = (disputes[userId] ?? []).filter((item) => item.id !== disputeId);
  disputes[userId] = filtered;
  writeJson(DISPUTES_KEY, disputes);
  return filtered;
};

export const updateLocalDisputeStatus = (
  userId: string,
  disputeId: string,
  status: string
) => {
  const disputes = readJson<Record<string, StoredDispute[]>>(DISPUTES_KEY, {});
  const updated = (disputes[userId] ?? []).map((item) =>
    item.id === disputeId ? { ...item, status, updated_at: new Date().toISOString() } : item
  );
  disputes[userId] = updated;
  writeJson(DISPUTES_KEY, disputes);
  return updated;
};
